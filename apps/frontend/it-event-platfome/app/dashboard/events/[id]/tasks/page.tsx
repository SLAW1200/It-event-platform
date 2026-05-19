import { redirect } from 'next/navigation'
import { apiFetch, getSession, type ApiEvent, type Kanban } from '../../../../lib/api'
import { EventConsoleNav } from '../../../_components/console-nav'
import { CreateTaskForm, TaskCard, COLUMNS } from './task-widgets'

export const dynamic = 'force-dynamic'

const EMPTY: Kanban = { todo: [], in_progress: [], review: [], done: [] }

export default async function TasksPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const eventId = Number(id)
  if (!Number.isFinite(eventId)) redirect('/dashboard')

  const [evtRes, kanbanRes] = await Promise.all([
    apiFetch<ApiEvent>(`/api/v1/events/${eventId}`),
    apiFetch<Kanban>(`/api/v1/tasks/event/${eventId}/kanban`),
  ])
  const eventName = evtRes.ok ? evtRes.data.name : `Event #${eventId}`
  const board = kanbanRes.ok ? { ...EMPTY, ...kanbanRes.data } : EMPTY
  const total = COLUMNS.reduce((n, c) => n + (board[c.key as keyof Kanban]?.length ?? 0), 0)

  return (
    <main className="min-h-dvh">
      <EventConsoleNav eventId={eventId} eventName={eventName} active="tasks" />

      <section className="container-page py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ops tasks</h1>
            <p className="mt-2 text-sm text-muted">{total} task{total === 1 ? '' : 's'} on the board</p>
          </div>
        </div>

        <div className="mt-6">
          <CreateTaskForm eventId={eventId} />
        </div>

        {!kanbanRes.ok && (
          <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {kanbanRes.error}
          </p>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = board[col.key as keyof Kanban] ?? []
            return (
              <div key={col.key} className="rounded-[var(--radius-lg)] border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between px-1 pb-3">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="text-xs text-faint">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border-2 px-3 py-6 text-center text-xs text-faint">
                      Nothing here
                    </p>
                  ) : (
                    items.map((t) => <TaskCard key={t.id} eventId={eventId} task={t} />)
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}
