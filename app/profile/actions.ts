'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { hash, verify } from '@node-rs/argon2'
import { prisma } from '@/lib/db'
import { failure, formValues, zodErrors, type FormState } from '@/lib/admin/form'
import { createUserSession, destroyUserSession, requireUser } from '@/lib/user-auth'

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prénom est obligatoire.').max(100, '100 caractères maximum.'),
  lastName: z.string().trim().min(1, 'Le nom est obligatoire.').max(100, '100 caractères maximum.'),
  phone: z
    .string()
    .trim()
    .max(30, '30 caractères maximum.')
    .refine((v) => v === '' || /^[0-9+().\s-]{6,30}$/.test(v), 'Numéro de téléphone invalide.'),
  bio: z.string().trim().max(1000, '1 000 caractères maximum.'),
})

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const values = formValues(formData)
  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))

  await prisma.user.update({
    where: { id: user.id },
    data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, phone: parsed.data.phone || null, bio: parsed.data.bio || null },
  })
  revalidatePath('/profile')
  return { ok: true, message: 'Profil mis à jour.', errors: {}, values }
}

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Saisis ton mot de passe actuel.'),
    password: z.string().min(10, 'Le nouveau mot de passe doit faire au moins 10 caractères.').max(200, 'Mot de passe trop long.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Les deux mots de passe ne correspondent pas.' })

async function currentHash(id: number) {
  return (await prisma.user.findUniqueOrThrow({ where: { id }, select: { id: true, password: true } }))
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  const parsed = passwordSchema.safeParse(formValues(formData))
  if (!parsed.success) return failure({}, zodErrors(parsed.error))

  const row = await currentHash(user.id)
  let ok = false
  try {
    ok = await verify(row.password, parsed.data.current)
  } catch {
    ok = false
  }
  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    return failure({}, { current: 'Mot de passe actuel incorrect.' })
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { password: await hash(parsed.data.password) }, select: { id: true, password: true } })
  // Le changement invalide les autres sessions ; on rouvre celle de cet appareil.
  await createUserSession(updated)
  return { ok: true, message: 'Mot de passe modifié.', errors: {}, values: {} }
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser()
  if (user.isAdmin) {
    return failure({}, {}, 'Un compte administrateur ne peut pas être supprimé ici. Retire d’abord son rôle depuis le back-office.')
  }
  const password = String(formData.get('password') ?? '')
  const row = await currentHash(user.id)
  let ok = false
  try {
    ok = password !== '' && (await verify(row.password, password))
  } catch {
    ok = false
  }
  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    return failure({}, { password: 'Mot de passe incorrect.' }, 'Suppression annulée.')
  }

  await prisma.user.delete({ where: { id: user.id } })
  await destroyUserSession()
  redirect('/?account=deleted')
}
