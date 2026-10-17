'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { hash } from '@node-rs/argon2'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { failure, formValues, zodErrors, type FormState } from '@/lib/admin/form'
import { createUserSession, safeNext } from '@/lib/user-auth'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const schema = z
  .object({
    firstName: z.string().trim().min(1, 'Le prénom est obligatoire.').max(100, '100 caractères maximum.'),
    lastName: z.string().trim().min(1, 'Le nom est obligatoire.').max(100, '100 caractères maximum.'),
    email: z.string().trim().max(180, 'Email trop long.').regex(EMAIL_REGEX, 'Adresse email invalide.'),
    password: z.string().min(10, 'Le mot de passe doit faire au moins 10 caractères.').max(200, 'Mot de passe trop long.'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Les deux mots de passe ne correspondent pas.' })

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData)
  // Champ piège invisible : seuls les robots le remplissent.
  if (values.website) redirect('/')

  const { password: _p, confirm: _c, ...safeValues } = values
  const parsed = schema.safeParse(values)
  if (!parsed.success) return failure(safeValues, zodErrors(parsed.error))

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } })
  if (existing) return failure(safeValues, { email: 'Un compte existe déjà avec cet email. Connecte-toi plutôt.' })

  const passwordHash = await hash(parsed.data.password)
  let user: { id: number; password: string }
  try {
    user = await prisma.user.create({
      data: { email, password: passwordHash, roles: ['ROLE_USER'], firstName: parsed.data.firstName, lastName: parsed.data.lastName },
      select: { id: true, password: true },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return failure(safeValues, { email: 'Un compte existe déjà avec cet email. Connecte-toi plutôt.' })
    }
    throw e
  }

  await createUserSession(user)
  redirect(safeNext(values.next, '/profile?welcome=1'))
}
