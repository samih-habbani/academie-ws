'use client'

import { useProgress } from './ProgressProvider'
import { useI18n } from '@/components/I18nProvider'
import { fmt } from '@/lib/i18n/config'

/** Barre « Ma progression » de la page d'un cours : pourcentage de vidéos vues. */
export function CourseProgressBar() {
  const { loggedIn, total, completedCount, percent } = useProgress()
  const { t } = useI18n()
  if (!loggedIn || total === 0) return null
  return (
    <div className="course-progress">
      <div className="course-progress-head">
        <span>{t.progress.title}</span>
        <strong>{percent} %</strong>
      </div>
      <div className="course-progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t.progress.ariaCourse}>
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="course-progress-sub">{fmt(completedCount > 1 ? t.progress.seen_other : t.progress.seen_one, { done: completedCount, total })}</div>
    </div>
  )
}

/** Compteur de la sidebar de lecture : « 3 / 12 vues » pour un membre, « 12 leçons » sinon. */
export function SidebarCount() {
  const { loggedIn, total, completedCount } = useProgress()
  const { t } = useI18n()
  return <span className="sidebar-progress">{loggedIn ? fmt(t.chapter.watched, { done: completedCount, total }) : fmt(t.chapter.lessons, { n: total })}</span>
}

/** Fine barre sous l'en-tête de la sidebar : vidéos vues pour un membre, position dans le cours sinon. */
export function SidebarBar({ fallbackPercent }: { fallbackPercent: number }) {
  const { loggedIn, percent } = useProgress()
  return (
    <div style={{ height: 3, background: 'rgba(255,255,255,.05)' }}>
      <div style={{ height: '100%', width: `${loggedIn ? percent : fallbackPercent}%`, background: 'linear-gradient(90deg,var(--purple),var(--cyan))', transition: 'width 1s ease' }} />
    </div>
  )
}
