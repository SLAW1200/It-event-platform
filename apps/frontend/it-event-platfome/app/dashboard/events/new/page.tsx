'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { createEventAction, type CreateEventState } from './actions'

export default function NewEventPage() {
  const [state, action, pending] = useActionState<CreateEventState, FormData>(
    createEventAction,
    undefined,
  )
  const values = state?.values

  return (
    <main className="min-h-dvh">
      <header className="border-b border-border">
        <div className="container-page flex h-16 items-center gap-4">
          <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">← Dashboard</Link>
        </div>
      </header>

      <section className="container-page py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">Create event</h1>
          <p className="mt-2 text-sm text-muted">
            Fill in the basics. You&apos;ll pick a template and customize it next.
          </p>

          <form action={action} className="card mt-8 p-6 sm:p-8">
            <Field
              label="Event name"
              name="name"
              type="text"
              defaultValue={values?.name}
              error={state?.errors?.name}
              required
            />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Start date"
                name="startDate"
                type="datetime-local"
                defaultValue={values?.startDate}
                error={state?.errors?.startDate}
                required
              />
              <Field
                label="End date"
                name="endDate"
                type="datetime-local"
                defaultValue={values?.endDate}
                error={state?.errors?.endDate}
                required
              />
            </div>
            <div className="mt-4">
              <Field
                label="Venue"
                name="venue"
                type="text"
                defaultValue={values?.venue}
                placeholder="e.g. Berlin Congress Center"
                hint="Optional"
              />
            </div>
            <div className="mt-4">
              <Field
                label="Max participants"
                name="maxParticipants"
                type="number"
                defaultValue={values?.maxParticipants}
                error={state?.errors?.maxParticipants}
                placeholder="e.g. 250"
                hint="Optional"
              />
            </div>

            {state?.message && (
              <p role="alert" className="mt-5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {state.message}
              </p>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
              <Link href="/dashboard" className="btn btn-ghost">Cancel</Link>
              <button type="submit" disabled={pending} className="btn btn-primary">
                {pending ? 'Creating…' : 'Create & pick template'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

function Field({
  label, name, type, defaultValue, error, required, placeholder, hint,
}: {
  label: string; name: string; type: string;
  defaultValue?: string; error?: string; required?: boolean;
  placeholder?: string; hint?: string;
}) {
  const id = `f-${name}`
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error) || undefined}
        className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground transition placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  )
}
