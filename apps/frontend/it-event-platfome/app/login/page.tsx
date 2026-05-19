'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction, type AuthState } from '../lib/auth-actions'

export default function LoginPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    loginAction,
    undefined,
  )
  const values = state?.values

  return (
    <main className="relative isolate min-h-dvh overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="bg-grid mask-radial-top absolute inset-0 opacity-60" />
        <div
          className="animate-pulse-glow absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--glow), transparent 60%)' }}
        />
      </div>

      <div className="container-page flex min-h-dvh items-center justify-center py-14">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
              <span
                className="grid size-8 place-items-center rounded-[0.6rem] text-white shadow-md"
                style={{ background: 'var(--grad-brand)' }}
              >
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
                  <path d="M13.5 2 4 14h6.2L9 22l9.5-12H12.3L13.5 2Z" />
                </svg>
              </span>
              <span className="text-[1.05rem]">Eventra</span>
            </Link>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-sm text-muted">
              New here?{' '}
              <Link href="/register" className="font-medium text-brand hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <form action={action} className="card p-6 sm:p-7">
            <div className="space-y-4">
              <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={values?.email}
                error={state?.errors?.email}
                required
              />
              <Field
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                error={state?.errors?.password}
                required
              />
            </div>

            {state?.message && (
              <p
                role="alert"
                aria-live="polite"
                className="mt-5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {state.message}
              </p>
            )}

            <button type="submit" disabled={pending} className="btn btn-primary btn-lg mt-6 w-full">
              {pending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

function Field({
  label,
  name,
  type,
  autoComplete,
  defaultValue,
  error,
  required,
}: {
  label: string
  name: string
  type: string
  autoComplete?: string
  defaultValue?: string
  error?: string
  required?: boolean
}) {
  const id = `field-${name}`
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground transition placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
      />
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
