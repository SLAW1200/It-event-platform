import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiTicket, type TicketStats } from '../../lib/api'
import { logoutAction } from '../../lib/auth-actions'
import { TicketActions, CreateTicketForm } from './support-widgets'

export const dynamic = 'force-dynamic'

const TICKET_BADGE: Record<string, string> = {
  open: 'bg-warning/10 text-warning',
  in_progress: 'bg-brand-soft text-brand',
  resolved: 'bg-success/10 text-success',
  closed: 'bg-surface-3 text-muted',
}
const PRIORITY_BADGE: Record<string, string> = {
  low: 'text-faint',
  medium: 'text-muted',
  high: 'text-warning',
  critical: 'text-danger',
}

export default async function SupportPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [statsRes, listRes] = await Promise.all([
    apiFetch<TicketStats>('/api/v1/tickets/stats'),
    apiFetch<ApiTicket[]>('/api/v1/tickets'),
  ])
  const stats = statsRes.ok ? statsRes.data : { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 }
  const tickets = listRes.ok ? listRes.data : []

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">← Dashboard</Link>
            <span className="text-sm font-medium">Support desk</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">{session.email}</span>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost h-9 px-3.5 text-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <section className="container-page py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Support tickets</h1>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Tile label="Total" value={stats.total} />
          <Tile label="Open" value={stats.open} />
          <Tile label="In progress" value={stats.inProgress} />
          <Tile label="Resolved" value={stats.resolved} />
          <Tile label="Closed" value={stats.closed} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <CreateTicketForm />

          <div className="card overflow-hidden p-0">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">All tickets</h2>
            </div>
            {!listRes.ok ? (
              <p role="alert" className="px-5 py-8 text-center text-sm text-danger">{listRes.error}</p>
            ) : tickets.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">No tickets yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {tickets.map((t) => {
                  const st = String(t.status ?? '').toLowerCase()
                  const pr = String(t.priority ?? '').toLowerCase()
                  const who = t.user
                    ? `${t.user.firstName ?? ''} ${t.user.lastName ?? ''}`.trim() || t.user.email
                    : '—'
                  return (
                    <li key={t.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            #{t.id} · {t.subject}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t.description}</p>
                          <p className="mt-1 text-xs text-faint">
                            {who} · {new Date(t.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TICKET_BADGE[st] ?? 'bg-surface-3 text-muted'}`}>
                            {st.replace('_', ' ') || 'open'}
                          </span>
                          <span className={`text-[0.7rem] font-medium uppercase ${PRIORITY_BADGE[pr] ?? 'text-muted'}`}>
                            {pr}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <TicketActions ticketId={t.id} status={st} />
                      </div>
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

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-5">
      <p className="text-[0.7rem] uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}
