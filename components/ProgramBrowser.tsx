'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useI18n } from '@/components/I18nProvider'
import { mediaSrc } from '@/lib/media'
import { fmt } from '@/lib/i18n/config'
import { formatHours } from '@/lib/programs'

export type BrowserProgram = {
  id: number
  slug: string
  title: string
  tagline: string
  domain: string
  level: string | null
  coverImage: string
  hours: number
  hoursPerDay: number
  modules: number
  formats: string[]
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Catalogue des programmes avec recherche, domaine et niveau (tout est affiché par défaut). */
export default function ProgramBrowser({ programs }: { programs: BrowserProgram[] }) {
  const { lang, t, href } = useI18n()
  const p = t.programs
  const [query, setQuery] = useState('')
  const [domain, setDomain] = useState('')
  const [level, setLevel] = useState('')

  const domains = useMemo(() => [...new Set(programs.map((x) => x.domain))], [programs])
  const levels = useMemo(() => [...new Set(programs.flatMap((x) => (x.level ? [x.level] : [])))], [programs])
  const q = norm(query.trim())
  const shown = programs.filter(
    (x) => (!domain || x.domain === domain) && (!level || x.level === level) && (!q || norm(`${x.title} ${x.tagline}`).includes(q)),
  )
  const active = query !== '' || domain !== '' || level !== ''

  return (
    <>
      {programs.length > 1 && (
        <form className="course-filter" role="search" onSubmit={(e) => e.preventDefault()}>
          <input type="search" className="course-filter-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={p.search} aria-label={p.search} />
          {domains.length > 1 && (
            <select value={domain} onChange={(e) => setDomain(e.target.value)} aria-label={p.allDomains}>
              <option value="">{p.allDomains}</option>
              {domains.map((d) => <option key={d} value={d}>{(p.domain as Record<string, string>)[d] ?? d}</option>)}
            </select>
          )}
          {levels.length > 1 && (
            <select value={level} onChange={(e) => setLevel(e.target.value)} aria-label={p.allLevels}>
              <option value="">{p.allLevels}</option>
              {levels.map((l) => <option key={l} value={l}>{(t.course.difficulty as Record<string, string>)[l] ?? l}</option>)}
            </select>
          )}
          {active && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQuery(''); setDomain(''); setLevel('') }}>{t.filter.reset}</button>}
          <span className="course-filter-count" aria-live="polite">{fmt(shown.length === 1 ? p.results_one : p.results_other, { n: shown.length })}</span>
        </form>
      )}

      {programs.length === 0 && <p className="course-filter-empty">{p.empty}</p>}
      {programs.length > 0 && shown.length === 0 && <p className="course-filter-empty">{p.none}</p>}

      <div className="courses-grid">
        {shown.map((x) => (
          <Link key={x.id} href={href(`/programs/${x.slug}`)} className="course-card" prefetch={false}>
            <div className="course-thumb program-card-thumb">
              {x.coverImage ? (
                <Image src={mediaSrc('programs', x.coverImage)} alt={x.title} fill sizes="(max-width: 640px) 100vw, 360px" quality={70} />
              ) : (
                <span className="course-thumb-placeholder">🎓</span>
              )}
              {x.level && <span className="tag-overlay tag-overlay-purple">{(t.course.difficulty as Record<string, string>)[x.level] ?? x.level}</span>}
            </div>
            <div className="course-body">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span className="tag tag-cyan">{(p.domain as Record<string, string>)[x.domain] ?? x.domain}</span>
              </div>
              <div className="course-title">{x.title}</div>
              {x.tagline && <div className="course-excerpt">{x.tagline}</div>}
              <div className="course-footer">
                {x.hours > 0 && <span>⏱ {formatHours(x.hours, x.hoursPerDay, lang)}</span>}
                {x.modules > 0 && <span>▶ {fmt(x.modules === 1 ? p.modules_one : p.modules_other, { n: x.modules })}</span>}
                <span style={{ marginLeft: 'auto', color: 'var(--purple-l)', fontWeight: 600 }}>→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
