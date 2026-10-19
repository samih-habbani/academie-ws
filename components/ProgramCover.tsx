import Image from 'next/image'
import { Award, Bot, Database, GraduationCap, Layers, LayoutTemplate, Megaphone, Network, Palette, Server, ShieldCheck, Smartphone, Sparkles, Terminal, ChartColumn } from 'lucide-react'
import type { ComponentType } from 'react'

type Art = { icon: ComponentType<{ className?: string; strokeWidth?: number }>; eyebrow: string }

// L'illustration est volontairement en anglais, quelle que soit la langue du site.
const ART: Record<string, Art> = {
  cursus: { icon: GraduationCap, eyebrow: 'Career path' },
  dev: { icon: Terminal, eyebrow: 'Foundations' },
  web: { icon: LayoutTemplate, eyebrow: 'Front-end' },
  backend: { icon: Server, eyebrow: 'Back-end' },
  mobile: { icon: Smartphone, eyebrow: 'Mobile' },
  data: { icon: ChartColumn, eyebrow: 'Data' },
  ai: { icon: Sparkles, eyebrow: 'Generative AI' },
  aidev: { icon: Bot, eyebrow: 'AI for developers' },
  compliance: { icon: ShieldCheck, eyebrow: 'Trust & compliance' },
  marketing: { icon: Megaphone, eyebrow: 'Growth' },
  systems: { icon: Network, eyebrow: 'Systems' },
  design: { icon: Palette, eyebrow: 'Design' },
  other: { icon: Layers, eyebrow: 'Training' },
}

// Outils trop génériques pour caractériser un programme : on ne les affiche pas sur l'illustration.
const GENERIC_TOOLS = new Set(['Visual Studio Code', 'Git', 'GitHub', 'Postman', 'IntelliJ IDEA', 'Android Studio', 'Jupyter Notebook', 'Maven', 'Composer', 'Microsoft Excel', 'Microsoft Word', 'MySQL', 'SQLite', 'HTML5', 'CSS3'])
export const coverTools = (names: string[]) => names.filter((n) => !GENERIC_TOOLS.has(n)).slice(0, 3)

/**
 * Illustration d'un programme : dégradé par domaine, motif, emblème, accroche en anglais, pastilles d'outils.
 * Les effets de survol (inclinaison, reflet, parallaxe) viennent des variables CSS posées par `useTilt`.
 */
export default function ProgramCover({ title, headline, domain, tools = [], certified = false, image, size = 'card' }: {
  title: string; headline?: string; domain: string; tools?: string[]; certified?: boolean; image?: string; size?: 'card' | 'hero'
}) {
  const art = ART[domain] ?? ART.other
  const Icon = art.icon
  const chips = coverTools(tools)
  return (
    <div className={`pcover pcover-${size}${chips.length > 0 ? ' pcover-has-chips' : ''}`} data-domain={domain} aria-hidden="true">
      {image ? (
        <Image src={image} alt="" fill sizes={size === 'hero' ? '(max-width: 800px) 100vw, 380px' : '(max-width: 640px) 100vw, 360px'} quality={70} className="pcover-photo" />
      ) : null}
      <div className="pcover-bg" />
      <div className="pcover-grid" />
      <div className="pcover-orb pcover-orb-a" />
      <div className="pcover-orb pcover-orb-b" />
      <div className="pcover-emblem"><Icon strokeWidth={1.3} /></div>
      <div className="pcover-text">
        <span className="pcover-eyebrow">{art.eyebrow}</span>
        <span className="pcover-headline">{headline?.trim() || title}</span>
      </div>
      {chips.length > 0 && <div className="pcover-chips">{chips.map((c) => <span key={c}>{c}</span>)}</div>}
      {certified && <span className="pcover-seal"><Award size={13} strokeWidth={2.2} />Certified</span>}
      <div className="pcover-glare" />
    </div>
  )
}
