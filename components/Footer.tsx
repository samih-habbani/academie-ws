import { getDict } from '@/lib/i18n/dictionaries'
import { localizePath, type Lang } from '@/lib/i18n/config'

export default function Footer({ lang }: { lang: Lang }) {
  const t = getDict(lang)
  return (
    <footer className="footer-futuriste">
      <div className="f-logo">Académie<em>WS</em></div>
      <div className="f-links">
        <a href="#">{t.footer.legal}</a>
        <a href="#">{t.footer.terms}</a>
        <a href={localizePath(lang, '/contact')}>{t.footer.contact}</a>
      </div>
      <div className="f-copy">© {new Date().getFullYear()} Académie WS · {t.footer.rights}</div>
    </footer>
  )
}
