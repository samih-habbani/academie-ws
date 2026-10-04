'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { createSession, destroySession, getAdmin, verifyAdminCredentials } from '@/lib/admin-auth'
import { isSupportBlobUrl } from '@/lib/support-files'

// `email` est renvoyé pour le garder dans le champ : React 19 vide les champs après chaque action.
export type LoginState = { error: string | null; email: string }
export type SupportResult = { ok: true } | { ok: false; error: string }

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) return { error: 'Email et mot de passe requis.', email }

  const admin = await verifyAdminCredentials(email, password)
  if (!admin) {
    // Petit délai contre les essais en rafale.
    await new Promise((resolve) => setTimeout(resolve, 700))
    return { error: 'Identifiants incorrects.', email }
  }

  await createSession(admin.id)
  redirect('/admin')
}

export async function logout() {
  await destroySession()
  redirect('/admin/login')
}

/** Rafraîchit les pages publiques qui affichent le bouton de téléchargement (elles sont en cache ISR). */
async function revalidateCoursePages(courseId: number) {
  revalidatePath(`/cours/${courseId}`)
  const chapters = await prisma.chapter.findMany({ where: { courseId }, select: { id: true } })
  for (const chapter of chapters) revalidatePath(`/cours/${courseId}/chapitre/${chapter.id}`)
  revalidatePath('/admin')
}

/** Enregistre en base le fichier déjà téléversé (directement du navigateur vers Vercel Blob). */
export async function saveSupport(courseId: number, url: string, fileName: string): Promise<SupportResult> {
  // Les actions serveur sont joignables par POST direct : on revérifie l'admin ici.
  const admin = await getAdmin()
  if (!admin) return { ok: false, error: 'Session expirée, reconnecte-toi.' }

  if (!Number.isInteger(courseId)) return { ok: false, error: 'Cours invalide.' }

  if (!isSupportBlobUrl(url, courseId)) {
    return { ok: false, error: 'Le fichier ne provient pas du stockage attendu.' }
  }

  const name = fileName.trim().slice(0, 150)
  if (!name) return { ok: false, error: 'Nom de fichier manquant.' }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { supportUrl: true } })
  if (!course) return { ok: false, error: 'Cours introuvable.' }

  await prisma.course.update({ where: { id: courseId }, data: { supportUrl: url, supportName: name } })

  // Supprime l'ancien fichier (best effort : un échec ici ne doit pas annuler l'enregistrement).
  if (course.supportUrl && course.supportUrl !== url) {
    await del(course.supportUrl).catch(() => undefined)
  }

  await revalidateCoursePages(courseId)
  return { ok: true }
}

export async function removeSupport(courseId: number): Promise<SupportResult> {
  const admin = await getAdmin()
  if (!admin) return { ok: false, error: 'Session expirée, reconnecte-toi.' }
  if (!Number.isInteger(courseId)) return { ok: false, error: 'Cours invalide.' }

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { supportUrl: true } })
  if (!course) return { ok: false, error: 'Cours introuvable.' }

  await prisma.course.update({ where: { id: courseId }, data: { supportUrl: null, supportName: null } })
  if (course.supportUrl) await del(course.supportUrl).catch(() => undefined)

  await revalidateCoursePages(courseId)
  return { ok: true }
}
