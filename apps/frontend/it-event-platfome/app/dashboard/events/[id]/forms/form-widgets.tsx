'use client'

import { useActionState } from 'react'
import { createFormFieldAction, deleteFormFieldAction, type FormState } from './actions'
import { FORM_FIELD_TYPES } from '../../../../lib/form-fields'

export function CreateFieldForm({ eventId }: { eventId: number }) {
  const bound = createFormFieldAction.bind(null, eventId)
  const [state, action, pending] = useActionState<FormState, FormData>(bound, undefined)

  return (
    <form action={action} className="card p-6">
      <h2 className="text-sm font-semibold">Add a field</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="f-label" className="text-sm font-medium">Label</label>
          <input
            id="f-label"
            name="label"
            placeholder="T-shirt size"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {state?.errors?.label && <p className="mt-1 text-xs text-danger">{state.errors.label}</p>}
        </div>
        <div>
          <label htmlFor="f-name" className="text-sm font-medium">Field key</label>
          <input
            id="f-name"
            name="fieldName"
            placeholder="tshirt_size"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {state?.errors?.fieldName && <p className="mt-1 text-xs text-danger">{state.errors.fieldName}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="f-type" className="text-sm font-medium">Type</label>
            <select
              id="f-type"
              name="fieldType"
              defaultValue="text"
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm capitalize focus:border-brand focus:outline-none"
            >
              {FORM_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <label className="mt-7 flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" name="required" className="size-4 accent-[var(--brand)]" />
            Required
          </label>
        </div>
        <div>
          <label htmlFor="f-opts" className="text-sm font-medium">Options</label>
          <input
            id="f-opts"
            name="options"
            placeholder="S, M, L, XL (for select / radio)"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <p className="mt-1 text-xs text-faint">Comma-separated; only used by select / multiselect / radio.</p>
        </div>
        <div>
          <label htmlFor="f-ph" className="text-sm font-medium">Placeholder</label>
          <input
            id="f-ph"
            name="placeholder"
            className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      </div>
      {state?.message && (
        <p className={`mt-4 text-sm ${state.ok ? 'text-success' : 'text-danger'}`}>{state.message}</p>
      )}
      <button type="submit" disabled={pending} className="btn btn-primary mt-5 w-full">
        {pending ? 'Adding…' : 'Add field'}
      </button>
    </form>
  )
}

export function DeleteFieldButton({ eventId, fieldId }: { eventId: number; fieldId: number }) {
  const bound = deleteFormFieldAction.bind(null, eventId, fieldId)
  const [state, action, pending] = useActionState<FormState, FormData>(bound, undefined)
  return (
    <form action={action} className="contents">
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-muted transition-colors hover:text-danger"
        aria-label="Delete field"
      >
        {pending ? '…' : 'Remove'}
      </button>
      {state?.message && !state.ok && (
        <span role="alert" className="text-xs text-danger">{state.message}</span>
      )}
    </form>
  )
}
