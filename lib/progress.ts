/** Part de la vidéo à partir de laquelle un chapitre est considéré comme « vu ». */
export const COMPLETED_RATIO = 0.9

/** Position avant laquelle on ne reprend pas (début de vidéo) et marge avant la fin (on repart du début). */
export const RESUME_MIN_SECONDS = 5
export const RESUME_END_MARGIN = 15

export type ProgressEntry = { seconds: number; duration: number; completed: boolean }

export const formatTime = (total: number) => {
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`
}
