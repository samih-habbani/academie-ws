'use client'

import { useEffect } from 'react'
import { useI18n } from '@/components/I18nProvider'

const modules = () => Array.from(document.querySelectorAll<HTMLDetailsElement>('details.program-module'))

/**
 * Boutons « Tout déplier / Tout replier » du programme détaillé. Gère aussi l'impression : un module
 * replié n'apparaît pas dans un PDF, on déplie donc tout avant d'imprimer puis on rétablit l'état.
 */
export default function ProgramAccordion() {
  const { t } = useI18n()

  useEffect(() => {
    let saved: boolean[] = []
    const before = () => { const list = modules(); saved = list.map((d) => d.open); list.forEach((d) => { d.open = true }) }
    const after = () => { modules().forEach((d, i) => { d.open = saved[i] ?? d.open }) }
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after) }
  }, [])

  const setAll = (open: boolean) => modules().forEach((d) => { d.open = open })

  return (
    <div className="program-accordion-controls no-print">
      <button type="button" onClick={() => setAll(true)}>{t.programs.expandAll}</button>
      <span aria-hidden="true">·</span>
      <button type="button" onClick={() => setAll(false)}>{t.programs.collapseAll}</button>
    </div>
  )
}
