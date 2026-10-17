#!/usr/bin/env node
// Récupère les vidéos d'une playlist YouTube publique/non répertoriée (sans clé API).
// usage : node fetch-playlist.mjs <playlistId | url> [sortie.json]
//         node fetch-playlist.mjs --channel [@handle]      → liste les playlists de la chaîne
import { writeFileSync } from 'node:fs'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'
const get = async (url) => (await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'fr-FR' } })).text()
const initialData = (html) => JSON.parse(html.match(/var ytInitialData = (\{.*?\});<\/script>/s)[1])

function collectVideos(root) {
  const items = []
  let next = null
  ;(function walk(o) {
    if (!o || typeof o !== 'object') return
    if (Array.isArray(o) && o.some((e) => e && (e.playlistVideoRenderer || e.lockupViewModel?.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO'))) {
      for (const e of o) {
        if (e?.playlistVideoRenderer) {
          const r = e.playlistVideoRenderer
          items.push({ id: r.videoId, title: r.title?.runs?.[0]?.text ?? r.title?.simpleText })
        } else if (e?.lockupViewModel?.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
          items.push({ id: e.lockupViewModel.contentId, title: e.lockupViewModel.metadata?.lockupMetadataViewModel?.title?.content })
        } else if (e?.continuationItemRenderer) {
          next = e.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token ?? next
        }
      }
      return
    }
    for (const k of Object.keys(o)) walk(o[k])
  })(root)
  return { items, next }
}

async function channelPlaylists(handle) {
  const data = initialData(await get(`https://www.youtube.com/${handle}/playlists`))
  const out = []
  ;(function walk(o) {
    if (!o || typeof o !== 'object') return
    const l = o.lockupViewModel
    if (l?.contentType === 'LOCKUP_CONTENT_TYPE_PLAYLIST') out.push([l.contentId, l.metadata?.lockupMetadataViewModel?.title?.content])
    if (o.gridPlaylistRenderer) out.push([o.gridPlaylistRenderer.playlistId, o.gridPlaylistRenderer.title?.runs?.[0]?.text])
    for (const k of Object.keys(o)) walk(o[k])
  })(data)
  out.forEach(([id, title]) => console.log(id, '|', title))
  console.log(out.length, 'playlists')
}

async function main() {
  const [arg, outFile] = process.argv.slice(2)
  if (!arg) { console.error('usage : fetch-playlist.mjs <playlistId|url> [sortie.json]  |  --channel [@handle]'); process.exit(1) }
  if (arg === '--channel') return channelPlaylists(outFile ?? '@samih-habbani')

  let id = arg
  if (/^https?:/.test(arg)) {
    id = new URL(arg).searchParams.get('list')
    if (!id) {
      console.error('Cette URL est celle d\'UNE vidéo, pas d\'une playlist (pas de paramètre list=).')
      console.error('Retrouve la playlist du cours avec :  node fetch-playlist.mjs --channel')
      process.exit(2)
    }
  }
  const html = await get(`https://www.youtube.com/playlist?list=${id}&cb=${Date.now()}`)
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.replace(/ - YouTube$/, '')
  const data = initialData(html)
  let { items, next } = collectVideos(data)
  const key = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1]
  const ver = html.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/)?.[1]
  for (let page = 1; next && page < 40; page++) {
    const res = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${key}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': UA },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: ver, hl: 'fr' } }, continuation: next }),
    })
    const r = collectVideos(await res.json())
    items = items.concat(r.items)
    next = r.next
  }
  const seen = new Set()
  const videos = items.filter((v) => v.id && !seen.has(v.id) && seen.add(v.id))

  const hidden = JSON.stringify(data).match(/(\d+) vidéos? non disponibles? (?:ont|a) été masquées?/)
  console.log(`Playlist « ${title} » : ${videos.length} vidéos lues`)
  if (hidden) console.log(`⚠ YouTube a MASQUÉ ${hidden[1]} vidéos (privées / en cours de traitement) : passe-les en « Non répertoriée » ou « Publique » puis relance.`)
  if (!videos.length) process.exit(3)
  if (outFile) writeFileSync(outFile, JSON.stringify(videos, null, 1))
  videos.forEach((v, i) => console.log(String(i + 1).padStart(2), v.id, '|', v.title))
}
main().catch((e) => { console.error(e); process.exit(1) })
