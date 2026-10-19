'use client'

import type { ReactNode } from 'react'
import { useTilt } from '@/components/useTilt'

/** Enveloppe inclinable (effet 3D au survol) pour les blocs rendus côté serveur. */
export default function Tilt({ className, children, max = 5 }: { className?: string; children: ReactNode; max?: number }) {
  const tilt = useTilt(max)
  return <div className={className} {...tilt}>{children}</div>
}
