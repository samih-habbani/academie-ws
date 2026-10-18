import { NextResponse } from 'next/server'
import { createSession } from '@/lib/admin-auth'
import { getUser } from '@/lib/user-auth'

// Durée maximale de la session de membre pour passer au back-office sans ressaisir le mot de passe
// (= durée d'une session admin : un cookie de membre plus ancien ne donne pas accès à l'admin).
const MAX_AGE_SECONDS = 12 * 60 * 60

/** Chemin de destination : uniquement le back-office. */
function adminPath(value: string | null): string {
  return value && /^\/admin(\/[A-Za-z0-9_\-/]*)?$/.test(value) && !value.startsWith('/admin/enter') ? value : '/admin'
}

/**
 * « Back-office » depuis le site : un administrateur connecté en membre depuis moins de 12 h
 * est connecté au back-office sans ressaisie. Sinon, on le renvoie vers la connexion du back-office.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const target = adminPath(url.searchParams.get('next'))
  const user = await getUser()
  const fresh = user && Date.now() / 1000 - user.sessionStartedAt < MAX_AGE_SECONDS

  if (!user || !user.isAdmin || !fresh) return NextResponse.redirect(new URL('/admin/login', url.origin))

  await createSession(user.id)
  return NextResponse.redirect(new URL(target, url.origin))
}
