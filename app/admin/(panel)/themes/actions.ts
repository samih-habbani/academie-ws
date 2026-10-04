'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { failure, formValues, imageRef, redirectWithToast, requiredText, revalidatePublic, zodErrors, type FormState } from '@/lib/admin/form'
import { deleteBlobIfOwned } from '@/lib/admin/blob'

const themeSchema = z.object({
  title: requiredText('Le titre'),
  description: requiredText('La description', 255),
  img: imageRef('themes'),
  categoryId: z.string().regex(/^\d+$/, 'Choisis une catégorie.').transform(Number),
})

export async function createTheme(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = themeSchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))
  if (!(await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } }))) {
    return failure(values, { categoryId: 'Cette catégorie n’existe pas.' })
  }

  await prisma.theme.create({ data: parsed.data })
  revalidatePublic()
  redirectWithToast('/admin/themes', 'Thématique créée.')
}

export async function updateTheme(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = themeSchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))

  const [existing, category] = await Promise.all([
    prisma.theme.findUnique({ where: { id }, select: { img: true } }),
    prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { id: true } }),
  ])
  if (!existing) return failure(values, {}, 'Cette thématique n’existe plus.')
  if (!category) return failure(values, { categoryId: 'Cette catégorie n’existe pas.' })

  await prisma.theme.update({ where: { id }, data: parsed.data })
  if (existing.img !== parsed.data.img) await deleteBlobIfOwned(existing.img)
  revalidatePublic()
  redirectWithToast('/admin/themes', 'Thématique enregistrée.')
}

export async function deleteTheme(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }

  const theme = await prisma.theme.findUnique({ where: { id }, select: { img: true } })
  if (!theme) return { error: 'Cette thématique n’existe plus.' }

  // Les cours de la thématique ne sont pas supprimés : ils sont simplement détachés (ils réapparaissent seuls sur l'accueil).
  await prisma.$transaction([prisma.course.updateMany({ where: { themeId: id }, data: { themeId: null } }), prisma.theme.delete({ where: { id } })])
  await deleteBlobIfOwned(theme.img)
  revalidatePublic()
  redirectWithToast('/admin/themes', 'Thématique supprimée.')
}
