import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { DEFAULT_LANG, LANGS } from '@/lib/i18n/config'

/**
 * Langues du site public : le français est à la racine (/course/python), les autres sont
 * préfixées (/en/course/python). Les pages vivent sous app/(site)/[lang], donc une URL sans
 * préfixe est réécrite (sans changer l'adresse affichée) vers /fr/…, et /fr/… est redirigé
 * vers l'adresse canonique sans préfixe.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const first = pathname.split('/')[1]

  if (first === DEFAULT_LANG) {
    const url = request.nextUrl.clone()
    url.pathname = pathname.slice(DEFAULT_LANG.length + 1) || '/'
    url.search = search
    return NextResponse.redirect(url, 308)
  }
  if ((LANGS as readonly string[]).includes(first)) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LANG}${pathname === '/' ? '' : pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  // Hors back-office, API, fichiers internes et fichiers statiques (tout ce qui contient un point).
  matcher: ['/((?!api|admin|_next|.*\\..*).*)'],
}
