'use client'

import { useEffect } from 'react'
import { setMessageRead } from './actions'

/** Marque le message comme lu dès son ouverture (une action explicite, jamais un effet de bord d'un simple affichage). */
export default function MarkRead({ id, isRead }: { id: number; isRead: boolean }) {
  useEffect(() => {
    if (!isRead) void setMessageRead(id, true)
  }, [id, isRead])
  return null
}
