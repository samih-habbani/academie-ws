import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { syne, dmSans } from '../../fonts'
import '../../globals.css'
import { I18nProvider } from '@/components/I18nProvider'
import { LANGS, hasLang } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!hasLang(lang)) return {}
  const t = getDict(lang)
  return { metadataBase: new URL('https://academiews.com'), title: t.meta.title, description: t.meta.description }
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!hasLang(lang)) notFound()
  const dict = getDict(lang)

  return (
    <html lang={lang} className={`${syne.variable} ${dmSans.variable}`}>
      <body>
        <I18nProvider lang={lang} dict={dict}>{children}</I18nProvider>
      </body>
    </html>
  )
}
