import { prisma } from '@/lib/db'
import { INTL_LOCALE, type Lang } from '@/lib/i18n/config'

export type NextStep = { chapterId: number; title: string; kind: 'resume' | 'next'; seconds: number; duration: number }

export type CourseProgress = {
  id: number
  slug: string
  title: string
  logo: string
  category: { id: number; title: string } | null
  total: number
  completed: number
  inProgress: number
  percent: number
  watchedSeconds: number
  lastActivity: Date
  next: NextStep | null // null = cours terminé
  firstChapterId: number | null
}

export type RecentActivity = {
  courseId: number
  chapterId: number
  chapterTitle: string
  courseSlug: string
  courseTitle: string
  completed: boolean
  seconds: number
  duration: number
  updatedAt: Date
}

export type Dashboard = {
  courses: CourseProgress[]
  recent: RecentActivity[]
  totals: {
    coursesStarted: number
    coursesFinished: number
    videosCompleted: number
    videosInProgress: number
    videosTotal: number // vidéos des cours commencés
    watchedSeconds: number
    percent: number
  }
}

/** Tout ce qu'un membre a regardé : par cours (avancement, prochaine vidéo) et en global. */
export async function getDashboard(userId: number): Promise<Dashboard> {
  const rows = await prisma.videoProgress.findMany({
    where: { userId, chapter: { available: true, course: { available: true } } },
    orderBy: { updatedAt: 'desc' },
    select: {
      seconds: true,
      duration: true,
      completed: true,
      updatedAt: true,
      chapter: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: { select: { id: true, slug: true, title: true, logo: true, category: { select: { id: true, title: true } } } },
        },
      },
    },
  })

  const courseIds = [...new Set(rows.map((r) => r.chapter.courseId))]
  const chapters = courseIds.length
    ? await prisma.chapter.findMany({
        where: { courseId: { in: courseIds }, available: true },
        orderBy: [{ numOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, title: true, courseId: true },
      })
    : []
  const chaptersByCourse = new Map<number, typeof chapters>()
  for (const c of chapters) chaptersByCourse.set(c.courseId, [...(chaptersByCourse.get(c.courseId) ?? []), c])

  const courses: CourseProgress[] = []
  for (const courseId of courseIds) {
    const list = chaptersByCourse.get(courseId) ?? []
    const mine = rows.filter((r) => r.chapter.courseId === courseId) // déjà triées : la plus récente d'abord
    const doneIds = new Set(mine.filter((r) => r.completed).map((r) => r.chapter.id))
    const completed = list.filter((c) => doneIds.has(c.id)).length
    const inProgress = mine.filter((r) => !r.completed && r.seconds > 0).length

    const resume = mine.find((r) => !r.completed && r.seconds > 0)
    const afterLast = list.find((c) => !doneIds.has(c.id))
    const next: NextStep | null = resume
      ? { chapterId: resume.chapter.id, title: resume.chapter.title, kind: 'resume', seconds: resume.seconds, duration: resume.duration }
      : afterLast
        ? { chapterId: afterLast.id, title: afterLast.title, kind: 'next', seconds: 0, duration: 0 }
        : null

    const course = mine[0].chapter.course
    courses.push({
      id: course.id,
      slug: course.slug,
      title: course.title.trim(),
      logo: course.logo,
      category: course.category ?? null,
      total: list.length,
      completed,
      inProgress,
      percent: list.length ? Math.round((completed / list.length) * 100) : 0,
      watchedSeconds: mine.reduce((sum, r) => sum + (r.completed ? r.duration : r.seconds), 0),
      lastActivity: mine[0].updatedAt,
      next,
      firstChapterId: list[0]?.id ?? null,
    })
  }
  courses.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())

  const videosCompleted = courses.reduce((s, c) => s + c.completed, 0)
  const videosTotal = courses.reduce((s, c) => s + c.total, 0)
  return {
    courses,
    recent: rows.slice(0, 8).map((r) => ({
      courseId: r.chapter.course.id,
      chapterId: r.chapter.id,
      chapterTitle: r.chapter.title,
      courseSlug: r.chapter.course.slug,
      courseTitle: r.chapter.course.title.trim(),
      completed: r.completed,
      seconds: r.seconds,
      duration: r.duration,
      updatedAt: r.updatedAt,
    })),
    totals: {
      coursesStarted: courses.length,
      coursesFinished: courses.filter((c) => c.total > 0 && c.completed >= c.total).length,
      videosCompleted,
      videosInProgress: courses.reduce((s, c) => s + c.inProgress, 0),
      videosTotal,
      watchedSeconds: courses.reduce((s, c) => s + c.watchedSeconds, 0),
      percent: videosTotal ? Math.round((videosCompleted / videosTotal) * 100) : 0,
    },
  }
}

/** « 3 h 20 min », « 12 min », « moins d'1 min » (selon la langue). */
export function formatWatchTime(total: number, underOneMinute = 'moins d’1 min'): string {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h) return m ? `${h} h ${String(m).padStart(2, '0')} min` : `${h} h`
  return m ? `${m} min` : total > 0 ? underOneMinute : '0 min'
}

export function relativeDate(date: Date, lang: Lang, justNow: string, now = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[lang], { numeric: 'auto' })
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [['day', 86400], ['hour', 3600], ['minute', 60]]
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return justNow
}
