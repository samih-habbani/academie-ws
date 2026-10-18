'use client'

import { useActionState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import { useI18n } from '@/components/I18nProvider'
import { submitContact, type ContactFormState } from './actions'

const initialState: ContactFormState = { status: 'idle', message: '' }

export default function ContactPage() {
  const { lang, t, href } = useI18n()
  const [state, formAction, isPending] = useActionState(submitContact, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === 'success') formRef.current?.reset()
  }, [state.status])

  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />

      <div className="site-content">
        <Nav />

        <main style={{ flex: 1 }}>
          <div className="container" style={{ maxWidth: 640 }}>
            <div className="breadcrumb" style={{ paddingTop: 32 }}>
              <Link href={href('/')}>{t.common.home}</Link>
              <span style={{ fontSize: 12 }}>›</span>
              <span style={{ color: 'var(--purple-l)' }}>{t.nav.contact}</span>
            </div>

            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, marginBottom: 12 }}>
              {t.contact.title}
            </h1>
            <p style={{ color: 'var(--text-m)', marginBottom: 32 }}>
              {t.contact.lead}
            </p>

            <form ref={formRef} action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 64 }}>
              <input type="hidden" name="lang" value={lang} />
              <div className="grid-2col">
                <div className="form-field">
                  <label htmlFor="firstName">{t.contact.firstName} *</label>
                  <input id="firstName" name="firstName" type="text" required />
                </div>
                <div className="form-field">
                  <label htmlFor="lastName">{t.contact.lastName} *</label>
                  <input id="lastName" name="lastName" type="text" required />
                </div>
              </div>

              <div className="grid-2col">
                <div className="form-field">
                  <label htmlFor="email">{t.contact.email} *</label>
                  <input id="email" name="email" type="email" required />
                </div>
                <div className="form-field">
                  <label htmlFor="phone">{t.contact.phone}</label>
                  <input id="phone" name="phone" type="tel" />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="subject">{t.contact.subject} *</label>
                <input id="subject" name="subject" type="text" required />
              </div>

              <div className="form-field">
                <label htmlFor="message">{t.contact.message} *</label>
                <textarea id="message" name="message" rows={6} required />
              </div>

              {state.status !== 'idle' && (
                <div
                  role="status"
                  style={{
                    padding: '12px 16px',
                    borderRadius: 8,
                    fontSize: 14,
                    background: state.status === 'success' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                    border: `1px solid ${state.status === 'success' ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}`,
                    color: state.status === 'success' ? 'var(--success)' : '#F87171',
                  }}
                >
                  {state.message}
                </div>
              )}

              <button type="submit" className="btn btn-primary" disabled={isPending} style={{ alignSelf: 'flex-start' }}>
                {isPending ? t.contact.sending : t.contact.send}
              </button>
            </form>
          </div>
        </main>

        <Footer lang={lang} />
      </div>
    </>
  )
}
