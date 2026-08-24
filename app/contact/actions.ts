'use server'

import { prisma } from '@/lib/db'

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitContact(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const subject = String(formData.get('subject') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!firstName || !lastName || !email || !subject || !message) {
    return { status: 'error', message: 'Merci de remplir tous les champs obligatoires.' }
  }

  if (!EMAIL_REGEX.test(email)) {
    return { status: 'error', message: 'Adresse email invalide.' }
  }

  try {
    await prisma.contact.create({
      data: { firstName, lastName, email, phone: phone || null, subject, message },
    })
  } catch {
    return { status: 'error', message: 'Une erreur est survenue, réessaie plus tard.' }
  }

  return { status: 'success', message: 'Ton message a bien été envoyé, on te répond rapidement !' }
}
