import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import AccountShell from '@/components/auth/AccountShell'
import { requireUser } from '@/lib/user-auth'
import { getDashboard, formatWatchTime, relativeDate, type CourseProgress } from '@/lib/dashboard'
import { formatTime } from '@/lib/progress'
import { chapterUrl, courseUrl } from '@/lib/urls'
import { mediaSrc } from '@/lib/media'

export const metadata: Metadata = { title: 'Mon tableau de bord — Académie WS', robots: { index: false } }

function Donut({ percent }: { percent: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" style={{ flexShrink: 0 }} role="img" aria-label={`Progression globale : ${percent} %`}>
      <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
      <circle cx="46" cy="46" r={r} fill="none" stroke="url(#dash-grad)" strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(percent / 100) * c} ${c}`} transform="rotate(-90 46 46)" />
      <defs>
        <linearGradient id="dash-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7C3AED" /><stop offset="1" stopColor="#22D3EE" /></linearGradient>
      </defs>
      <text x="46" y="51" textAnchor="middle" fontSize="17" fontWeight="800" fill="#fff" fontFamily="var(--f-display)">{percent}%</text>
    </svg>
  )
}

function CourseRow({ course }: { course: CourseProgress }) {
  const finished = course.total > 0 && course.completed >= course.total
  const href = course.next
    ? chapterUrl(course.slug, course.next.chapterId)
    : course.firstChapterId ? chapterUrl(course.slug, course.firstChapterId) : courseUrl(course.slug)
  return (
    <article className="dash-course">
      <Link href={courseUrl(course.slug)} className="dash-thumb" prefetch={false} aria-hidden="true" tabIndex={-1}>
        {course.logo ? <Image src={mediaSrc('courses', course.logo)} alt="" fill sizes="120px" /> : <span>🎬</span>}
      </Link>
      <div className="dash-course-main">
        <div className="dash-course-top">
          <Link href={courseUrl(course.slug)} className="dash-course-title" prefetch={false}>{course.title}</Link>
          {finished ? <span className="tag tag-green">✓ Terminé</span> : course.category && <span className="tag tag-purple">{course.category}</span>}
        </div>
        <div className="course-progress-bar" role="progressbar" aria-valuenow={course.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`Avancement de ${course.title}`}>
          <div style={{ width: `${course.percent}%` }} />
        </div>
        <div className="dash-course-meta">
          <strong>{course.percent} %</strong>
          <span>{course.completed} / {course.total} vidéos vues</span>
          {course.inProgress > 0 && <span>{course.inProgress} en cours</span>}
          <span>⏱ {formatWatchTime(course.watchedSeconds)}</span>
          <span>Dernière activité {relativeDate(course.lastActivity)}</span>
        </div>
      </div>
      <Link href={href} className={`btn ${finished ? 'btn-ghost' : 'btn-primary'} btn-sm`} prefetch={false}>
        {finished ? 'Revoir' : course.next?.kind === 'resume' ? 'Reprendre' : 'Continuer'}
      </Link>
    </article>
  )
}

export default async function DashboardPage() {
  const user = await requireUser('/dashboard')
  const { courses, recent, totals } = await getDashboard(user.id)
  const resumeCourse = courses.find((c) => c.next?.kind === 'resume') ?? courses.find((c) => c.next)
  const stats = [
    { label: 'Cours commencés', value: totals.coursesStarted, icon: '📚' },
    { label: 'Cours terminés', value: totals.coursesFinished, icon: '🏆' },
    { label: 'Vidéos vues', value: totals.videosCompleted, icon: '✅' },
    { label: 'Vidéos en cours', value: totals.videosInProgress, icon: '▶️' },
    { label: 'Temps de visionnage', value: formatWatchTime(totals.watchedSeconds), icon: '⏱' },
  ]

  return (
    <AccountShell width={1040}>
      <div className="profile-head">
        <div style={{ minWidth: 0 }}>
          <h1 className="auth-title" style={{ marginBottom: 2 }}>Bonjour{user.firstName ? ` ${user.firstName}` : ''} 👋</h1>
          <p className="auth-lead" style={{ margin: 0 }}>Voici où tu en es dans tes formations.</p>
        </div>
        <Link href="/profile" className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} prefetch={false}>Mon profil</Link>
      </div>

      {courses.length === 0 ? (
        <section className="auth-card dash-empty">
          <div style={{ fontSize: 44 }} aria-hidden="true">🚀</div>
          <h2>Tu n’as pas encore commencé de cours</h2>
          <p>Lance une vidéo : ta progression, tes cours en cours et tes statistiques apparaîtront ici.</p>
          <Link href="/#formations" className="btn btn-primary">Découvrir les formations</Link>
        </section>
      ) : (
        <>
          <section className="dash-stats" aria-label="Statistiques">
            <div className="dash-stat dash-stat-donut">
              <Donut percent={totals.percent} />
              <div>
                <div className="dash-stat-label">Progression globale</div>
                <div className="dash-stat-sub">{totals.videosCompleted} / {totals.videosTotal} vidéos de tes cours</div>
              </div>
            </div>
            {stats.map((s) => (
              <div key={s.label} className="dash-stat">
                <span className="dash-stat-icon" aria-hidden="true">{s.icon}</span>
                <div className="dash-stat-value">{s.value}</div>
                <div className="dash-stat-label">{s.label}</div>
              </div>
            ))}
          </section>

          {resumeCourse?.next && (
            <section className="dash-resume">
              <div>
                <div className="dash-resume-kicker">{resumeCourse.next.kind === 'resume' ? 'Reprendre là où tu t’es arrêté' : 'Prochaine vidéo'}</div>
                <h2>{resumeCourse.next.title}</h2>
                <p>{resumeCourse.title}{resumeCourse.next.kind === 'resume' && resumeCourse.next.duration > 0 ? ` · ${formatTime(resumeCourse.next.seconds)} sur ${formatTime(resumeCourse.next.duration)}` : ''}</p>
              </div>
              <Link href={chapterUrl(resumeCourse.slug, resumeCourse.next.chapterId)} className="btn btn-primary" prefetch={false}>
                {resumeCourse.next.kind === 'resume' ? '▶ Reprendre' : '▶ Regarder'}
              </Link>
            </section>
          )}

          <section className="dash-section">
            <h2>Mes cours</h2>
            <div className="dash-courses">{courses.map((c) => <CourseRow key={c.id} course={c} />)}</div>
          </section>

          <section className="dash-section">
            <h2>Activité récente</h2>
            <ul className="dash-activity">
              {recent.map((a) => (
                <li key={a.chapterId}>
                  <Link href={chapterUrl(a.courseSlug, a.chapterId)} prefetch={false}>
                    <span className={`chapter-status chapter-status-${a.completed ? 'done' : 'started'}`} aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 22 22">
                        {a.completed ? (
                          <><circle cx="11" cy="11" r="10" fill="currentColor" /><path d="M6.2 11.4l3.3 3.2 6.3-6.6" fill="none" stroke="#04030D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></>
                        ) : (
                          <><circle cx="11" cy="11" r="9.2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M11 2 A9 9 0 0 0 11 20 Z" fill="currentColor" /></>
                        )}
                      </svg>
                    </span>
                    <span className="dash-activity-main">
                      <span className="dash-activity-title">{a.chapterTitle}</span>
                      <span className="dash-activity-sub">{a.courseTitle}{!a.completed && a.duration > 0 ? ` · ${formatTime(a.seconds)} / ${formatTime(a.duration)}` : ''}</span>
                    </span>
                    <span className="dash-activity-date">{relativeDate(a.updatedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </AccountShell>
  )
}
