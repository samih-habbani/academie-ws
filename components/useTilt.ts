import type { PointerEvent } from 'react'

/**
 * Effet « carte 3D » : suit le pointeur (souris uniquement) et expose des variables CSS
 * (--rx, --ry, --mx, --my, --px, --py) utilisées par les styles `.program-card` et `.pcover`.
 */
export function useTilt(max = 7) {
  return {
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (e.pointerType !== 'mouse') return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = (e.clientY - r.top) / r.height
      el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
      el.style.setProperty('--rx', `${((0.5 - y) * max * 2).toFixed(2)}deg`)
      el.style.setProperty('--ry', `${((x - 0.5) * max * 2).toFixed(2)}deg`)
      el.style.setProperty('--px', ((x - 0.5) * 2).toFixed(3))
      el.style.setProperty('--py', ((y - 0.5) * 2).toFixed(3))
    },
    onPointerLeave(e: PointerEvent<HTMLElement>) {
      const el = e.currentTarget
      for (const v of ['--mx', '--my', '--rx', '--ry', '--px', '--py']) el.style.removeProperty(v)
    },
  }
}
