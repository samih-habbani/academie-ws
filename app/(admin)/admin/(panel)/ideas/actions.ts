'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { failure, formValues, optionalText, redirectWithToast, requiredText, zodErrors, type FormState } from '@/lib/admin/form'
import { fetchYoutubeMeta, normalizeYoutube } from '@/lib/admin/youtube-meta'

const MAX_LINKS = 30

const ideaSchema = z.object({
  title: requiredText('Le titre'),
  description: optionalText('La description', 20000),
})

/** Lit les liens du formulaire, les normalise et détecte les doublons / valeurs invalides. */
function readLinks(formData: FormData): { links: { videoId: string; url: string }[]; error?: string; raw: string[] } {
  const raw = formData.getAll('link').map((v) => String(v).trim()).filter(Boolean)
  const seen = new Set<string>()
  const links: { videoId: string; url: string }[] = []
  for (const value of raw) {
    const link = normalizeYoutube(value)
    if (!link) return { links, raw, error: `« ${value.slice(0, 60)} » n’est pas un lien de vidéo YouTube valide.` }
    if (!seen.has(link.videoId)) {
      seen.add(link.videoId)
      links.push(link)
    }
  }
  if (links.length > MAX_LINKS) return { links, raw, error: `${MAX_LINKS} liens maximum par idée.` }
  return { links, raw }
}

/** Titres déjà connus (idée existante) réutilisés ; les autres sont demandés à YouTube en parallèle. */
async function withMeta(links: { videoId: string; url: string }[], known: Map<string, { title: string | null; author: string | null }>) {
  return Promise.all(
    links.map(async (link, position) => {
      const meta = known.get(link.videoId) ?? (await fetchYoutubeMeta(link.url))
      return { videoId: link.videoId, url: link.url, title: meta.title, author: meta.author, position }
    }),
  )
}

function formState(values: Record<string, string>, raw: string[]) {
  return { ...values, links: raw.join('\n') }
}

export async function createIdea(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const values = formValues(formData)
  const { links, error, raw } = readLinks(formData)
  const kept = formState(values, raw)
  const parsed = ideaSchema.safeParse(values)
  const errors = parsed.success ? {} : zodErrors(parsed.error)
  if (error) errors.links = error
  if (!parsed.success || error) return failure(kept, errors)

  const rows = await withMeta(links, new Map())
  const idea = await prisma.videoIdea.create({
    data: { userId: admin.id, title: parsed.data.title, description: parsed.data.description, links: { create: rows } },
  })
  redirectWithToast(`/admin/ideas/${idea.id}`, 'Idée enregistrée.')
}

export async function updateIdea(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin()
  const values = formValues(formData)
  const { links, error, raw } = readLinks(formData)
  const kept = formState(values, raw)
  const parsed = ideaSchema.safeParse(values)
  const errors = parsed.success ? {} : zodErrors(parsed.error)
  if (error) errors.links = error
  if (!parsed.success || error) return failure(kept, errors)

  // Une idée n'est visible et modifiable que par son auteur.
  const existing = await prisma.videoIdea.findFirst({ where: { id, userId: admin.id }, include: { links: true } })
  if (!existing) return failure(kept, {}, 'Cette idée n’existe plus.')

  const known = new Map(existing.links.map((l) => [l.videoId, { title: l.title, author: l.author }]))
  const rows = await withMeta(links, known)
  await prisma.$transaction([
    prisma.videoIdeaLink.deleteMany({ where: { ideaId: id } }),
    prisma.videoIdea.update({
      where: { id },
      data: { title: parsed.data.title, description: parsed.data.description, links: { create: rows } },
    }),
  ])
  redirectWithToast(`/admin/ideas/${id}`, 'Idée mise à jour.')
}

export async function deleteIdea(formData: FormData): Promise<{ error?: string } | void> {
  const admin = await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }
  const { count } = await prisma.videoIdea.deleteMany({ where: { id, userId: admin.id } })
  if (count === 0) return { error: 'Cette idée n’existe plus.' }
  redirectWithToast('/admin/ideas', 'Idée supprimée.')
}
