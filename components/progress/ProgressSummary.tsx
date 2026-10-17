'use client'

import { useProgress } from './ProgressProvider'

/** Barre « Ma progression » de la page d'un cours : pourcentage de vidéos vues. */
export function CourseProgressBar() {
  const { loggedIn, total, completedCount, percent } = useProgress()
  if (!loggedIn || total === 0) return null
  return (
    <div className="course-progress">
      <div className="course-progress-head">
        <span>Ma progression</span>
        <strong>{percent} %</strong>
      </div>
      <div className="course-progress-bar" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Avancement du cours">
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="course-progress-sub">{completedCount} / {total} vidéo{total > 1 ? 's' : ''} vue{completedCount > 1 ? 's' : ''}</div>
    </div>
  )
}

/** Compteur de la sidebar de lecture : « 3 / 12 vues » pour un membre, « 12 leçons » sinon. */
export function SidebarCount() {
  const { loggedIn, total, completedCount } = useProgress()
  return <span className="sidebar-progress">{loggedIn ? `${completedCount} / ${total} vues` : `${total} leçons`}</span>
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
