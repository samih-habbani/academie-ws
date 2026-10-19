import Image from 'next/image'
import Link from 'next/link'
import { mediaSrc } from '@/lib/media'
import { courseUrl } from '@/lib/urls'
import { fmt, localizePath, type Lang } from '@/lib/i18n/config'
import { getDict } from '@/lib/i18n/dictionaries'
import { formatHours, publicPrice, toLines, totalHours, type ProgramFull } from '@/lib/programs'
import PrintButton from '@/components/PrintButton'
import CourseCard from '@/components/CourseCard'
import { loadTranslations } from '@/lib/i18n/content'
import { localizeProgram } from '@/lib/i18n/programs'
import ProgramAccordion from '@/components/ProgramAccordion'
import ProgramCover from '@/components/ProgramCover'
import Tilt from '@/components/Tilt'

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section className="program-block">
      <h2>{title}</h2>
      <ul className="program-list">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>
    </section>
  )
}

/** Fiche programme complète (page publique et aperçu des brouillons). */
export default async function ProgramView({ program: source, lang, preview = false }: { program: ProgramFull; lang: Lang; preview?: boolean }) {
  const t = getDict(lang)
  const [program, tr] = await Promise.all([localizeProgram(source, lang), loadTranslations(lang, { course: source.courses.map((c) => c.id) })])
  const p = t.programs
  const hours = totalHours(program.modules)
  const price = publicPrice(program, lang)
  const subject = fmt(p.contactSubject, { title: program.title })
  const requestHref = `${localizePath(lang, '/contact')}?subject=${encodeURIComponent(subject)}`

  // Modules regroupés par « bloc » consécutif (Bloc 1 — Front-end, Jour 1…).
  const groups: { label: string; modules: typeof program.modules }[] = []
  for (const m of program.modules) {
    const last = groups[groups.length - 1]
    if (last && last.label === m.group) last.modules.push(m)
    else groups.push({ label: m.group, modules: [m] })
  }
  let counter = 0

  const facts = [
    hours ? { label: p.duration, value: formatHours(hours, program.hoursPerDay, lang) } : null,
    program.level ? { label: p.level, value: (t.course.difficulty as Record<string, string>)[program.level] ?? program.level } : null,
    program.formats.length ? { label: p.formats, value: program.formats.map((f) => (p.format as Record<string, string>)[f] ?? f).join(' · ') } : null,
    program.maxParticipants ? { label: p.participants, value: fmt(p.participantsValue, { n: program.maxParticipants }) } : null,
    price ? { label: p.price, value: price } : null,
  ].filter((f): f is { label: string; value: string } => f !== null)

  return (
    <div className="program-page">
      {preview && <div className="program-preview-banner" role="status">{p.previewBanner}</div>}

      <div className="breadcrumb" style={{ paddingTop: 32 }}>
        <Link href={localizePath(lang, '/')}>{t.common.home}</Link>
        <span style={{ fontSize: 12 }}>›</span>
        <Link href={localizePath(lang, '/programs')}>{p.navTitle}</Link>
        <span style={{ fontSize: 12 }}>›</span>
        <span style={{ color: 'var(--purple-l)' }}>{program.title}</span>
      </div>

      <header className="program-hero">
        <div className="program-hero-main">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className="tag tag-purple">{(p.domain as Record<string, string>)[program.domain] ?? program.domain}</span>
            {program.certifications.map((c) => <span key={c.id} className="tag tag-green">🎓 {c.name}</span>)}
          </div>
          <h1>{program.title}</h1>
          {program.tagline && <p className="program-tagline">{program.tagline}</p>}
          <div className="program-actions no-print">
            <Link href={requestHref} className="btn btn-primary">{p.request}</Link>
            <PrintButton label={p.download} />
          </div>
        </div>
        <Tilt className="program-cover program-cover-tilt" max={5}>
          <ProgramCover size="hero" title={program.title} headline={program.coverHeadline} domain={program.domain} tools={program.tools.map((t) => t.name)} certified={program.certifications.length > 0} image={program.coverImage ? mediaSrc('programs', program.coverImage) : undefined} />
        </Tilt>
      </header>

      {facts.length > 0 && (
        <dl className="program-facts">
          {facts.map((f) => (
            <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
      )}

      {program.summary && (
        <section className="program-block">
          <h2>{p.summary}</h2>
          <p className="program-text">{program.summary}</p>
        </section>
      )}

      <div className="program-cols">
        <ListBlock title={p.audience} items={toLines(program.audience)} />
        <ListBlock title={p.prerequisites} items={toLines(program.prerequisites)} />
      </div>
      <ListBlock title={p.objectives} items={program.objectives} />

      {program.modules.length > 0 && (
        <section className="program-block">
          <h2>{p.curriculum}</h2>
          <ProgramAccordion />
          <p className="program-sub">{fmt(program.modules.length === 1 ? p.modules_one : p.modules_other, { n: program.modules.length })}{hours ? ` · ${formatHours(hours, program.hoursPerDay, lang)}` : ''}</p>
          {groups.map((group, gi) => (
            <div key={gi} className="program-group">
              {group.label && <div className="program-group-label">{group.label}</div>}
              {group.modules.map((m) => {
                counter += 1
                const lines = toLines(m.content)
                return (
                  <details key={m.id} className="program-module" open={counter === 1}>
                    <summary>
                      <span className="program-module-num" aria-hidden="true">{counter}</span>
                      <span className="program-module-summary">
                        <span className="program-module-title">{m.title}</span>
                        <span className="program-module-meta">
                          {m.hours > 0 && <span className="program-module-hours">{formatHours(m.hours, program.hoursPerDay, lang)}</span>}
                          {m.workshops.length > 0 && <span className="program-module-ws-count">🛠 {fmt(m.workshops.length === 1 ? p.workshopsCount_one : p.workshopsCount_other, { n: m.workshops.length })}</span>}
                        </span>
                      </span>
                      <span className="program-module-chevron" aria-hidden="true" />
                    </summary>
                    <div className="program-module-body">
                      {m.method && <div className="program-module-method">{m.method}</div>}
                      {lines.length > 0 && <ul className="program-list">{lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
                      {m.workshops.length > 0 && (
                        <div className="program-workshops">
                          <div className="program-workshops-title">🛠 {p.workshops}</div>
                          {m.workshops.map((w) => (
                            <div key={w.id} className="program-workshop">
                              <div className="program-module-head">
                                <strong>{w.title}</strong>
                                {w.hours > 0 && <span className="program-module-hours">{formatHours(w.hours, program.hoursPerDay, lang)}</span>}
                              </div>
                              {w.description && <p>{w.description}</p>}
                              {w.deliverable && <div className="program-deliverable">✅ {p.deliverable} : {w.deliverable}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </details>
                )
              })}
            </div>
          ))}
        </section>
      )}

      {program.tools.length > 0 && (
        <section className="program-block">
          <h2>{p.tools}</h2>
          <div className="program-pills">
            {program.tools.map((tool) => (
              <span key={tool.id} className="program-pill">
                {tool.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaSrc('tools', tool.logo)} alt="" width={18} height={18} loading="lazy" />
                )}
                {tool.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {program.certifications.length > 0 && (
        <section className="program-block">
          <h2>{p.certifications}</h2>
          <div className="program-certs">
            {program.certifications.map((c) => (
              <div key={c.id} className="program-cert">
                <strong>{c.name}</strong>
                <div className="program-cert-meta">{[c.issuer, c.level, c.reference].filter(Boolean).join(' · ')}</div>
                {c.description && <p>{c.description}</p>}
                {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="no-print">{c.url.replace(/^https?:\/\//, '')} ↗</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="program-cols">
        <ListBlock title={p.methods} items={toLines(program.teachingMethods)} />
        <ListBlock title={p.evaluation} items={toLines(program.evaluation)} />
        <ListBlock title={p.equipment} items={toLines(program.equipment)} />
        <ListBlock title={p.resources} items={toLines(program.resources)} />
      </div>
      <ListBlock title={p.outcomes} items={program.outcomes} />

      {program.courses.length > 0 && (
        <section className="program-block program-courses no-print">
          <h2>{p.relatedCourses}</h2>
          <p className="program-sub">{p.relatedCoursesLead}</p>
          <div className="courses-grid">
            {program.courses.map((c) => (
              <CourseCard
                key={c.id}
                lang={lang}
                course={{ ...c, title: tr('course', c.id, 'title', c.title).trim(), description: tr('course', c.id, 'description', c.description), theme: null }}
              />
            ))}
          </div>
        </section>
      )}

      <div className="program-cta no-print">
        <Link href={requestHref} className="btn btn-primary">{p.request}</Link>
        <Link href={localizePath(lang, '/programs')} className="btn btn-ghost">{p.back}</Link>
      </div>
    </div>
  )
}
