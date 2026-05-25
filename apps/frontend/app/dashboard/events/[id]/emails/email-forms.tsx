'use client'

// Client widgets for the email console: the "create campaign" form and the
// per-campaign "Send" button. Both bind their server action to the event
// (and campaign) id so the same component can be rendered in a list.
import { useActionState } from 'react'
import { createCampaignAction, sendCampaignAction, type EmailState } from './actions'

export function CreateCampaignForm({ eventId }: { eventId: number }) {
  const bound = createCampaignAction.bind(null, eventId)
  const [state, action, pending] = useActionState<EmailState, FormData>(bound, undefined)

  return (
    <form action={action} className="card p-6">
      <h2 className="text-sm font-semibold">New campaign</h2>
      <div className="mt-4 space-y-3">
        <Field name="name" label="Internal name" error={state?.errors?.name} placeholder="Week-of reminder" />
        <Field name="subject" label="Subject" error={state?.errors?.subject} placeholder="See you at the event!" />
        <div>
          <label htmlFor="c-content" className="text-sm font-medium">Body</label>
          <textarea
            id="c-content"
            name="content"
            rows={5}
            placeholder="Write your message…"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {state?.errors?.content && <p className="mt-1 text-xs text-danger">{state.errors.content}</p>}
        </div>
      </div>
      {state?.message && (
        <p className={`mt-4 text-sm ${state.ok ? 'text-success' : 'text-danger'}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full">
        {pending ? 'Creating…' : 'Create campaign'}
      </button>
    </form>
  )
}

export function SendButton({ eventId, campaignId }: { eventId: number; campaignId: number }) {
  const bound = sendCampaignAction.bind(null, eventId, campaignId)
  const [state, action, pending] = useActionState<EmailState, FormData>(bound, undefined)

  return (
    <form action={action} className="flex items-center gap-2">
      <button type="submit" disabled={pending} className="btn btn-outline h-8 px-3 text-xs">
        {pending ? 'Sending…' : 'Send to registrants'}
      </button>
      {state?.message && (
        <span className={`text-xs ${state.ok ? 'text-success' : 'text-danger'}`}>{state.message}</span>
      )}
    </form>
  )
}

function Field({
  name, label, error, placeholder,
}: {
  name: string
  label: string
  error?: string
  placeholder?: string
}) {
  const id = `c-${name}`
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input
        id={id}
        name={name}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
