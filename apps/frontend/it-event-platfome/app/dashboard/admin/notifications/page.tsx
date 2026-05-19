import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiNotification } from '../../../lib/api'
import { logoutAction } from '../../../lib/auth-actions'
import { NotifyForm } from './notify-form'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const logRes = await apiFetch<ApiNotification[]>('/api/v1/notifications/log')
  const log = logRes.ok ? [...logRes.data].reverse() : []

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">← Dashboard</Link>
            <span className="text-sm font-medium">Notifications</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin/users" className="text-sm text-muted hover:text-foreground">Users</Link>
            <Link href="/dashboard/support" className="text-sm text-muted hover:text-foreground">Support</Link>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost h-9 px-3.5 text-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <section className="container-page py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="mt-2 text-sm text-muted">Dispatch Slack / email / push notifications and review what was sent.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <NotifyForm />

          <div className="card overflow-hidden p-0">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold">Recent ({log.length})</h2>
            </div>
            {!logRes.ok ? (
              <p role="alert" className="px-5 py-8 text-center text-sm text-danger">{logRes.error}</p>
            ) : log.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted">Nothing sent yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {log.map((n, i) => (
                  <li key={i} className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[0.7rem] font-medium uppercase text-brand">
                        {n.type}
                      </span>
                      {n.title && <span className="text-sm font-semibold">{n.title}</span>}
                    </div>
                    <p className="mt-1 text-sm text-muted">{n.message}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
