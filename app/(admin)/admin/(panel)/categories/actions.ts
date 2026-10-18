'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { failure, formValues, imageRef, optionalInt, redirectWithToast, requiredText, revalidatePublic, zodErrors, type FormState } from '@/lib/admin/form'
import { deleteBlobIfOwned } from '@/lib/admin/blob'

const categorySchema = z.object({
  title: requiredText('Le titre', 75),
  description: requiredText('La description', 255),
  logo: imageRef('categories'),
  orderCategory: optionalInt('L’ordre'),
})

async function nextOrder(): Promise<number> {
  const max = await prisma.category.aggregate({ _max: { orderCategory: true } })
  return (max._max.orderCategory ?? 0) + 1
}

export async function createCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = categorySchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))

  const { orderCategory, ...rest } = parsed.data
  await prisma.category.create({ data: { ...rest, orderCategory: orderCategory ?? (await nextOrder()) } })
  revalidatePublic()
  redirectWithToast('/admin/categories', 'Catégorie créée.')
}

export async function updateCategory(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = categorySchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))

  const existing = await prisma.category.findUnique({ where: { id }, select: { logo: true, orderCategory: true } })
  if (!existing) return failure(values, {}, 'Cette catégorie n’existe plus.')

  const { orderCategory, ...rest } = parsed.data
  await prisma.category.update({ where: { id }, data: { ...rest, orderCategory: orderCategory ?? existing.orderCategory } })
  if (existing.logo !== parsed.data.logo) await deleteBlobIfOwned(existing.logo)
  revalidatePublic()
  redirectWithToast('/admin/categories', 'Catégorie enregistrée.')
}

export async function deleteCategory(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }

  const category = await prisma.category.findUnique({
    where: { id },
    select: { logo: true, _count: { select: { courses: true, themes: true } } },
  })
  if (!category) return { error: 'Cette catégorie n’existe plus.' }
  if (category._count.courses > 0 || category._count.themes > 0) {
    return {
      error: `Impossible de supprimer : ${category._count.courses} cours et ${category._count.themes} thématique(s) utilisent encore cette catégorie. Déplace-les ou supprime-les d’abord.`,
    }
  }

  await prisma.category.delete({ where: { id } })
  await deleteBlobIfOwned(category.logo)
  revalidatePublic()
  redirectWithToast('/admin/categories', 'Catégorie supprimée.')
}
