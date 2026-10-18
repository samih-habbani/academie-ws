'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { hash } from '@node-rs/argon2'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { failure, formValues, zodErrors, type FormState } from '@/lib/admin/form'
import { createUserSession, safeNext } from '@/lib/user-auth'
import { DEFAULT_LANG, hasLang, localizePath } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData)
  const lang = hasLang(values.lang ?? '') ? (values.lang as 'fr' | 'en') : DEFAULT_LANG
  const t = getDict(lang).auth
  // Champ piège invisible : seuls les robots le remplissent.
  if (values.website) redirect(localizePath(lang, '/'))

  const schema = z
    .object({
      firstName: z.string().trim().min(1, t.firstNameRequired).max(100, t.max100),
      lastName: z.string().trim().min(1, t.lastNameRequired).max(100, t.max100),
      email: z.string().trim().max(180, t.emailTooLong).regex(EMAIL_REGEX, t.emailInvalid),
      password: z.string().min(10, t.passwordMin).max(200, t.passwordMax),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { path: ['confirm'], message: t.passwordMismatch })

  const { password: _p, confirm: _c, ...safeValues } = values
  const parsed = schema.safeParse(values)
  if (!parsed.success) return failure(safeValues, zodErrors(parsed.error), t.invalidFields)

  const email = parsed.data.email.toLowerCase()
  const existing = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } }, select: { id: true } })
  if (existing) return failure(safeValues, { email: t.emailTaken }, t.invalidFields)

  const passwordHash = await hash(parsed.data.password)
  let user: { id: number; password: string }
  try {
    user = await prisma.user.create({
      data: { email, password: passwordHash, roles: ['ROLE_USER'], firstName: parsed.data.firstName, lastName: parsed.data.lastName },
      select: { id: true, password: true },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return failure(safeValues, { email: t.emailTaken }, t.invalidFields)
    }
    throw e
  }

  await createUserSession(user)
  redirect(safeNext(values.next, `${localizePath(lang, '/profile')}?welcome=1`))
}
