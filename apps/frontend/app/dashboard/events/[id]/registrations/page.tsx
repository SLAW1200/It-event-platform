// Per-event registrations list — shows the status-breakdown stats tile
// plus the full registration table (status, amount paid, signup date,
// user name/email). Read-only; check-in actions live on the check-in tab.
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  apiFetch, getSession,
  type ApiEvent, type RegistrationStats, type ApiRegistration,
} from '../../../../lib/api'
import { EventConsoleNav } from '../../../_components/console-nav'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, string> = {
  confirmed: 'bg-success/10 text-success',
  checked_in: 'bg-brand-soft text-brand',
  pending: 'bg-warning/10 text-warning',
  waitlisted: 'bg-surface-3 text-muted',
  cancelled: 'bg-danger/10 text-danger',
}

function label(status: string) {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) redirect('/dashboard')

  const [evtRes, statsRes, listRes] = await Promise.all([
    apiFetch<ApiEvent>(`/api/v1/events/${eventId}`),
    apiFetch<RegistrationStats>(`/api/v1/registrations/event/${eventId}/stats`),
    apiFetch<ApiRegistration[]>(`/api/v1/registrations/event/${eventId}`),
  ])

  if (!evtRes.ok) {
    return (
      <main className="container-page py-16">
        <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {evtRes.error}
        </p>
        <Link href="/dashboard" className="btn btn-ghost mt-4">← Back</Link>
      </main>
    )
  }

  const event = evtRes.data
  const stats = statsRes.ok ? statsRes.data : { total: 0, byStatus: {} as RegistrationStats['byStatus'] }
  const list = listRes.ok ? listRes.data : []
  const by = stats.byStatus ?? {}
  const cap = event.maxParticipants
  const pct = cap ? Math.min(100, Math.round((stats.total / cap) * 100)) : null

  const tiles: { key: string; label: string; value: number }[] = [
    { key: 'total', label: 'Total', value: stats.total },
    { key: 'confirmed', label: 'Confirmed', value: by.confirmed ?? 0 },
    { key: 'checked_in', label: 'Checked in', value: by.checked_in ?? 0 },
    { key: 'pending', label: 'Pending', value: by.pending ?? 0 },
    { key: 'cancelled', label: 'Cancelled', value: by.cancelled ?? 0 },
  ]

  return (
    <main className="min-h-dvh">
      <EventConsoleNav eventId={eventId} eventName={event.name} active="registrations" />

      <section className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Registrations</h1>
            <p className="mt-2 text-sm text-muted">
              {stats.total === 0
                ? 'No one has registered yet.'
                : `${stats.total} ${stats.total === 1 ? 'person has' : 'people have'} registered.`}
            </p>
          </div>
          {!statsRes.ok && (
            <p className="text-xs text-danger">Couldn&apos;t load live stats — showing what we have.</p>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <div key={t.key} className="card p-5">
              <p className="text-[0.7rem] uppercase tracking-wide text-faint">{t.label}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{t.value}</p>
            </div>
          ))}
        </div>

        {pct != null && (
          <div className="card mt-4 p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Capacity</span>
              <span className="text-muted">
                {stats.total} / {cap} · {pct}% full
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--grad-brand)' }} />
            </div>
          </div>
        )}

        <div className="card mt-8 overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">Attendees</h2>
          </div>
          {list.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">
              Registrations will appear here as people sign up on the public page.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => {
                    const name = `${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || '—'
                    const st = String(r.status ?? '').toLowerCase()
                    return (
                      <tr key={r.id} className="border-b border-border last:border-0">
                        <td className="px-5 py-3 font-medium">{name}</td>
                        <td className="px-5 py-3 text-muted">{r.user?.email ?? '—'}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[st] ?? 'bg-surface-3 text-muted'}`}>
                            {label(st)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted">
                          {new Date(r.registrationDate).toLocaleDateString(undefined, {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
