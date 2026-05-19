import Link from 'next/link'
import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiUser, type Paginated } from '../../../lib/api'
import { logoutAction } from '../../../lib/auth-actions'
import { RoleSelect, ActiveToggle } from './user-widgets'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [usersRes, rolesRes] = await Promise.all([
    apiFetch<Paginated<ApiUser>>('/api/v1/users?limit=100'),
    apiFetch<Record<string, number>>('/api/v1/users/stats/by-role'),
  ])
  const users = usersRes.ok ? usersRes.data.data : []
  const total = usersRes.ok ? usersRes.data.total : 0
  const byRole = rolesRes.ok ? rolesRes.data : {}

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">← Dashboard</Link>
            <span className="text-sm font-medium">Back office</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin/notifications" className="text-sm text-muted hover:text-foreground">
              Notifications
            </Link>
            <Link href="/dashboard/support" className="text-sm text-muted hover:text-foreground">Support</Link>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-ghost h-9 px-3.5 text-sm">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <section className="container-page py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Users &amp; roles</h1>
        <p className="mt-2 text-sm text-muted">{total} user{total === 1 ? '' : 's'} · manage access</p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {['super_admin', 'admin', 'organizer', 'staff', 'participant'].map((r) => (
            <div key={r} className="card p-5">
              <p className="text-[0.7rem] uppercase tracking-wide text-faint">{r.replace('_', ' ')}</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{byRole[r] ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="card mt-8 overflow-hidden p-0">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold">All users</h2>
          </div>
          {!usersRes.ok ? (
            <p role="alert" className="px-5 py-8 text-center text-sm text-danger">{usersRes.error}</p>
          ) : users.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Role</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">
                        {`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—'}
                      </td>
                      <td className="px-5 py-3 text-muted">{u.email}</td>
                      <td className="px-5 py-3 text-muted">{u.company || '—'}</td>
                      <td className="px-5 py-3"><RoleSelect userId={u.id} role={u.role} /></td>
                      <td className="px-5 py-3"><ActiveToggle userId={u.id} active={u.active} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
