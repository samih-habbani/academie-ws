'use client'

import { formatTime } from '@/lib/progress'
import { useI18n } from '@/components/I18nProvider'
import { fmt } from '@/lib/i18n/config'
import { useProgress } from './ProgressProvider'

/** Pastille de statut d'un chapitre : cercle vide (pas commencé), demi-cercle plein (en cours), coche (vu). */
export default function ChapterStatus({ chapterId }: { chapterId: number }) {
  const { loggedIn, entries } = useProgress()
  const { t } = useI18n()
  if (!loggedIn) return <span className="chapter-status" aria-hidden="true" />

  const entry = entries[chapterId]
  const state = entry?.completed ? 'done' : entry && entry.seconds > 0 ? 'started' : 'none'
  const label = state === 'done' ? t.progress.statusDone : state === 'started' ? fmt(t.progress.statusStarted, { time: formatTime(entry.seconds) }) : t.progress.statusNone

  return (
    <span className={`chapter-status chapter-status-${state}`} role="img" aria-label={label} title={label}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        {state === 'done' ? (
          <>
            <circle cx="11" cy="11" r="10" fill="currentColor" />
            <path d="M6.2 11.4l3.3 3.2 6.3-6.6" fill="none" stroke="#04030D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <circle cx="11" cy="11" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            {state === 'started' && <path d="M11 2 A9 9 0 0 0 11 20 Z" fill="currentColor" />}
          </>
        )}
      </svg>
    </span>
  )
}
