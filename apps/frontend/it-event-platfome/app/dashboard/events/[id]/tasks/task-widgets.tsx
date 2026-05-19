'use client'

import { useActionState } from 'react'
import { createTaskAction, moveTaskAction, type TaskState } from './actions'
import type { ApiTask } from '../../../../lib/api'

const COLUMNS: { key: string; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

const PRIORITY_CLS: Record<string, string> = {
  low: 'text-faint',
  medium: 'text-muted',
  high: 'text-warning',
  urgent: 'text-danger',
}

export function CreateTaskForm({ eventId }: { eventId: number }) {
  const bound = createTaskAction.bind(null, eventId)
  const [state, action, pending] = useActionState<TaskState, FormData>(bound, undefined)

  return (
    <form action={action} className="card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-[200px] flex-1">
        <label htmlFor="t-title" className="text-xs font-medium text-muted">Task</label>
        <input
          id="t-title"
          name="title"
          placeholder="e.g. Confirm AV vendor"
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        {state?.errors?.title && <p className="mt-1 text-xs text-danger">{state.errors.title}</p>}
      </div>
      <div>
        <label htmlFor="t-priority" className="text-xs font-medium text-muted">Priority</label>
        <select
          id="t-priority"
          name="priority"
          defaultValue="medium"
          className="mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn btn-primary h-9 px-4 text-sm">
        {pending ? 'Adding…' : 'Add task'}
      </button>
      {state?.message && !state.ok && (
        <span role="alert" className="text-xs text-danger">{state.message}</span>
      )}
    </form>
  )
}

export function TaskCard({ eventId, task }: { eventId: number; task: ApiTask }) {
  const bound = moveTaskAction.bind(null, eventId, task.id)
  const [, action, pending] = useActionState<TaskState, FormData>(bound, undefined)
  const pr = String(task.priority ?? 'medium').toLowerCase()
  const who = task.assignedTo
    ? `${task.assignedTo.firstName ?? ''} ${task.assignedTo.lastName ?? ''}`.trim()
    : null

  return (
    <div className={`card p-3 text-sm ${pending ? 'opacity-50' : ''}`}>
      <p className="font-medium leading-snug">{task.title}</p>
      {task.description && <p className="mt-1 text-xs text-muted">{task.description}</p>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={`text-[0.7rem] font-medium uppercase tracking-wide ${PRIORITY_CLS[pr] ?? 'text-muted'}`}>
          {pr}
        </span>
        {who && <span className="truncate text-xs text-faint">{who}</span>}
      </div>
      <form action={action} className="mt-2">
        <select
          name="status"
          defaultValue={task.status}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="w-full rounded-md border border-border bg-surface-2 px-2 py-1 text-xs focus:border-brand focus:outline-none"
          aria-label="Move task"
        >
          {COLUMNS.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
      </form>
    </div>
  )
}

export { COLUMNS }
