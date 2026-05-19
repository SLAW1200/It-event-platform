import { redirect } from 'next/navigation'
import {
  apiFetch, getSession,
  type ApiEvent, type EventAttendance, type ApiRegistration,
} from '../../../../lib/api'
import { EventConsoleNav } from '../../../_components/console-nav'
import { CheckInButton } from './check-in-button'

export const dynamic = 'force-dynamic'

export default async function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) redirect('/dashboard')

  const [evtRes, attRes, listRes] = await Promise.all([
    apiFetch<ApiEvent>(`/api/v1/events/${eventId}`),
    apiFetch<EventAttendance>(`/api/v1/checkin/event/${eventId}/attendance`),
    apiFetch<ApiRegistration[]>(`/api/v1/registrations/event/${eventId}`),
  ])

  const eventName = evtRes.ok ? evtRes.data.name : `Event #${eventId}`
  const att = attRes.ok ? attRes.data : null
  const list = listRes.ok ? listRes.data : []
  const pending = list.filter((r) => String(r.status).toLowerCase() !== 'checked_in')

  return (
    <main className="min-h-dvh">
      <EventConsoleNav eventId={eventId} eventName={eventName} active="checkin" />

      <section className="container-page py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Check-in</h1>
        <p className="mt-2 text-sm text-muted">
          Mark attendees in manually, or scan their QR at the door.
        </p>

        {!attRes.ok ? (
          <p role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {attRes.error}
          </p>
        ) : att ? (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Registered" value={att.totalRegistrations} />
            <Tile label="Checked in" value={att.checkedIn} />
            <Tile label="Not in yet" value={att.notCheckedIn} />
            <Tile label="Attendance" value={`${att.attendanceRate}%`} />
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="card overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Not checked in</h2>
              <span className="text-xs text-faint">{pending.length}</span>
            </div>
            {pending.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">Everyone&apos;s in. 🎉</p>
            ) : (
              <ul className="divide-y divide-border">
                {pending.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {`${r.user?.firstName ?? ''} ${r.user?.lastName ?? ''}`.trim() || '—'}
                      </p>
                      <p className="truncate text-xs text-muted">{r.user?.email ?? '—'}</p>
                    </div>
                    <CheckInButton eventId={eventId} registrationId={r.id} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card overflow-hidden p-0">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Recent check-ins</h2>
            </div>
            {!att || att.recentCheckIns.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No check-ins yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {att.recentCheckIns.map((c) => {
                  const u = c.registration?.user
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {`${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.email || '—'}
                        </p>
                        <p className="text-xs text-faint">{c.checkInMethod ?? 'manual'}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">
                        {new Date(c.checkInTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <p className="text-[0.7rem] uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
