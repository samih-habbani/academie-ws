'use server'

import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { failure, formValues, imageRef, optionalText, redirectWithToast, requiredText, revalidatePublic, zodErrors, type FormState } from '@/lib/admin/form'
import { deleteBlobIfOwned } from '@/lib/admin/blob'

const schema = z.object({
  name: requiredText('Le nom', 200),
  issuer: optionalText('L’organisme', 120),
  reference: optionalText('La référence', 80),
  level: optionalText('Le niveau', 80),
  description: optionalText('La description', 5000),
  url: optionalText('Le lien', 255).refine((v) => v === '' || /^https?:\/\//i.test(v), 'Le lien doit commencer par http:// ou https://.'),
  logo: imageRef('certifications'),
})
const duplicate = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'

export async function createCertification(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = schema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))
  try {
    await prisma.certification.create({ data: parsed.data })
  } catch (e) {
    if (duplicate(e)) return failure(values, { name: 'Cette certification existe déjà.' })
    throw e
  }
  revalidatePublic()
  redirectWithToast('/admin/certifications', 'Certification créée.')
}

export async function updateCertification(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = schema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))
  const existing = await prisma.certification.findUnique({ where: { id }, select: { logo: true } })
  if (!existing) return failure(values, {}, 'Cette certification n’existe plus.')
  try {
    await prisma.certification.update({ where: { id }, data: parsed.data })
  } catch (e) {
    if (duplicate(e)) return failure(values, { name: 'Une autre certification porte déjà ce nom.' })
    throw e
  }
  if (existing.logo !== parsed.data.logo) await deleteBlobIfOwned(existing.logo)
  revalidatePublic()
  redirectWithToast('/admin/certifications', 'Certification enregistrée.')
}

export async function deleteCertification(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }
  const cert = await prisma.certification.findUnique({ where: { id }, select: { logo: true } })
  if (!cert) return { error: 'Cette certification n’existe plus.' }
  await prisma.certification.delete({ where: { id } })
  await deleteBlobIfOwned(cert.logo)
  revalidatePublic()
  redirectWithToast('/admin/certifications', 'Certification supprimée.')
}
