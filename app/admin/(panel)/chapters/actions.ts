'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { failure, formValues, optionalText, redirectWithToast, requiredText, revalidatePublic, zodErrors, type FormState } from '@/lib/admin/form'
import { safeReturn, syncChapterCount } from '@/lib/admin/sync'
import { getYoutubeVideoId } from '@/lib/youtube'

const chapterSchema = z.object({
  title: requiredText('Le titre'),
  courseId: z.string().regex(/^\d+$/, 'Choisis un cours.').transform(Number),
  chapterPart: optionalText('La partie', 5000),
  numOrder: z
    .string()
    .trim()
    .regex(/^\d*$/, 'La position doit être un nombre entier.')
    .transform((v) => (v === '' ? null : Number(v)))
    .refine((v) => v === null || v <= 1_000_000, 'Position trop grande.'),
  type: z.enum(['', 'cours', 'exo', 'tp', 'quiz'], { message: 'Type invalide.' }).transform((v) => (v === '' ? null : v)),
  duration: requiredText('La durée', 75),
  urlVideo: z.string().trim().max(1000, 'Lien trop long.'),
  description: z.string().max(100000, 'Description trop longue.'),
  material: optionalText('Le support historique', 125),
})

type ChapterInput = z.infer<typeof chapterSchema>

/** Lien YouTube normalisé, vide, ou (uniquement s'il est inchangé) l'ancienne valeur non YouTube déjà en base. */
function resolveVideo(input: string, current: string | null): { value: string } | { error: string } {
  if (input === '') return { value: '' }
  const id = getYoutubeVideoId(input)
  if (id) return { value: `https://www.youtube.com/watch?v=${id}` }
  if (current !== null && input === current) return { value: input }
  return { error: 'Lien YouTube invalide : colle l’adresse de la vidéo (youtube.com/watch?v=… ou youtu.be/…).' }
}

async function save(
  input: ChapterInput,
  values: Record<string, string>,
  existing: { id: number; courseId: number; urlVideo: string; numOrder: number } | null,
): Promise<{ state: FormState } | { chapterId: number; courseId: number; previousCourseId: number | null }> {
  const course = await prisma.course.findUnique({ where: { id: input.courseId }, select: { id: true } })
  if (!course) return { state: failure(values, { courseId: 'Ce cours n’existe pas.' }) }

  const video = resolveVideo(input.urlVideo, existing?.urlVideo ?? null)
  if ('error' in video) return { state: failure(values, { urlVideo: video.error }) }

  // Position : vide = à la fin (création) ou inchangée (modification) ; si elle est déjà prise, les suivants sont décalés.
  let numOrder = input.numOrder
  if (numOrder === null) {
    if (existing && existing.courseId === input.courseId) numOrder = existing.numOrder
    else {
      const last = await prisma.chapter.aggregate({ where: { courseId: input.courseId }, _max: { numOrder: true } })
      numOrder = (last._max.numOrder ?? 0) + 1
    }
  }

  const data = {
    title: input.title,
    courseId: input.courseId,
    chapterPart: input.chapterPart || null,
    numOrder,
    type: input.type,
    duration: input.duration,
    urlVideo: video.value,
    description: input.description.trim() === '' ? null : input.description,
    material: input.material || null,
    free: values.free === 'on',
    available: values.available === 'on',
  }

  const chapter = await prisma.$transaction(async (tx) => {
    const taken = await tx.chapter.findFirst({
      where: { courseId: input.courseId, numOrder, ...(existing ? { id: { not: existing.id } } : {}) },
      select: { id: true },
    })
    if (taken) {
      await tx.chapter.updateMany({
        where: { courseId: input.courseId, numOrder: { gte: numOrder }, ...(existing ? { id: { not: existing.id } } : {}) },
        data: { numOrder: { increment: 1 } },
      })
    }
    return existing ? tx.chapter.update({ where: { id: existing.id }, data }) : tx.chapter.create({ data })
  })

  return { chapterId: chapter.id, courseId: input.courseId, previousCourseId: existing && existing.courseId !== input.courseId ? existing.courseId : null }
}

export async function createChapter(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = chapterSchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))

  const result = await save(parsed.data, values, null)
  if ('state' in result) return result.state

  await syncChapterCount(result.courseId)
  revalidatePublic()
  redirectWithToast(safeReturn(values.returnTo, `/admin/courses/${result.courseId}`), 'Chapitre créé.')
}

export async function updateChapter(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = chapterSchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))

  const existing = await prisma.chapter.findUnique({ where: { id }, select: { id: true, courseId: true, urlVideo: true, numOrder: true } })
  if (!existing) return failure(values, {}, 'Ce chapitre n’existe plus.')

  const result = await save(parsed.data, values, existing)
  if ('state' in result) return result.state

  await syncChapterCount(result.courseId)
  if (result.previousCourseId) await syncChapterCount(result.previousCourseId)
  revalidatePublic()
  redirectWithToast(safeReturn(values.returnTo, `/admin/courses/${result.courseId}`), 'Chapitre enregistré.')
}

export async function deleteChapter(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }

  const chapter = await prisma.chapter.findUnique({ where: { id }, select: { courseId: true } })
  if (!chapter) return { error: 'Ce chapitre n’existe plus.' }

  await prisma.chapter.delete({ where: { id } })
  await syncChapterCount(chapter.courseId)
  revalidatePublic()
  redirectWithToast(safeReturn(formData.get('returnTo'), `/admin/courses/${chapter.courseId}`), 'Chapitre supprimé.')
}

/** Monte ou descend un chapitre d'un cran dans son cours. */
export async function moveChapter(formData: FormData): Promise<void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  const dir = formData.get('dir') === 'up' ? -1 : 1
  if (!Number.isInteger(id) || id <= 0) return

  const chapter = await prisma.chapter.findUnique({ where: { id }, select: { courseId: true } })
  if (!chapter) return

  const siblings = await prisma.chapter.findMany({
    where: { courseId: chapter.courseId },
    orderBy: [{ numOrder: 'asc' }, { id: 'asc' }],
    select: { id: true, numOrder: true },
  })
  const from = siblings.findIndex((s) => s.id === id)
  const to = from + dir
  if (from === -1 || to < 0 || to >= siblings.length) return

  const hasDuplicates = new Set(siblings.map((s) => s.numOrder)).size !== siblings.length
  if (hasDuplicates) {
    // Positions ambiguës : on renumérote proprement 1…n après l'échange.
    const reordered = [...siblings]
    ;[reordered[from], reordered[to]] = [reordered[to], reordered[from]]
    await prisma.$transaction(reordered.map((s, i) => prisma.chapter.update({ where: { id: s.id }, data: { numOrder: i + 1 } })))
  } else {
    await prisma.$transaction([
      prisma.chapter.update({ where: { id: siblings[from].id }, data: { numOrder: siblings[to].numOrder } }),
      prisma.chapter.update({ where: { id: siblings[to].id }, data: { numOrder: siblings[from].numOrder } }),
    ])
  }

  revalidatePublic()
  revalidatePath(`/admin/courses/${chapter.courseId}`)
}
