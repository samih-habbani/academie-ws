'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { COMPLETED_RATIO, RESUME_END_MARGIN, RESUME_MIN_SECONDS, formatTime, type ProgressEntry } from '@/lib/progress'
import { useProgress } from '@/components/progress/ProgressProvider'
import { useI18n } from '@/components/I18nProvider'
import { fmt } from '@/lib/i18n/config'

// Partie minimale de l'API « IFrame Player » de YouTube utilisée ici.
type YTPlayer = {
  getCurrentTime(): number
  getDuration(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
  destroy(): void
}
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | null = null
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  apiPromise ??= new Promise<void>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { previous?.(); resolve() }
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiPromise
}

type State =
  | { status: 'checking' }
  | { status: 'locked' }
  | { status: 'error' }
  | { status: 'ready'; videoId: string; progress: ProgressEntry | null; audioTipDismissed: boolean }

const SAVE_EVERY_MS = 10_000
const PLAYING = 1, PAUSED = 2, ENDED = 0

/**
 * Lecteur vidéo réservé aux membres, avec reprise de lecture.
 * La page reste publique et en cache : l'identifiant de la vidéo n'y figure pas, il est demandé à
 * /api/chapter-video/<id> (401 si non connecté → fenêtre « Se connecter / Créer un compte »).
 * La position est enregistrée toutes les 10 s, à la pause, à la fin et en quittant la page.
 */
export default function VideoGate({ chapterId, title }: { chapterId: number; title: string }) {
  const pathname = usePathname()
  const { lang, t, href } = useI18n()
  const { update } = useProgress()
  const [state, setState] = useState<State>({ status: 'checking' })
  const [resumeAt, setResumeAt] = useState<number | null>(null)
  // Encart « langue audio » : vu une fois, il ne revient plus (mémorisé sur le compte du membre).
  const [tipHidden, setTipHidden] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  // 1) Droit de lecture + position de reprise
  useEffect(() => {
    if (!document.cookie.split('; ').includes('ws_in=1')) {
      setState({ status: 'locked' })
      return
    }
    const controller = new AbortController()
    fetch(`/api/chapter-video/${chapterId}`, { cache: 'no-store', signal: controller.signal })
      .then(async (res) => {
        if (res.status === 401) return setState({ status: 'locked' })
        const data = res.ok ? await res.json() : null
        setState(data?.videoId ? { status: 'ready', videoId: data.videoId, progress: data.progress ?? null, audioTipDismissed: !!data.audioTipDismissed } : { status: 'error' })
      })
      .catch((e) => { if (e?.name !== 'AbortError') setState({ status: 'error' }) })
    return () => controller.abort()
  }, [chapterId])

  // 2) Lecteur YouTube + enregistrement de la progression
  useEffect(() => {
    if (state.status !== 'ready') return
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let timer: ReturnType<typeof setInterval> | null = null
    let lastSaved = -1
    let noteTimer: ReturnType<typeof setTimeout> | null = null

    const saved = state.progress
    const resume = saved && saved.seconds >= RESUME_MIN_SECONDS && (saved.duration === 0 || saved.duration - saved.seconds > RESUME_END_MARGIN) ? saved.seconds : 0

    const save = (force = false) => {
      const player = playerRef.current
      if (!player) return
      try {
        const duration = Math.floor(player.getDuration())
        const seconds = Math.min(Math.floor(player.getCurrentTime()), duration)
        if (!duration || seconds < 1 || (!force && seconds === lastSaved)) return
        lastSaved = seconds
        const entry: ProgressEntry = { seconds, duration, completed: seconds / duration >= COMPLETED_RATIO }
        update(chapterId, entry)
        fetch('/api/progress', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chapterId, seconds, duration }),
          keepalive: true, // part même si la page se ferme
        }).catch(() => {})
      } catch {
        /* lecteur pas encore prêt ou déjà détruit */
      }
    }
    const stopTimer = () => { if (timer) { clearInterval(timer); timer = null } }
    const onHide = () => { if (document.visibilityState === 'hidden') save() }

    loadYouTubeApi().then(() => {
      if (disposed || !window.YT) return
      host.innerHTML = ''
      const mount = document.createElement('div')
      host.appendChild(mount)
      new window.YT.Player(mount, {
        videoId: state.videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          rel: 0, playsinline: 1, start: resume, origin: location.origin, hl: lang,
          // Vidéos en français : en anglais, on propose les sous-titres (traduits par YouTube si disponibles).
          ...(lang === 'en' ? { cc_lang_pref: 'en', cc_load_policy: 1 } : {}),
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (disposed) return e.target.destroy()
            playerRef.current = e.target
            if (resume > 0) {
              setResumeAt(resume)
              noteTimer = setTimeout(() => setResumeAt(null), 9000)
            }
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === PLAYING) {
              stopTimer()
              timer = setInterval(() => save(), SAVE_EVERY_MS)
            } else if (e.data === PAUSED || e.data === ENDED) {
              stopTimer()
              save(true)
            }
          },
        },
      })
    })

    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      disposed = true
      stopTimer()
      if (noteTimer) clearTimeout(noteTimer)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
      save() // changement de chapitre / fermeture de l'onglet
      try { playerRef.current?.destroy() } catch { /* déjà détruit */ }
      playerRef.current = null
      setResumeAt(null)
    }
  }, [state, chapterId, update, lang])

  // 3) Fenêtre de connexion
  useEffect(() => {
    if (state.status === 'locked' && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
  }, [state.status])

  const dismissTip = () => {
    setTipHidden(true)
    fetch('/api/audio-tip', { method: 'POST', keepalive: true }).catch(() => {})
  }

  if (state.status === 'ready') {
    return (
      <>
        <div ref={hostRef} className="video-host" aria-label={title} />
        {!state.audioTipDismissed && !tipHidden && (
          <div className="audio-tip" role="region" aria-label={t.player.audioTipTitle}>
            <strong>{t.player.audioTipTitle}</strong>
            <p>{t.player.audioTipAudio}</p>
            <p>{t.player.audioTipSubs}</p>
            <p className="audio-tip-note">{t.player.audioTipNote}</p>
            <button type="button" onClick={dismissTip}>{t.player.audioTipOk}</button>
          </div>
        )}
        {resumeAt !== null && (
          <div className="resume-note" role="status">
            <span>{fmt(t.player.resumeAt, { time: formatTime(resumeAt) })}</span>
            <button type="button" onClick={() => { playerRef.current?.seekTo(0, true); setResumeAt(null) }}>{t.player.fromStart}</button>
          </div>
        )}
      </>
    )
  }

  const next = encodeURIComponent(pathname)

  return (
    <div className="video-locked" role={state.status === 'checking' ? 'status' : undefined}>
      {state.status === 'checking' && <p>{t.player.loading}</p>}

      {state.status === 'error' && (
        <>
          <span className="video-locked-icon" aria-hidden="true">⚠️</span>
          <p>{t.player.error}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => location.reload()}>{t.player.retry}</button>
        </>
      )}

      {state.status === 'locked' && (
        <>
          <span className="video-locked-icon" aria-hidden="true">🔒</span>
          <p className="video-locked-title">{t.player.lockedTitle}</p>
          <p>{t.player.lockedText}</p>
          <button type="button" className="btn btn-primary" onClick={() => dialogRef.current?.showModal()}>{t.player.lockedBtn}</button>
        </>
      )}

      <dialog
        ref={dialogRef}
        className="gate-dialog"
        aria-labelledby="gate-title"
        onClick={(e) => { if (e.target === dialogRef.current) dialogRef.current?.close() }}
      >
        <button type="button" className="gate-close" aria-label={t.player.close} onClick={() => dialogRef.current?.close()}>×</button>
        <div className="gate-icon" aria-hidden="true">🔒</div>
        <h2 id="gate-title">{t.player.dialogTitle}</h2>
        <p>{t.player.dialogText}</p>
        <div className="gate-actions">
          <Link href={`${href('/login')}?next=${next}`} className="btn btn-primary" prefetch={false}>{t.player.login}</Link>
          <Link href={`${href('/register')}?next=${next}`} className="btn btn-ghost" prefetch={false}>{t.player.register}</Link>
        </div>
      </dialog>
    </div>
  )
}
