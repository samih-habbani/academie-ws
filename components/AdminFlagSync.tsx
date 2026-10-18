'use client'

import { useEffect } from 'react'

/**
 * Pose (ou retire) le cookie témoin « admin » de la barre de navigation. Sert aux sessions ouvertes
 * avant l'ajout du lien « Back-office » ; l'affichage seul est concerné, l'accès reste protégé côté serveur.
 */
export default function AdminFlagSync({ isAdmin }: { isAdmin: boolean }) {
  useEffect(() => {
    const secure = location.protocol === 'https:' ? '; secure' : ''
    document.cookie = isAdmin
      ? `ws_admin=1; path=/; max-age=${14 * 24 * 3600}; samesite=lax${secure}`
      : 'ws_admin=; path=/; max-age=0'
  }, [isAdmin])
  return null
}
