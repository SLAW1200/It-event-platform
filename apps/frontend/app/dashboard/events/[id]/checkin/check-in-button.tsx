'use client'

// One row's manual check-in button. Bound to its registration id so the
// parent table can render N independent buttons that each only trigger
// their own row's check-in.
import { useActionState } from 'react'
import { manualCheckInAction, type CheckInState } from './actions'

export function CheckInButton({
  eventId,
  registrationId,
}: {
  eventId: number
  registrationId: number
}) {
  const bound = manualCheckInAction.bind(null, eventId, registrationId)
  const [state, action, pending] = useActionState<CheckInState, FormData>(bound, undefined)

  return (
    <form action={action} className="contents">
      <button
        type="submit"
        disabled={pending || state?.ok}
        className="btn btn-outline h-8 px-3 text-xs"
      >
        {pending ? 'Checking in…' : state?.ok ? 'Checked in ✓' : 'Check in'}
      </button>
      {state?.message && !state.ok && (
        <span role="alert" className="text-xs text-danger">{state.message}</span>
      )}
    </form>
  )
}
