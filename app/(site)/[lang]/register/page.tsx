import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import AccountShell from '@/components/auth/AccountShell'
import { getUser, safeNext } from '@/lib/user-auth'
import { hasLang, localizePath } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'
import RegisterForm from './RegisterForm'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ next?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  return hasLang(lang) ? { title: getDict(lang).meta.register, robots: { index: false } } : {}
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!hasLang(lang)) notFound()
  const t = getDict(lang)
  const raw = (await searchParams).next
  const next = raw ? safeNext(raw, '') : ''
  if (await getUser()) redirect(next || localizePath(lang, '/profile'))
  return (
    <AccountShell lang={lang} width={520}>
      <h1 className="auth-title">{t.auth.registerTitle}</h1>
      <p className="auth-lead">{t.auth.registerLead}</p>
      <RegisterForm next={next} />
    </AccountShell>
  )
}
