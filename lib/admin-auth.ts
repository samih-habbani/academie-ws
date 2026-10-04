import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'
import { verify } from '@node-rs/argon2'
import { prisma } from '@/lib/db'

const COOKIE_NAME = 'admin_session'
const SESSION_HOURS = 12

// Hash argon2id sans valeur secrète : sert à dépenser le même temps de calcul quand l'email
// n'existe pas, pour qu'on ne puisse pas deviner quels emails sont des comptes admin.
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=4,p=1$RllhZGdrNmlKVjdPRURUSA$Ke34AKHS9AcRQ4ZRKepHg6M9yt93peVQeZm7hZm/uow'

function secretKey() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET manquant ou trop court (32 caractères minimum).')
  }
  return new TextEncoder().encode(secret)
}

function isAdminRoles(roles: unknown): boolean {
  return Array.isArray(roles) && roles.includes('ROLE_ADMIN')
}

export type AdminUser = { id: number; email: string }

/** Vérifie email + mot de passe (hash argon2 Symfony) et le rôle ROLE_ADMIN. */
export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
    select: { id: true, email: true, password: true, roles: true },
  })

  const hash = user?.password ?? DUMMY_HASH
  let passwordOk = false
  try {
    passwordOk = await verify(hash, password)
  } catch {
    passwordOk = false
  }

  if (!user || !passwordOk || !isAdminRoles(user.roles)) return null
  return { id: user.id, email: user.email }
}

export async function createSession(userId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(secretKey())

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_HOURS * 60 * 60,
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/**
 * Renvoie l'admin connecté, ou null. Revérifie en base à chaque appel que le compte existe
 * toujours et a toujours le rôle admin (retirer le rôle coupe donc l'accès immédiatement).
 */
export async function getAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    const id = Number(payload.sub)
    if (!Number.isInteger(id)) return null

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, roles: true },
    })
    if (!user || !isAdminRoles(user.roles)) return null
    return { id: user.id, email: user.email }
  } catch {
    return null
  }
}

/** À appeler en haut de chaque page admin ET dans chaque action serveur. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdmin()
  if (!admin) redirect('/admin/login')
  return admin
}
