import Link from 'next/link'
import { apiFetch, apiPublic, getSession, type ApiEvent } from '../../lib/api'
import {
  getTemplate, resolvePalette, resolveSections,
  type EventConfiguration, type SectionKey, type Palette, type Template,
} from '../../lib/templates'
import { RegisterForm } from './register-form'

export const dynamic = 'force-dynamic'

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) return <NotLive />

  // A signed-in organizer can preview their own event at any status (this is
  // what the customizer iframe renders). Anonymous visitors get the public,
  // sanitized view, which only resolves once the event is published.
  const session = await getSession()
  const evt = session
    ? await apiFetch<ApiEvent>(`/api/v1/events/${eventId}`)
    : await apiPublic<ApiEvent>(`/api/v1/public/events/${eventId}`)

  if (!evt.ok) {
    return <NotLive />
  }

  const event = evt.data
  const template = getTemplate(event.templateId)

  if (!template) {
    // Organizer previewing before picking a template — point them back to it.
    // Public visitors should never hit this (published events have a template).
    if (session) {
      return (
        <main className="container-page py-16">
          <p className="text-sm text-muted">No template selected yet for this event.</p>
          <Link href={`/dashboard/events/${event.id}/template`} className="btn btn-primary mt-4">
            Pick a template
          </Link>
        </main>
      )
    }
    return <NotLive />
  }

  const config = (event.configuration ?? {}) as EventConfiguration
  const palette = resolvePalette(template, config)
  const sections = resolveSections(template, config)
  const tagline = config.tagline ?? template.tagline

  const cssVars = {
    '--evt-primary': palette.primary,
    '--evt-accent': palette.accent,
    '--evt-surface': palette.surface,
    '--evt-text': palette.text,
  } as React.CSSProperties

  const isDark = isDarkSurface(palette.surface)

  return (
    <div
      style={{ ...cssVars, background: palette.surface, color: palette.text }}
      className={isDark ? 'evt-theme-dark' : 'evt-theme-light'}
    >
      {sections.map((key) => (
        <Section key={key} kind={key} event={event} template={template} tagline={tagline} palette={palette} />
      ))}
      <footer className="border-t border-current/10 px-6 py-8 text-center text-xs opacity-60">
        Built with Eventra · template &ldquo;{template.name}&rdquo;
      </footer>
    </div>
  )
}

function Section({
  kind, event, template, tagline, palette,
}: {
  kind: SectionKey
  event: ApiEvent
  template: Template
  tagline: string
  palette: Palette
}) {
  switch (kind) {
    case 'hero':
      return <HeroSection event={event} template={template} tagline={tagline} palette={palette} />
    case 'about':
      return <AboutSection event={event} palette={palette} />
    case 'schedule':
      return <ScheduleSection event={event} palette={palette} />
    case 'speakers':
      return <SpeakersSection palette={palette} />
    case 'sponsors':
      return <SponsorsSection palette={palette} />
    case 'register':
      return <RegisterSection event={event} palette={palette} />
    case 'location':
      return <LocationSection event={event} palette={palette} />
    case 'faq':
      return <FaqSection palette={palette} />
  }
}

function HeroSection({
  event, template, tagline, palette,
}: {
  event: ApiEvent
  template: Template
  tagline: string
  palette: Palette
}) {
  const { primary, accent, surface } = palette
  const bg =
    template.heroStyle === 'gradient'
      ? `linear-gradient(135deg, ${primary}, ${accent})`
      : template.heroStyle === 'mesh'
      ? `radial-gradient(60% 80% at 20% 20%, ${primary}55 0%, transparent 60%), radial-gradient(60% 80% at 80% 70%, ${accent}55 0%, transparent 60%), ${surface}`
      : template.heroStyle === 'split'
      ? `linear-gradient(90deg, ${surface} 50%, ${primary}25 50%)`
      : surface

  const dateStr = formatRange(event.startDate, event.endDate)

  return (
    <section
      style={{ background: bg, color: template.heroStyle === 'gradient' ? '#fff' : palette.text }}
      className="relative overflow-hidden px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl">
        <span
          className="inline-block rounded-full border border-current/30 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-widest opacity-90"
        >
          {dateStr}
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
          {event.name}
        </h1>
        <p className="mt-5 max-w-2xl text-lg opacity-85">{tagline}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#register"
            className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:opacity-90"
            style={{ background: accent, color: '#fff' }}
          >
            Register
          </a>
          {event.venue && (
            <a
              href="#location"
              className="inline-flex items-center gap-2 rounded-full border border-current/30 px-5 py-3 text-sm font-medium hover:bg-current/5"
            >
              {event.venue}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

function AboutSection({ event, palette }: { event: ApiEvent; palette: Palette }) {
  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeader title="About" palette={palette} />
        <p className="mt-6 text-lg leading-8 opacity-85">
          {event.description ?? 'Tell attendees what to expect. Add a description in the customizer.'}
        </p>
      </div>
    </section>
  )
}

function ScheduleSection({ event, palette }: { event: ApiEvent; palette: Palette }) {
  const start = new Date(event.startDate)
  const placeholder = [
    { time: '09:00', title: 'Doors & coffee' },
    { time: '10:00', title: 'Opening keynote' },
    { time: '12:30', title: 'Lunch' },
    { time: '14:00', title: 'Workshops' },
    { time: '17:00', title: 'Closing & drinks' },
  ]
  return (
    <section className="px-6 py-16 sm:py-20" style={{ background: 'rgb(0 0 0 / 0.03)' }}>
      <div className="mx-auto max-w-3xl">
        <SectionHeader title="Schedule" palette={palette} subtitle={start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} />
        <ol className="mt-8 space-y-3">
          {placeholder.map((row) => (
            <li
              key={row.time}
              className="grid grid-cols-[80px_1fr] items-center gap-4 rounded-xl border border-current/10 bg-current/5 px-4 py-3"
            >
              <span className="font-mono text-sm opacity-70">{row.time}</span>
              <span className="text-sm font-medium">{row.title}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs opacity-50">Placeholder schedule. Wire your real agenda from the dashboard.</p>
      </div>
    </section>
  )
}

function SpeakersSection({ palette }: { palette: Palette }) {
  const placeholder = ['MR', 'JK', 'AL', 'TS', 'Nø', 'PV']
  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title="Speakers" palette={palette} />
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {placeholder.map((initials, i) => (
            <li key={i} className="text-center">
              <span
                className="mx-auto grid size-20 place-items-center rounded-full text-lg font-semibold"
                style={{ background: i % 2 === 0 ? palette.primary : palette.accent, color: '#fff' }}
              >
                {initials}
              </span>
              <p className="mt-3 text-sm font-medium">Speaker {i + 1}</p>
              <p className="text-xs opacity-60">Role · Company</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function SponsorsSection({ palette }: { palette: Palette }) {
  const placeholder = ['NeoCloud', 'Hexabyte', 'Kernel Labs', 'Quantum IO', 'Devhouse', 'Northwind']
  return (
    <section className="px-6 py-16 sm:py-20" style={{ background: 'rgb(0 0 0 / 0.03)' }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeader title="Sponsors" palette={palette} />
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {placeholder.map((name) => (
            <li key={name} className="rounded-xl border border-current/10 bg-current/5 px-4 py-6 text-center text-sm font-semibold tracking-tight opacity-80">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function RegisterSection({ event, palette }: { event: ApiEvent; palette: Palette }) {
  return (
    <section id="register" className="px-6 py-16 sm:py-20">
      <RegisterForm
        eventId={event.id}
        palette={{ primary: palette.primary, accent: palette.accent }}
        maxParticipants={event.maxParticipants}
      />
    </section>
  )
}

function NotLive() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="max-w-md">
        <span
          className="mx-auto grid size-12 place-items-center rounded-2xl text-white shadow-md"
          style={{ background: 'var(--grad-brand)' }}
        >
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
            <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
          </svg>
        </span>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">This event isn&apos;t live yet</h1>
        <p className="mt-3 text-sm text-muted">
          The page you&apos;re looking for hasn&apos;t been published, or doesn&apos;t exist.
          Check the link with the organizer.
        </p>
        <Link href="/" className="btn btn-primary mt-7">Back to Eventra</Link>
      </div>
    </main>
  )
}

function LocationSection({ event, palette }: { event: ApiEvent; palette: Palette }) {
  return (
    <section id="location" className="px-6 py-16 sm:py-20" style={{ background: 'rgb(0 0 0 / 0.03)' }}>
      <div className="mx-auto max-w-3xl">
        <SectionHeader title="Location" palette={palette} />
        <div className="mt-6 rounded-2xl border border-current/10 bg-current/5 p-6">
          <p className="text-lg font-semibold">{event.venue ?? 'Venue to be announced'}</p>
          <p className="mt-1 text-sm opacity-70">
            {[event.city, event.country].filter(Boolean).join(', ') || 'Location TBA'}
          </p>
        </div>
      </div>
    </section>
  )
}

function FaqSection({ palette }: { palette: Palette }) {
  const placeholder = [
    { q: 'Will sessions be recorded?', a: 'Yes — recordings are shared with attendees after the event.' },
    { q: 'Can I get a refund?', a: 'Refunds are available up to two weeks before the event start date.' },
    { q: 'Is there a code of conduct?', a: 'Yes. Be excellent to each other. The full text is on the registration page.' },
  ]
  return (
    <section className="px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <SectionHeader title="FAQ" palette={palette} />
        <dl className="mt-8 space-y-4">
          {placeholder.map((item) => (
            <div key={item.q} className="rounded-xl border border-current/10 bg-current/5 p-5">
              <dt className="text-sm font-semibold">{item.q}</dt>
              <dd className="mt-2 text-sm opacity-80">{item.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function SectionHeader({ title, subtitle, palette }: { title: string; subtitle?: string; palette: Palette }) {
  return (
    <div>
      <span
        className="inline-block rounded-full px-3 py-1 text-[0.7rem] font-medium uppercase tracking-widest"
        style={{ background: palette.primary, color: '#fff' }}
      >
        {title}
      </span>
      {subtitle && <p className="mt-3 text-sm opacity-60">{subtitle}</p>}
    </div>
  )
}

function isDarkSurface(hex: string): boolean {
  const m = hex.replace('#', '').match(/.{1,2}/g)
  if (!m || m.length < 3) return false
  const [r, g, b] = m.slice(0, 3).map((x) => parseInt(x, 16))
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luma < 0.5
}

function formatRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString(undefined, opts)
  }
  return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, opts)}`
}
