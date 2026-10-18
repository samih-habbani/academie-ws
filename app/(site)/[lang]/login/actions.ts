'use server'

import { redirect } from 'next/navigation'
import { createUserSession, safeNext, verifyUserCredentials } from '@/lib/user-auth'
import { prisma } from '@/lib/db'
import { DEFAULT_LANG, hasLang, localizePath } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'

// `email` est renvoyé pour le garder dans le champ : React 19 vide les champs après chaque action.
export type LoginState = { error: string | null; email: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const langField = String(formData.get('lang') ?? DEFAULT_LANG)
  const lang = hasLang(langField) ? langField : DEFAULT_LANG
  const t = getDict(lang).auth
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: t.credentialsRequired, email }

  const found = await verifyUserCredentials(email, password)
  if (!found) {
    await new Promise((resolve) => setTimeout(resolve, 700)) // freine les essais en rafale
    return { error: t.incorrect, email }
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: found.id }, select: { id: true, password: true, roles: true } })
  await createUserSession({ id: user.id, password: user.password, isAdmin: Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN') })
  redirect(safeNext(formData.get('next'), localizePath(lang, '/profile')))
}
