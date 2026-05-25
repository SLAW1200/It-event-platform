// Organiser dashboard home — lists the current user's events. force-dynamic
// because caching across users would leak data.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent, type RegistrationStats } from '../lib/api'
import { getTemplate } from '../lib/templates'
import { logoutAction } from '../lib/auth-actions'
import { PublishButton } from './publish-button'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const result = await apiFetch<ApiEvent[]>(`/api/v1/events/organizer/${session.sub}`)
  const events = result.ok ? result.data : []
  const apiError = result.ok ? null : result.error

  // Registration totals per event (best-effort — a failed stats call just
  // hides the count for that card, it never breaks the dashboard).
  const statsList = await Promise.all(
    events.map((e) =>
      apiFetch<RegistrationStats>(`/api/v1/registrations/event/${e.id}/stats`),
    ),
  )
  const registeredById = new Map<number, number>()
  events.forEach((e, i) => {
    const s = statsList[i]
    if (s.ok) registeredById.set(e.id, s.data.total ?? 0)
  })

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-[0.6rem] text-white shadow-md" style={{ background: 'var(--grad-brand)' }}>
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
                <path d="M13.5 2 4 14h6.2L9 22l9.5-12H12.3L13.5 2Z" />
              </svg>
            </span>
            <span>Eventra</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin/users" className="text-sm text-muted hover:text-foreground">
              Admin
            </Link>
            <Link href="/dashboard/support" className="text-sm text-muted hover:text-foreground">
              Support
            </Link>
            <span className="hidden text-sm text-muted sm:inline">{session.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost h-9 px-3.5 text-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <section className="container-page py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your events</h1>
            <p className="mt-2 text-sm text-muted">
              {events.length === 0 ? 'Create your first event to get started.' : `${events.length} event${events.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link href="/dashboard/events/new" className="btn btn-primary">
            Create event
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {apiError && (
          <p role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {apiError}
          </p>
        )}

        {events.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((evt) => (
              <EventCard key={evt.id} event={evt} registered={registeredById.get(evt.id)} />
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-[var(--radius-lg)] border border-dashed border-border-2 bg-surface-2 p-10 text-center">
      <p className="text-sm text-muted">No events yet.</p>
      <Link href="/dashboard/events/new" className="btn btn-primary btn-lg mt-5">
        Create your first event
      </Link>
    </div>
  )
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'text-faint' },
  published: { label: 'Published', cls: 'text-success' },
  ongoing: { label: 'Live', cls: 'text-success' },
  completed: { label: 'Completed', cls: 'text-muted' },
  cancelled: { label: 'Cancelled', cls: 'text-danger' },
}

function EventCard({ event, registered }: { event: ApiEvent; registered?: number }) {
  const template = getTemplate(event.templateId)
  const start = new Date(event.startDate)
  const dateStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  const status = String(event.status ?? '').toLowerCase()
  const badge = STATUS_STYLE[status] ?? { label: event.status, cls: 'text-faint' }
  const isDraft = status === 'draft'
  const isLive = status === 'published' || status === 'ongoing'
  const cap = event.maxParticipants
  const pct = cap && registered != null ? Math.min(100, Math.round((registered / cap) * 100)) : null

  return (
    <li className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{event.name}</h3>
          <p className="mt-1 text-xs text-muted">
            {dateStr} {event.venue ? `· ${event.venue}` : ''}
          </p>
        </div>
        <span className={`shrink-0 text-[0.7rem] font-medium uppercase tracking-wide ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {template ? (
          <span className="pill text-xs">
            <span className="inline-block size-2 rounded-full" style={{ background: template.palette.primary }} />
            {template.name}
          </span>
        ) : (
          <Link href={`/dashboard/events/${event.id}/template`} className="pill text-xs text-brand hover:underline">
            Pick a template
          </Link>
        )}
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <svg viewBox="0 0 24 24" className="size-4 text-brand" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
              <path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.9M16.5 14.6a5.5 5.5 0 0 1 4 5.4" />
            </svg>
            {registered != null ? registered : '—'}
            <span className="font-normal text-muted">
              {registered === 1 ? 'registration' : 'registrations'}
              {cap ? ` · cap ${cap}` : ''}
            </span>
          </span>
          {pct != null && <span className="text-xs text-faint">{pct}% full</span>}
        </div>
        {pct != null && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, background: 'var(--grad-brand)' }}
            />
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
        <Link href={`/dashboard/events/${event.id}/registrations`} className="btn btn-outline h-8 px-3 text-xs">
          Registrations
        </Link>
        {template && (
          <Link href={`/dashboard/events/${event.id}/customize`} className="btn btn-ghost h-8 px-3 text-xs">
            Customize
          </Link>
        )}
        <Link href={`/dashboard/events/${event.id}/template`} className="btn btn-ghost h-8 px-3 text-xs">
          {template ? 'Change template' : 'Pick template'}
        </Link>
        {isDraft && template && <PublishButton eventId={event.id} />}
        {isLive ? (
          <Link href={`/e/${event.id}`} target="_blank" className="btn btn-ghost h-8 px-3 text-xs">
            View public page ↗
          </Link>
        ) : (
          <Link href={`/e/${event.id}`} target="_blank" className="btn btn-ghost h-8 px-3 text-xs">
            Preview
          </Link>
        )}
      </div>
    </li>
  )
}
