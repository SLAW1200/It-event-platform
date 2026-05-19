'use client'

import { useActionState } from 'react'
import { sendNotificationAction, type NotifyState } from './actions'

export function NotifyForm() {
  const [state, action, pending] = useActionState<NotifyState, FormData>(
    sendNotificationAction,
    undefined,
  )
  return (
    <form action={action} className="card p-6">
      <h2 className="text-sm font-semibold">Send a notification</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="n-type" className="text-sm font-medium">Channel</label>
          <select
            id="n-type"
            name="type"
            defaultValue="slack"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm capitalize focus:border-brand focus:outline-none"
          >
            <option value="slack">Slack</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
          </select>
        </div>
        <div>
          <label htmlFor="n-title" className="text-sm font-medium">Title</label>
          <input
            id="n-title"
            name="title"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
        <div>
          <label htmlFor="n-msg" className="text-sm font-medium">Message</label>
          <textarea
            id="n-msg"
            name="message"
            rows={4}
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>
      {state?.message && (
        <p className={`mt-4 text-sm ${state.ok ? 'text-success' : 'text-danger'}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full">
        {pending ? 'Sending…' : 'Send'}
      </button>
      <p className="mt-3 text-xs text-faint">
        Slack delivery needs SLACK_BOT_TOKEN; without it, the notification is logged below.
      </p>
    </form>
  )
}
