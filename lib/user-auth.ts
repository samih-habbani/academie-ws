import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createHash } from 'node:crypto'
import { SignJWT, jwtVerify } from 'jose'
import { verify } from '@node-rs/argon2'
import { prisma } from '@/lib/db'

// Session des visiteurs inscrits. Cookie distinct de celui du back-office (`admin_session`) :
// un jeton utilisateur ne donne jamais accès à /admin, et inversement.
const COOKIE_NAME = 'user_session'
// Cookie « témoin » lisible par le navigateur, sans donnée sensible : permet à la barre de
// navigation d'afficher « Mon profil » sans interroger le serveur (les pages publiques restent en cache).
export const FLAG_COOKIE = 'ws_in'
const SESSION_DAYS = 14

// Hash argon2id factice : même temps de calcul quand l'email n'existe pas (pas de devinette de comptes).
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=4,p=1$RllhZGdrNmlKVjdPRURUSA$Ke34AKHS9AcRQ4ZRKepHg6M9yt93peVQeZm7hZm/uow'

function secretKey() {
  const secret = process.env.USER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET manquant ou trop court (32 caractères minimum).')
  }
  return new TextEncoder().encode(secret)
}

/** Empreinte du hash du mot de passe : changer de mot de passe invalide les anciennes sessions. */
const stamp = (passwordHash: string) => createHash('sha256').update(passwordHash).digest('base64url').slice(0, 16)

export type SessionUser = {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  bio: string | null
  createdAt: Date
  isAdmin: boolean
}

/** Vérifie email + mot de passe. Renvoie le compte (id + hash) ou null. */
export async function verifyUserCredentials(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, password: true },
  })
  let ok = false
  try {
    ok = await verify(user?.password ?? DUMMY_HASH, password)
  } catch {
    ok = false
  }
  return user && ok ? user : null
}

export async function createUserSession(user: { id: number; password: string }) {
  const token = await new SignJWT({ ps: stamp(user.password) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(user.id))
    .setAudience('user')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey())

  const secure = process.env.NODE_ENV === 'production'
  const maxAge = SESSION_DAYS * 24 * 60 * 60
  const store = await cookies()
  store.set(COOKIE_NAME, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge })
  store.set(FLAG_COOKIE, '1', { httpOnly: false, secure, sameSite: 'lax', path: '/', maxAge })
}

export async function destroyUserSession() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
  store.delete(FLAG_COOKIE)
}

/** Utilisateur connecté (revérifié en base à chaque requête), ou null. Mémoïsé par requête. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'], audience: 'user' })
    const id = Number(payload.sub)
    if (!Number.isInteger(id)) return null
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, password: true, roles: true, firstName: true, lastName: true, phone: true, bio: true, createdAt: true },
    })
    if (!user || payload.ps !== stamp(user.password)) return null
    const { password: _password, roles, ...rest } = user
    return { ...rest, isAdmin: Array.isArray(roles) && roles.includes('ROLE_ADMIN') }
  } catch {
    return null
  }
})

/** À appeler en haut de chaque page protégée ET dans chaque action serveur. */
export async function requireUser(next = '/profile'): Promise<SessionUser> {
  const user = await getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

/** Chemin de redirection après connexion : uniquement un chemin interne simple. */
export function safeNext(value: unknown, fallback = '/profile'): string {
  return typeof value === 'string' && /^\/[A-Za-z0-9_\-/]*$/.test(value) && !value.startsWith('//') && !value.startsWith('/admin') ? value : fallback
}
