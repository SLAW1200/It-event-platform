'use client'

// Client widgets for the support inbox: per-ticket action buttons (resolve
// / close / escalate) and the new-ticket form. Each op-button binds its
// ticket id + op so the parent table can render a row of independent forms.
import { useActionState } from 'react'
import {
  ticketOpAction, createTicketAction,
  type SupportState, type CreateTicketState,
} from './actions'

function OpButton({
  ticketId, op, label, variant,
}: {
  ticketId: number
  op: 'resolve' | 'close' | 'escalate'
  label: string
  variant: string
}) {
  const bound = ticketOpAction.bind(null, ticketId, op)
  const [state, action, pending] = useActionState<SupportState, FormData>(bound, undefined)
  return (
    <form action={action} className="contents">
      <button type="submit" disabled={pending || state?.ok} className={`btn ${variant} h-7 px-2.5 text-xs`}>
        {state?.ok ? 'Done ✓' : pending ? '…' : label}
      </button>
    </form>
  )
}

export function TicketActions({ ticketId, status }: { ticketId: number; status: string }) {
  const closed = status === 'closed' || status === 'resolved'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {!closed && <OpButton ticketId={ticketId} op="resolve" label="Resolve" variant="btn-outline" />}
      {!closed && <OpButton ticketId={ticketId} op="escalate" label="Escalate" variant="btn-ghost" />}
      <OpButton ticketId={ticketId} op="close" label="Close" variant="btn-ghost" />
    </div>
  )
}

export function CreateTicketForm() {
  const [state, action, pending] = useActionState<CreateTicketState, FormData>(
    createTicketAction,
    undefined,
  )
  return (
    <form action={action} className="card p-6">
      <h2 className="text-sm font-semibold">Log a ticket</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="tk-subject" className="text-sm font-medium">Subject</label>
          <input
            id="tk-subject"
            name="subject"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {state?.errors?.subject && <p className="mt-1 text-xs text-danger">{state.errors.subject}</p>}
        </div>
        <div>
          <label htmlFor="tk-desc" className="text-sm font-medium">Description</label>
          <textarea
            id="tk-desc"
            name="description"
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {state?.errors?.description && <p className="mt-1 text-xs text-danger">{state.errors.description}</p>}
        </div>
        <div>
          <label htmlFor="tk-priority" className="text-sm font-medium">Priority</label>
          <select
            id="tk-priority"
            name="priority"
            defaultValue="medium"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
      {state?.message && (
        <p className={`mt-4 text-sm ${state.ok ? 'text-success' : 'text-danger'}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full">
        {pending ? 'Creating…' : 'Create ticket'}
      </button>
    </form>
  )
}
