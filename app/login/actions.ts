'use server'

import { redirect } from 'next/navigation'
import { createUserSession, destroyUserSession, safeNext, verifyUserCredentials } from '@/lib/user-auth'
import { prisma } from '@/lib/db'

// `email` est renvoyé pour le garder dans le champ : React 19 vide les champs après chaque action.
export type LoginState = { error: string | null; email: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  if (!email || !password) return { error: 'Email et mot de passe requis.', email }

  const found = await verifyUserCredentials(email, password)
  if (!found) {
    await new Promise((resolve) => setTimeout(resolve, 700)) // freine les essais en rafale
    return { error: 'Email ou mot de passe incorrect.', email }
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: found.id }, select: { id: true, password: true } })
  await createUserSession(user)
  redirect(safeNext(formData.get('next')))
}

export async function logout() {
  await destroyUserSession()
  redirect('/')
}
