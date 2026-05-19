'use client'

import { useActionState } from 'react'
import { registerAttendeeAction, type RegisterState } from './actions'

type Palette = { primary: string; accent: string }

export function RegisterForm({
  eventId,
  palette,
  maxParticipants,
}: {
  eventId: number
  palette: Palette
  maxParticipants?: number
}) {
  const boundAction = registerAttendeeAction.bind(null, eventId)
  const [state, action, pending] = useActionState<RegisterState, FormData>(
    boundAction,
    undefined,
  )

  if (state?.ok && state.confirmation) {
    const c = state.confirmation
    return (
      <div
        className="mx-auto max-w-md rounded-3xl px-8 py-10 text-center"
        style={{ background: palette.primary, color: '#fff' }}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-white/15">
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight">You&apos;re registered!</h2>
        <p className="mt-2 text-sm opacity-90">
          See you there, {c.name}. We&apos;ve emailed your ticket and event
          details to <span className="font-semibold">{c.email}</span>.
          {c.status === 'pending' && ' Payment instructions are included.'}
        </p>
        {c.qrCodeUrl && (
          <div className="mx-auto mt-6 w-fit rounded-2xl bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.qrCodeUrl} alt="Your check-in QR code" className="size-44" />
          </div>
        )}
        <p className="mt-5 text-xs opacity-70">
          Show this QR code at the door for instant check-in.
        </p>
      </div>
    )
  }

  return (
    <div
      className="mx-auto max-w-md rounded-3xl px-8 py-10"
      style={{ background: palette.primary, color: '#fff' }}
    >
      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Reserve your spot</h2>
        <p className="mt-2 text-sm opacity-90">
          {maxParticipants ? `Limited to ${maxParticipants} attendees.` : 'Spaces are limited.'}
        </p>
      </div>

      <form action={action} className="mt-7 space-y-3 text-left">
        <div className="grid grid-cols-2 gap-3">
          <Field name="firstName" label="First name" autoComplete="given-name" error={state?.errors?.firstName} defaultValue={state?.values?.firstName} />
          <Field name="lastName" label="Last name" autoComplete="family-name" error={state?.errors?.lastName} defaultValue={state?.values?.lastName} />
        </div>
        <Field name="email" label="Email" type="email" autoComplete="email" error={state?.errors?.email} defaultValue={state?.values?.email} />

        {state?.message && (
          <p role="alert" className="rounded-lg bg-white/15 px-3 py-2 text-sm">
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-1 w-full rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-0.5 disabled:opacity-60"
          style={{ background: palette.accent, color: '#fff' }}
        >
          {pending ? 'Registering…' : 'Register now'}
        </button>
      </form>
    </div>
  )
}

function Field({
  name, label, type = 'text', autoComplete, error, defaultValue,
}: {
  name: string
  label: string
  type?: string
  autoComplete?: string
  error?: string
  defaultValue?: string
}) {
  const id = `r-${name}`
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium opacity-80">{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required
        aria-invalid={Boolean(error) || undefined}
        className="mt-1 w-full rounded-lg border border-white/25 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-white/60 focus:bg-white/15 focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-white/80">{error}</p>}
    </div>
  )
}
