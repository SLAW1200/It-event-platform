'use client'

import { useActionState } from 'react'
import { publishEventAction, type PublishState } from './actions'

export function PublishButton({ eventId }: { eventId: number }) {
  const boundAction = publishEventAction.bind(null, eventId)
  const [state, action, pending] = useActionState<PublishState, FormData>(
    boundAction,
    undefined,
  )

  return (
    <form action={action} className="contents">
      <button
        type="submit"
        disabled={pending || state?.ok}
        className="btn btn-primary h-8 px-3 text-xs"
      >
        {pending ? 'Publishing…' : state?.ok ? 'Published ✓' : 'Publish'}
      </button>
      {state?.message && !state.ok && (
        <span role="alert" className="text-xs text-danger">{state.message}</span>
      )}
    </form>
  )
}
