'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { hash, verify } from '@node-rs/argon2'
import { prisma } from '@/lib/db'
import { failure, formValues, zodErrors, type FormState } from '@/lib/admin/form'
import { createUserSession, destroyUserSession, requireUser } from '@/lib/user-auth'
import { DEFAULT_LANG, hasLang, localizePath, type Lang } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'

function langOf(value: unknown): Lang {
  const v = String(value ?? DEFAULT_LANG)
  return hasLang(v) ? v : DEFAULT_LANG
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData)
  const lang = langOf(values.lang)
  const user = await requireUser(localizePath(lang, '/profile'), lang)
  const t = getDict(lang).profile
  const a = getDict(lang).auth

  const schema = z.object({
    firstName: z.string().trim().min(1, a.firstNameRequired).max(100, a.max100),
    lastName: z.string().trim().min(1, a.lastNameRequired).max(100, a.max100),
    phone: z.string().trim().max(30, t.max30).refine((v) => v === '' || /^[0-9+().\s-]{6,30}$/.test(v), t.phoneInvalid),
    bio: z.string().trim().max(1000, t.max1000),
  })
  const parsed = schema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error), a.invalidFields)

  await prisma.user.update({
    where: { id: user.id },
    data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, phone: parsed.data.phone || null, bio: parsed.data.bio || null },
  })
  revalidatePath(localizePath(lang, '/profile'))
  return { ok: true, message: t.saved, errors: {}, values }
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData)
  const lang = langOf(values.lang)
  const user = await requireUser(localizePath(lang, '/profile'), lang)
  const t = getDict(lang).profile
  const a = getDict(lang).auth

  const schema = z
    .object({
      current: z.string().min(1, t.currentRequired),
      password: z.string().min(10, t.newMin).max(200, a.passwordMax),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { path: ['confirm'], message: a.passwordMismatch })
  const parsed = schema.safeParse(values)
  if (!parsed.success) return failure({}, zodErrors(parsed.error), a.invalidFields)

  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { id: true, password: true } })
  let ok = false
  try {
    ok = await verify(row.password, parsed.data.current)
  } catch {
    ok = false
  }
  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    return failure({}, { current: t.currentWrong }, a.invalidFields)
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { password: await hash(parsed.data.password) }, select: { id: true, password: true } })
  // Le changement invalide les autres sessions ; on rouvre celle de cet appareil.
  await createUserSession({ ...updated, isAdmin: user.isAdmin })
  return { ok: true, message: t.passwordChanged, errors: {}, values: {} }
}

export async function deleteAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const lang = langOf(formData.get('lang'))
  const user = await requireUser(localizePath(lang, '/profile'), lang)
  const t = getDict(lang).profile
  if (user.isAdmin) return failure({}, {}, t.adminBlocked)

  const password = String(formData.get('password') ?? '')
  const row = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { id: true, password: true } })
  let ok = false
  try {
    ok = password !== '' && (await verify(row.password, password))
  } catch {
    ok = false
  }
  if (!ok) {
    await new Promise((resolve) => setTimeout(resolve, 700))
    return failure({}, { password: t.wrongPassword }, t.deleteCancelled)
  }

  await prisma.user.delete({ where: { id: user.id } })
  await destroyUserSession()
  redirect(`${localizePath(lang, '/')}?account=deleted`)
}
