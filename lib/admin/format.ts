const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const dateTimeFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

export const formatDate = (date: Date) => dateFormat.format(date)
export const formatDateTime = (date: Date) => dateTimeFormat.format(date)

/** Valeur pour <input type="date"> (AAAA-MM-JJ). */
export const toDateInput = (date: Date) => date.toISOString().slice(0, 10)

export const DIFFICULTY_LABELS: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
}

export const CHAPTER_TYPE_LABELS: Record<string, string> = {
  cours: 'Cours',
  exo: 'Exercice',
  tp: 'TP',
  quiz: 'Quiz',
}
