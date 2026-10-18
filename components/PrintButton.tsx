'use client'

/** Ouvre la boîte d'impression du navigateur : « Enregistrer au format PDF » donne la fiche programme. */
export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
      ⬇ {label.replace(/^⬇\s*/, '')}
    </button>
  )
}
