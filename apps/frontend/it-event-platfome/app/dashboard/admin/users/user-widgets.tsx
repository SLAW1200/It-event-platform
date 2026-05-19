'use client'

import { useActionState } from 'react'
import { setRoleAction, toggleActiveAction, type AdminState } from './actions'

const ROLES = ['super_admin', 'admin', 'organizer', 'staff', 'participant']

export function RoleSelect({
  userId,
  role,
}: {
  userId: number
  role: string
}) {
  const bound = setRoleAction.bind(null, userId)
  const [state, action, pending] = useActionState<AdminState, FormData>(bound, undefined)
  return (
    <form action={action} className="contents">
      <select
        name="role"
        defaultValue={role}
        disabled={pending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-border bg-surface px-2 py-1 text-xs capitalize focus:border-brand focus:outline-none disabled:opacity-50"
        aria-label="Change role"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r.replace('_', ' ')}</option>
        ))}
      </select>
      {state?.message && !state.ok && (
        <span role="alert" className="ml-1 text-xs text-danger">{state.message}</span>
      )}
    </form>
  )
}

export function ActiveToggle({
  userId,
  active,
}: {
  userId: number
  active: boolean
}) {
  const bound = toggleActiveAction.bind(null, userId, !active)
  const [state, action, pending] = useActionState<AdminState, FormData>(bound, undefined)
  return (
    <form action={action} className="contents">
      <button
        type="submit"
        disabled={pending}
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
          active
            ? 'bg-success/10 text-success hover:bg-danger/10 hover:text-danger'
            : 'bg-surface-3 text-muted hover:bg-success/10 hover:text-success'
        }`}
        title={active ? 'Click to deactivate' : 'Click to activate'}
      >
        {pending ? '…' : active ? 'Active' : 'Inactive'}
      </button>
      {state?.message && !state.ok && (
        <span role="alert" className="ml-1 text-xs text-danger">{state.message}</span>
      )}
    </form>
  )
}
