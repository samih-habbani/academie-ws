import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import AccountShell from '@/components/auth/AccountShell'
import { getUser, safeNext } from '@/lib/user-auth'
import { hasLang, localizePath } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'
import LoginForm from './LoginForm'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ next?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  return hasLang(lang) ? { title: getDict(lang).meta.login, robots: { index: false } } : {}
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!hasLang(lang)) notFound()
  const t = getDict(lang)
  const next = safeNext((await searchParams).next, localizePath(lang, '/profile'))
  if (await getUser()) redirect(next)
  return (
    <AccountShell lang={lang}>
      <h1 className="auth-title">{t.auth.loginTitle}</h1>
      <p className="auth-lead">{t.auth.loginLead}</p>
      <LoginForm next={next} />
    </AccountShell>
  )
}
