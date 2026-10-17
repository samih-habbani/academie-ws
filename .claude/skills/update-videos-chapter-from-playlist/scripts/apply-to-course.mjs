#!/usr/bin/env node
// Rattache les vidéos d'une playlist (JSON produit par fetch-playlist.mjs) aux chapitres d'un cours.
// usage : node apply-to-course.mjs <id | slug | titre> <playlist.json> [--apply] [--accept-weak] [--map "chapitreId=videoId"]...
// Sans --apply : simple aperçu (aucune écriture). À lancer depuis la racine du projet (lit .env / DATABASE_URL).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const args = process.argv.slice(2)
const flag = (f) => args.includes(f)
const [courseArg, file] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--map')
const maps = args.flatMap((a, i) => (args[i - 1] === '--map' ? [a.split('=')] : []))
if (!courseArg || !file) { console.error('usage : apply-to-course.mjs <id|slug|titre> <playlist.json> [--apply] [--accept-weak] [--map chapitreId=videoId]'); process.exit(1) }

const prisma = new PrismaClient()
const retry = async (fn) => { for (let i = 1; ; i++) { try { return await fn() } catch (e) { if (i >= 6) throw e; await new Promise((r) => setTimeout(r, 2500 * i)) } } }
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const stripNum = (s) => s.replace(/^\s*(?:tp\s*)?\d+(?:[.\s]\d)?\s*(?:-\s*)?/i, '').replace(/\(\+ support pdf\)/i, '')
const tokens = (s) => new Set(norm(stripNum(s)).split(' ').filter((w) => w.length > 1))
function similarity(a, b) {
  const A = tokens(a), B = tokens(b)
  if (!A.size || !B.size) return 0
  const inter = [...A].filter((w) => B.has(w)).length
  return Math.max(inter / new Set([...A, ...B]).size, inter / Math.min(A.size, B.size) * 0.9)
}
const leadNum = (s) => { const m = /^\s*(\d+)(?:[.\s](\d))?\b/.exec(s); return m ? Number(m[1]) : null }
const leadFull = (s) => { const m = /^\s*(\d+)\.(\d)\b/.exec(s); return m ? `${Number(m[1])}.${m[2]}` : null }

async function findCourse() {
  if (/^\d+$/.test(courseArg)) return prisma.course.findUnique({ where: { id: Number(courseArg) }, select: { id: true, title: true, slug: true } })
  const bySlug = await prisma.course.findUnique({ where: { slug: courseArg }, select: { id: true, title: true, slug: true } })
  if (bySlug) return bySlug
  const list = await prisma.course.findMany({ where: { title: { contains: courseArg, mode: 'insensitive' } }, select: { id: true, title: true, slug: true } })
  if (list.length > 1) { console.error('Plusieurs cours correspondent :', list.map((c) => `${c.id} ${c.title.trim()}`).join(' | ')); process.exit(1) }
  return list[0] ?? null
}

;(async () => {
  const videos = JSON.parse(readFileSync(file, 'utf8'))
  const course = await retry(findCourse)
  if (!course) { console.error('Cours introuvable.'); process.exit(1) }
  const chapters = await retry(() => prisma.chapter.findMany({ where: { courseId: course.id }, orderBy: [{ numOrder: 'asc' }, { id: 'asc' }], select: { id: true, title: true, urlVideo: true } }))
  console.log(`Cours ${course.id} « ${course.title.trim()} » (/course/${course.slug}) : ${chapters.length} chapitres, ${videos.length} vidéos\n`)

  // 1) correspondances manuelles ; 2) toutes les paires chapitre/vidéo notées puis attribuées au meilleur score
  const forced = new Map(maps.map(([c, v]) => [Number(c), v]))
  const pairs = []
  for (const c of chapters) {
    for (const v of videos) {
      const sim = similarity(c.title, v.title)
      const cn = leadNum(c.title), vn = leadNum(v.title)
      const sameNum = cn !== null && cn === vn
      const decimalOk = leadFull(c.title) === leadFull(v.title) || (!leadFull(c.title) && !/^\s*\d+[.\s]\d\b/.test(v.title))
      let score = sim + (sameNum ? 1 : 0) + (sameNum && decimalOk ? 0.5 : 0)
      if (cn === null && sim < 0.8) score = 0 // chapitre sans numéro : seul un titre quasi identique compte
      if (cn !== null && !sameNum && sim < 0.8) score = 0
      if (score > 0) pairs.push({ c, v, score, sim, sameNum })
    }
  }
  pairs.sort((a, b) => b.score - a.score || videos.indexOf(a.v) - videos.indexOf(b.v))
  const usedC = new Set(), usedV = new Set(), plan = []
  for (const [cid, vid] of forced) { const c = chapters.find((x) => x.id === cid), v = videos.find((x) => x.id === vid); if (c && v) { plan.push({ c, v, weak: false, note: 'manuel' }); usedC.add(c.id); usedV.add(v.id) } }
  for (const p of pairs) {
    if (usedC.has(p.c.id) || usedV.has(p.v.id)) continue
    usedC.add(p.c.id); usedV.add(p.v.id)
    plan.push({ c: p.c, v: p.v, weak: p.sameNum && p.sim < 0.35, note: p.sameNum ? (p.sim < 0.35 ? 'n° identique mais titre très différent' : '') : 'par titre' })
  }
  plan.sort((a, b) => chapters.indexOf(a.c) - chapters.indexOf(b.c))
  for (const p of plan) console.log(p.weak ? ' ⚠' : ' ✓', String(p.c.id).padEnd(5), p.c.title.trim().slice(0, 56).padEnd(56), '→', p.v.id, '|', p.v.title.trim().slice(0, 50), p.note ? `[${p.note}]` : '')

  const noVideo = chapters.filter((c) => !usedC.has(c.id)).map((c) => `${c.id}: ${c.title.trim()}`)
  const unused = videos.filter((v) => !usedV.has(v.id))
  console.log(`\n${plan.length} / ${chapters.length} chapitres appariés (${plan.filter((p) => p.weak).length} douteux).`)
  console.log('Chapitres sans vidéo :', noVideo.length ? '\n  - ' + noVideo.join('\n  - ') : '—')
  console.log('Vidéos non utilisées :', unused.length ? '\n  - ' + unused.map((v) => `${v.id} ${v.title.trim()}`).join('\n  - ') : '—')

  if (!flag('--apply')) { console.log('\n(aperçu : rien n\'a été modifié — relance avec --apply)'); return }
  const toApply = plan.filter((p) => !p.weak || flag('--accept-weak'))
  mkdirSync('.backups', { recursive: true })
  const backup = `.backups/course${course.id}-urlVideo-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  writeFileSync(backup, JSON.stringify(chapters, null, 1))
  for (const p of toApply) await retry(() => prisma.chapter.update({ where: { id: p.c.id }, data: { urlVideo: `https://www.youtube.com/watch?v=${p.v.id}` } }))
  const n = await retry(() => prisma.chapter.count({ where: { courseId: course.id, urlVideo: { contains: 'youtube.com/watch' } } }))
  console.log(`\nAppliqué : ${toApply.length} chapitres mis à jour (${plan.length - toApply.length} douteux ignorés). Cours : ${n}/${chapters.length} en YouTube. Sauvegarde : ${backup}`)
})().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
