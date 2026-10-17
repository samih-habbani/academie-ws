'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ProgressEntry } from '@/lib/progress'

type Ctx = {
  /** null = en cours de vérification ; false = visiteur non connecté (aucun repère affiché). */
  loggedIn: boolean | null
  entries: Record<number, ProgressEntry>
  total: number
  completedCount: number
  percent: number
  update: (chapterId: number, entry: ProgressEntry) => void
}

const ProgressContext = createContext<Ctx | null>(null)

/**
 * Progression du membre sur un cours. Les pages restent publiques et en cache : la progression
 * est demandée après coup, une seule fois, à /api/course-progress/<cours> (401 si non connecté).
 */
export function ProgressProvider({ courseId, chapterIds, children }: { courseId: number; chapterIds: number[]; children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [entries, setEntries] = useState<Record<number, ProgressEntry>>({})

  useEffect(() => {
    if (!document.cookie.split('; ').includes('ws_in=1')) {
      setLoggedIn(false)
      return
    }
    const controller = new AbortController()
    fetch(`/api/course-progress/${courseId}`, { cache: 'no-store', signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return setLoggedIn(false)
        const data: { progress: (ProgressEntry & { chapterId: number })[] } = await res.json()
        setEntries(Object.fromEntries(data.progress.map(({ chapterId, ...rest }) => [chapterId, rest])))
        setLoggedIn(true)
      })
      .catch((e) => { if (e?.name !== 'AbortError') setLoggedIn(false) })
    return () => controller.abort()
  }, [courseId])

  const update = useCallback((chapterId: number, entry: ProgressEntry) => {
    setEntries((prev) => {
      const old = prev[chapterId]
      return { ...prev, [chapterId]: { ...entry, completed: entry.completed || !!old?.completed } }
    })
    setLoggedIn(true)
  }, [])

  const value = useMemo<Ctx>(() => {
    const ids = new Set(chapterIds)
    const completedCount = Object.entries(entries).filter(([id, e]) => ids.has(Number(id)) && e.completed).length
    const total = chapterIds.length
    return { loggedIn, entries, total, completedCount, percent: total ? Math.round((completedCount / total) * 100) : 0, update }
  }, [loggedIn, entries, chapterIds, update])

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress doit être utilisé dans <ProgressProvider>.')
  return ctx
}
