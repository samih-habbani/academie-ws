'use server'

import { prisma } from '@/lib/db'
import { DEFAULT_LANG, hasLang } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'

export type ContactFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function submitContact(
  _prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const langField = String(formData.get('lang') ?? DEFAULT_LANG)
  const t = getDict(hasLang(langField) ? langField : DEFAULT_LANG).contact
  const firstName = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const subject = String(formData.get('subject') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()

  if (!firstName || !lastName || !email || !subject || !message) {
    return { status: 'error', message: t.missing }
  }

  if (!EMAIL_REGEX.test(email)) {
    return { status: 'error', message: t.invalidEmail }
  }

  try {
    await prisma.contact.create({
      data: { firstName, lastName, email, phone: phone || null, subject, message },
    })
  } catch {
    return { status: 'error', message: t.failed }
  }

  return { status: 'success', message: t.success }
}
