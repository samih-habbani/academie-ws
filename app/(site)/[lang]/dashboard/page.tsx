import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import AccountShell from '@/components/auth/AccountShell'
import { requireUser } from '@/lib/user-auth'
import { getDashboard, formatWatchTime, relativeDate, type CourseProgress } from '@/lib/dashboard'
import { formatTime } from '@/lib/progress'
import { chapterUrl, courseUrl } from '@/lib/urls'
import { mediaSrc } from '@/lib/media'
import { notFound } from 'next/navigation'
import { fmt, hasLang, localizePath, type Lang } from '@/lib/i18n/config'
import { getDict, type Dict } from '@/lib/i18n/dictionaries'
import { loadTranslations, type Translate } from '@/lib/i18n/content'

type Props = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  return hasLang(lang) ? { title: getDict(lang).meta.dashboard, robots: { index: false } } : {}
}

function Donut({ percent }: { percent: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" style={{ flexShrink: 0 }} role="img" aria-label={`${percent} %`}>
      <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
      <circle cx="46" cy="46" r={r} fill="none" stroke="url(#dash-grad)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(percent / 100) * c} ${c}`} transform="rotate(-90 46 46)" />
      <defs>
        <linearGradient id="dash-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7C3AED" /><stop offset="1" stopColor="#22D3EE" /></linearGradient>
      </defs>
      <text x="46" y="51" textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff" fontFamily="var(--f-display)">{percent}%</text>
    </svg>
  )
}

function CourseRow({ course, lang, t, tr }: { course: CourseProgress; lang: Lang; t: Dict; tr: Translate }) {
  const finished = course.total > 0 && course.completed >= course.total
  const title = tr('course', course.id, 'title', course.title)
  const href = course.next
    ? chapterUrl(course.slug, course.next.chapterId, lang)
    : course.firstChapterId ? chapterUrl(course.slug, course.firstChapterId, lang) : courseUrl(course.slug, lang)
  return (
    <article className="dash-course">
      <Link href={courseUrl(course.slug, lang)} className="dash-thumb" prefetch={false} aria-hidden="true" tabIndex={-1}>
        {course.logo ? <Image src={mediaSrc('courses', course.logo)} alt="" fill sizes="120px" /> : <span>🎬</span>}
      </Link>
      <div className="dash-course-main">
        <div className="dash-course-top">
          <Link href={courseUrl(course.slug, lang)} className="dash-course-title" prefetch={false}>{title}</Link>
          {finished ? <span className="tag tag-green">{t.dashboard.done}</span> : course.category && <span className="tag tag-purple">{tr('category', course.category.id, 'title', course.category.title)}</span>}
        </div>
        <div className="course-progress-bar" role="progressbar" aria-valuenow={course.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${t.progress.ariaCourse} — ${title}`}>
          <div style={{ width: `${course.percent}%` }} />
        </div>
        <div className="dash-course-meta">
          <strong>{course.percent} %</strong>
          <span>{fmt(t.dashboard.videosSeen, { done: course.completed, total: course.total })}</span>
          {course.inProgress > 0 && <span>{fmt(t.dashboard.inProgress, { n: course.inProgress })}</span>}
          <span>⏱ {formatWatchTime(course.watchedSeconds, t.dashboard.underOneMinute)}</span>
          <span>{fmt(t.dashboard.lastActivity, { when: relativeDate(course.lastActivity, lang, t.dashboard.justNow) })}</span>
        </div>
      </div>
      <Link href={href} className={`btn ${finished ? 'btn-ghost' : 'btn-primary'} btn-sm`} prefetch={false}>
        {finished ? t.dashboard.review : course.next?.kind === 'resume' ? t.dashboard.resume : t.dashboard.continue}
      </Link>
    </article>
  )
}

export default async function DashboardPage({ params }: Props) {
  const { lang: rawLang } = await params
  if (!hasLang(rawLang)) notFound()
  const lang: Lang = rawLang
  const t = getDict(lang)
  const user = await requireUser(localizePath(lang, '/dashboard'), lang)
  const { courses, recent, totals } = await getDashboard(user.id)
  const tr = await loadTranslations(lang, {
    course: [...courses.map((c) => c.id), ...recent.map((r) => r.courseId)],
    category: courses.flatMap((c) => (c.category ? [c.category.id] : [])),
    chapter: [...courses.flatMap((c) => (c.next ? [c.next.chapterId] : [])), ...recent.map((r) => r.chapterId)],
  })
  const resumeCourse = courses.find((c) => c.next?.kind === 'resume') ?? courses.find((c) => c.next)
  const stats = [
    { label: t.dashboard.started, value: totals.coursesStarted, icon: '📚' },
    { label: t.dashboard.finished, value: totals.coursesFinished, icon: '🏆' },
    { label: t.dashboard.watchedVideos, value: totals.videosCompleted, icon: '✅' },
    { label: t.dashboard.inProgressVideos, value: totals.videosInProgress, icon: '▶️' },
    { label: t.dashboard.watchTime, value: formatWatchTime(totals.watchedSeconds, t.dashboard.underOneMinute), icon: '⏱' },
  ]

  return (
    <AccountShell lang={lang} width={1040}>
      <div className="profile-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="auth-title" style={{ marginBottom: 2 }}>{fmt(t.dashboard.hello, { name: user.firstName ? ` ${user.firstName}` : '' })}</h1>
          <p className="auth-lead" style={{ margin: 0 }}>{t.dashboard.lead}</p>
        </div>
        <Link href={localizePath(lang, '/profile')} className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} prefetch={false}>{t.dashboard.myProfile}</Link>
      </div>

      {courses.length === 0 ? (
        <section className="auth-card dash-empty">
          <div style={{ fontSize: 44 }} aria-hidden="true">🚀</div>
          <h2>{t.dashboard.emptyTitle}</h2>
          <p>{t.dashboard.emptyText}</p>
          <Link href={`${localizePath(lang, '/')}#formations`} className="btn btn-primary">{t.dashboard.emptyCta}</Link>
        </section>
      ) : (
        <>
          <section className="dash-stats" aria-label="Statistiques">
            <div className="dash-stat dash-stat-donut">
              <Donut percent={totals.percent} />
              <div>
                <div className="dash-stat-label">{t.dashboard.globalProgress}</div>
                <div className="dash-stat-sub">{fmt(t.dashboard.globalSub, { done: totals.videosCompleted, total: totals.videosTotal })}</div>
              </div>
            </div>
            {stats.map((s) => (
              <div key={s.label} className="dash-stat">
                <span className="dash-stat-icon" aria-hidden="true">{s.icon}</span>
                <div className="dash-stat-value">{s.value}</div>
                <div className="dash-stat-label">{s.label}</div>
              </div>
            ))}
          </section>

          {resumeCourse?.next && (
            <section className="dash-resume">
              <div>
                <div className="dash-resume-kicker">{resumeCourse.next.kind === 'resume' ? t.dashboard.resumeKicker : t.dashboard.nextKicker}</div>
                <h2>{tr('chapter', resumeCourse.next.chapterId, 'title', resumeCourse.next.title)}</h2>
                <p>{tr('course', resumeCourse.id, 'title', resumeCourse.title)}{resumeCourse.next.kind === 'resume' && resumeCourse.next.duration > 0 ? ` · ${fmt(t.dashboard.ofDuration, { from: formatTime(resumeCourse.next.seconds), to: formatTime(resumeCourse.next.duration) })}` : ''}</p>
              </div>
              <Link href={chapterUrl(resumeCourse.slug, resumeCourse.next.chapterId, lang)} className="btn btn-primary" prefetch={false}>
                {resumeCourse.next.kind === 'resume' ? t.dashboard.resumeBtn : t.dashboard.watchBtn}
              </Link>
            </section>
          )}

          <section className="dash-section">
            <h2>{t.dashboard.myCourses}</h2>
            <div className="dash-courses">{courses.map((c) => <CourseRow key={c.id} course={c} lang={lang} t={t} tr={tr} />)}</div>
          </section>

          <section className="dash-section">
            <h2>{t.dashboard.recent}</h2>
            <ul className="dash-activity">
              {recent.map((a) => (
                <li key={a.chapterId}>
                  <Link href={chapterUrl(a.courseSlug, a.chapterId, lang)} prefetch={false}>
                    <span className={`chapter-status chapter-status-${a.completed ? 'done' : 'started'}`} aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 22 22">
                        {a.completed ? (
                          <><circle cx="11" cy="11" r="10" fill="currentColor" /><path d="M6.2 11.4l3.3 3.2 6.3-6.6" fill="none" stroke="#04030D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></>
                        ) : (
                          <><circle cx="11" cy="11" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M11 2 A9 9 0 0 0 11 20 Z" fill="currentColor" /></>
                        )}
                      </svg>
                    </span>
                    <span className="dash-activity-main">
                      <span className="dash-activity-title">{tr('chapter', a.chapterId, 'title', a.chapterTitle)}</span>
                      <span className="dash-activity-sub">{tr('course', a.courseId, 'title', a.courseTitle)}{!a.completed && a.duration > 0 ? ` · ${formatTime(a.seconds)} / ${formatTime(a.duration)}` : ''}</span>
                    </span>
                    <span className="dash-activity-date">{relativeDate(a.updatedAt, lang, t.dashboard.justNow)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </AccountShell>
  )
}
