'use server'

import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { failure, formValues, imageRef, optionalText, redirectWithToast, requiredText, revalidatePublic, zodErrors, type FormState } from '@/lib/admin/form'
import { deleteBlobIfOwned } from '@/lib/admin/blob'

const schema = z.object({
  name: requiredText('Le nom', 80),
  logo: imageRef('tools'),
  url: optionalText('Le lien', 255).refine((v) => v === '' || /^https?:\/\//i.test(v), 'Le lien doit commencer par http:// ou https://.'),
})

const duplicate = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'

export async function createTool(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = schema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))
  try {
    await prisma.tool.create({ data: parsed.data })
  } catch (e) {
    if (duplicate(e)) return failure(values, { name: 'Cet outil existe déjà.' })
    throw e
  }
  revalidatePublic()
  redirectWithToast('/admin/tools', 'Outil créé.')
}

export async function updateTool(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = schema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))
  const existing = await prisma.tool.findUnique({ where: { id }, select: { logo: true } })
  if (!existing) return failure(values, {}, 'Cet outil n’existe plus.')
  try {
    await prisma.tool.update({ where: { id }, data: parsed.data })
  } catch (e) {
    if (duplicate(e)) return failure(values, { name: 'Un autre outil porte déjà ce nom.' })
    throw e
  }
  if (existing.logo !== parsed.data.logo) await deleteBlobIfOwned(existing.logo)
  revalidatePublic()
  redirectWithToast('/admin/tools', 'Outil enregistré.')
}

export async function deleteTool(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }
  const tool = await prisma.tool.findUnique({ where: { id }, select: { logo: true } })
  if (!tool) return { error: 'Cet outil n’existe plus.' }
  await prisma.tool.delete({ where: { id } }) // retiré automatiquement des programmes qui l'utilisaient
  await deleteBlobIfOwned(tool.logo)
  revalidatePublic()
  redirectWithToast('/admin/tools', 'Outil supprimé.')
}
