'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { redirectWithToast } from '@/lib/admin/form'
import { safeReturn } from '@/lib/admin/sync'

/** Marque un message comme lu / non lu (appelée à l'ouverture d'un message et par les boutons de la liste). */
export async function setMessageRead(id: number, read: boolean): Promise<void> {
  await requireAdmin()
  if (!Number.isInteger(id) || id <= 0) return
  await prisma.contact.updateMany({ where: { id }, data: { isRead: read } })
  // Le badge « non lus » du menu est dans le layout : on le rafraîchit.
  revalidatePath('/admin', 'layout')
}

export async function toggleMessageRead(formData: FormData): Promise<void> {
  const id = Number(formData.get('id'))
  await setMessageRead(id, formData.get('read') === 'true')
}

export async function deleteMessage(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }

  const deleted = await prisma.contact.deleteMany({ where: { id } })
  if (deleted.count === 0) return { error: 'Ce message n’existe plus.' }

  revalidatePath('/admin', 'layout')
  redirectWithToast(safeReturn(formData.get('returnTo'), '/admin/messages'), 'Message supprimé.')
}
