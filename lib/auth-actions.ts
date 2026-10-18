'use server'

import { redirect } from 'next/navigation'
import { destroyUserSession } from '@/lib/user-auth'
import { hasLang, localizePath, DEFAULT_LANG } from '@/lib/i18n/config'

/** Déconnexion du membre (barre de navigation et profil). `lang` : ramène à l'accueil dans la langue courante. */
export async function logout(formData: FormData) {
  await destroyUserSession()
  const lang = String(formData.get('lang') ?? DEFAULT_LANG)
  redirect(localizePath(hasLang(lang) ? lang : DEFAULT_LANG, '/'))
}
