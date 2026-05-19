import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent, type ApiUser } from '../../../../lib/api'
import { EventConsoleNav } from '../../../_components/console-nav'

export const dynamic = 'force-dynamic'

export default async function NetworkingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const { q } = await searchParams
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) redirect('/dashboard')

  const query = (q ?? '').trim()
  const [evtRes, peopleRes] = await Promise.all([
    apiFetch<ApiEvent>(`/api/v1/events/${eventId}`),
    apiFetch<ApiUser[]>(
      `/api/v1/networking/events/${eventId}/participants${query ? `?q=${encodeURIComponent(query)}` : ''}`,
    ),
  ])
  const eventName = evtRes.ok ? evtRes.data.name : `Event #${eventId}`
  const people = peopleRes.ok ? peopleRes.data : []

  return (
    <main className="min-h-dvh">
      <EventConsoleNav eventId={eventId} eventName={eventName} active="networking" />

      <section className="container-page py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Attendee directory</h1>
        <p className="mt-2 text-sm text-muted">
          Searchable participant directory — the basis for matchmaking and 1:1 meetings.
        </p>

        <form method="get" className="mt-6 flex max-w-md gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name, company or role…"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button type="submit" className="btn btn-primary h-[42px] px-4 text-sm">Search</button>
        </form>

        {!peopleRes.ok ? (
          <p role="alert" className="mt-6 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {peopleRes.error}
          </p>
        ) : people.length === 0 ? (
          <p className="mt-10 text-sm text-muted">
            {query ? `No participants match “${query}”.` : 'No participants yet.'}
          </p>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {people.map((p) => {
              const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.email
              const initials = `${p.firstName?.[0] ?? ''}${p.lastName?.[0] ?? ''}`.toUpperCase() || '·'
              return (
                <li key={p.id} className="card card-hover flex items-start gap-3 p-5">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
                    style={{ background: 'var(--grad-brand)' }}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted">
                      {[p.jobTitle, p.company].filter(Boolean).join(' · ') || 'Attendee'}
                    </p>
                    <p className="mt-1 truncate text-xs text-faint">{p.email}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
