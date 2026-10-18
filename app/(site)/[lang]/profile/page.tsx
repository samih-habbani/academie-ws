import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AccountShell from '@/components/auth/AccountShell'
import { requireUser } from '@/lib/user-auth'
import { logout } from '@/lib/auth-actions'
import { fmt, hasLang, INTL_LOCALE, localizePath } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'
import { DeleteAccountForm, PasswordForm, ProfileForm } from './ProfileForms'

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<{ welcome?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  return hasLang(lang) ? { title: getDict(lang).meta.profile, robots: { index: false } } : {}
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!hasLang(lang)) notFound()
  const t = getDict(lang)
  const user = await requireUser(localizePath(lang, '/profile'), lang)
  const welcome = (await searchParams).welcome === '1'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  const initials = ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') || user.email[0]).toUpperCase()

  return (
    <AccountShell lang={lang} width={720}>
      {welcome && <div className="auth-alert auth-alert-ok" role="status">{t.profile.welcome}</div>}

      <div className="profile-head">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <h1 className="auth-title" style={{ marginBottom: 2 }}>{name || t.profile.title}</h1>
          <p className="auth-lead" style={{ margin: 0, overflowWrap: 'anywhere' }}>
            {user.email} · {fmt(t.profile.memberSince, { date: user.createdAt.toLocaleDateString(INTL_LOCALE[lang]) })}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href={localizePath(lang, '/dashboard')} className="btn btn-ghost btn-sm" prefetch={false}>{t.profile.dashboard}</Link>
          <form action={logout}>
            <input type="hidden" name="lang" value={lang} />
            <button type="submit" className="btn btn-ghost btn-sm">{t.profile.logout}</button>
          </form>
        </div>
      </div>

      <section className="auth-card">
        <h2>{t.profile.infoTitle}</h2>
        <ProfileForm initial={{ email: user.email, firstName: user.firstName ?? '', lastName: user.lastName ?? '', phone: user.phone ?? '', bio: user.bio ?? '' }} />
      </section>

      <section className="auth-card">
        <h2>{t.profile.passwordTitle}</h2>
        <PasswordForm />
      </section>

      <section className="auth-card auth-card-danger">
        <h2>{t.profile.deleteTitle}</h2>
        <DeleteAccountForm isAdmin={user.isAdmin} />
      </section>
    </AccountShell>
  )
}
