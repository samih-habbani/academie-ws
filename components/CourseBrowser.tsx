'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import type { Difficulty } from '@prisma/client'
import CourseCard from '@/components/CourseCard'
import ThemeCard from '@/components/ThemeCard'
import { useI18n } from '@/components/I18nProvider'
import { mediaSrc } from '@/lib/media'
import { fmt } from '@/lib/i18n/config'

type BrowserTheme = { id: number; slug: string; title: string; description: string; img: string }
export type BrowserCourse = {
  id: number
  slug: string
  title: string
  description: string
  logo: string
  dateMs: number
  duration: string
  difficulty: Difficulty | null
  chapterCount: number | null
  theme: BrowserTheme | null
}
export type BrowserCategory = { id: number; title: string; description: string; logo: string; courses: BrowserCourse[] }

type Entry =
  | { kind: 'course'; dateMs: number; course: BrowserCourse }
  | { kind: 'theme'; dateMs: number; theme: BrowserTheme; courses: BrowserCourse[] }

// Ni accents ni majuscules : « Developpement » trouve « Développement ».
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Cours d'une même thématique regroupés sous une carte « thématique », le reste en cartes de cours (plus récent d'abord). */
function groupByTheme(courses: BrowserCourse[]): Entry[] {
  const groups = new Map<number, { theme: BrowserTheme; courses: BrowserCourse[] }>()
  const entries: Entry[] = []
  for (const course of courses) {
    if (course.theme) {
      const group = groups.get(course.theme.id)
      if (group) group.courses.push(course)
      else groups.set(course.theme.id, { theme: course.theme, courses: [course] })
    } else entries.push({ kind: 'course', dateMs: course.dateMs, course })
  }
  for (const { theme, courses: list } of groups.values()) {
    entries.push({ kind: 'theme', dateMs: Math.max(...list.map((c) => c.dateMs)), theme, courses: list })
  }
  return entries.sort((a, b) => b.dateMs - a.dateMs)
}

/**
 * Liste des formations par catégorie, avec filtres (catégorie, thématique, recherche par nom).
 * Par défaut tout est affiché, comme avant. Avec une thématique ou une recherche, on affiche
 * directement les cours correspondants ; avec seulement une catégorie, on garde les cartes « thématique ».
 */
export default function CourseBrowser({ categories }: { categories: BrowserCategory[] }) {
  const { lang, t } = useI18n()
  const [categoryId, setCategoryId] = useState('')
  const [themeId, setThemeId] = useState('')
  const [query, setQuery] = useState('')

  const themes = useMemo(() => {
    const map = new Map<number, BrowserTheme>()
    for (const cat of categories) {
      if (categoryId && String(cat.id) !== categoryId) continue
      for (const c of cat.courses) if (c.theme) map.set(c.theme.id, c.theme)
    }
    return [...map.values()].sort((a, b) => a.title.localeCompare(b.title, lang))
  }, [categories, categoryId, lang])

  const q = norm(query.trim())
  const filtering = themeId !== '' || q !== ''

  const sections = useMemo(
    () =>
      categories
        .filter((cat) => !categoryId || String(cat.id) === categoryId)
        .map((cat) => ({
          cat,
          courses: cat.courses.filter(
            (c) => (!themeId || String(c.theme?.id) === themeId) && (!q || norm(c.title).includes(q)),
          ),
        }))
        .filter((s) => s.courses.length > 0),
    [categories, categoryId, themeId, q],
  )
  const total = sections.reduce((sum, s) => sum + s.courses.length, 0)
  const active = categoryId !== '' || filtering

  const reset = () => { setCategoryId(''); setThemeId(''); setQuery('') }

  return (
    <>
      <form className="course-filter" role="search" aria-label={t.filter.label} onSubmit={(e) => e.preventDefault()}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.filter.search}
          aria-label={t.filter.search}
          className="course-filter-search"
        />
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setThemeId('') }}
          aria-label={t.filter.category}
        >
          <option value="">{t.filter.allCategories}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={themeId} onChange={(e) => setThemeId(e.target.value)} aria-label={t.filter.theme}>
          <option value="">{t.filter.allThemes}</option>
          {themes.map((th) => <option key={th.id} value={th.id}>{th.title}</option>)}
        </select>
        {active && <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>{t.filter.reset}</button>}
        <span className="course-filter-count" aria-live="polite">
          {fmt(total === 1 ? t.filter.results_one : t.filter.results_other, { n: total })}
        </span>
      </form>

      {sections.length === 0 && <p className="course-filter-empty">{t.filter.none}</p>}

      {sections.map(({ cat, courses }) => (
        <div key={cat.id} style={{ marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(124,58,237,.15)',
              border: '1px solid rgba(124,58,237,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {cat.logo ? (
                <Image src={mediaSrc('categories', cat.logo)} alt="" width={28} height={28} quality={70} style={{ width: 28, height: 28, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: 20 }}>📚</span>
              )}
            </div>
            <div>
              <h2 className="section-title" style={{ marginBottom: 2 }}>{cat.title}</h2>
              {cat.description && <p style={{ fontSize: 14, color: 'var(--text-d)' }}>{cat.description}</p>}
            </div>
          </div>

          <div className="courses-grid">
            {filtering
              ? [...courses].sort((a, b) => b.dateMs - a.dateMs).map((c) => <CourseCard key={c.id} course={{ ...c, theme: c.theme ? { title: c.theme.title } : null }} lang={lang} />)
              : groupByTheme(courses).map((entry) =>
                  entry.kind === 'theme' ? (
                    <ThemeCard
                      key={`theme-${entry.theme.id}`}
                      theme={{ ...entry.theme, courseCount: entry.courses.length }}
                      lang={lang}
                    />
                  ) : (
                    <CourseCard key={entry.course.id} course={{ ...entry.course, theme: null }} lang={lang} />
                  ),
                )}
          </div>
        </div>
      ))}
    </>
  )
}
