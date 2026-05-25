'use client'

// Interactive customiser — drag-to-toggle sections + colour pickers for the
// landing-page template. Stays purely client-side until submit, when it
// hands the assembled config to saveCustomizationAction.
import { useActionState, useEffect, useRef, useState } from 'react'
import type { SectionKey } from '../../../../lib/templates'
import { saveCustomizationAction, type CustomizeState } from './actions'

export function CustomizerForm({
  eventId,
  allSections,
  sectionLabels,
  initialTagline,
  initialPrimary,
  initialAccent,
  initialEnabledSections,
}: {
  eventId: number
  allSections: readonly SectionKey[]
  sectionLabels: Record<SectionKey, string>
  initialTagline: string
  initialPrimary: string
  initialAccent: string
  initialEnabledSections: readonly SectionKey[]
}) {
  const boundAction = saveCustomizationAction.bind(null, eventId)
  const [state, action, pending] = useActionState<CustomizeState, FormData>(boundAction, undefined)
  const prevStateRef = useRef(state)
  const [enabled, setEnabled] = useState<Set<SectionKey>>(new Set(initialEnabledSections))

  useEffect(() => {
    if (state !== prevStateRef.current && state?.ok) {
      const frame = document.getElementById('preview-frame') as HTMLIFrameElement | null
      if (frame) {
        const url = new URL(frame.src, window.location.origin)
        url.searchParams.set('_ts', String(Date.now()))
        frame.src = url.toString()
      }
    }
    prevStateRef.current = state
  }, [state])

  return (
    <form action={action} className="flex h-full flex-col">
      <div className="space-y-6 overflow-y-auto p-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">Content</h2>
          <div className="mt-3">
            <label htmlFor="tagline" className="text-sm font-medium">Tagline</label>
            <input
              id="tagline"
              name="tagline"
              defaultValue={initialTagline}
              maxLength={120}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <p className="mt-1.5 text-xs text-faint">Shown in the hero. Up to 120 characters.</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">Palette</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ColorField label="Primary" name="primary" defaultValue={initialPrimary} />
            <ColorField label="Accent" name="accent" defaultValue={initialAccent} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-faint">Sections</h2>
          <p className="mt-2 text-xs text-faint">Toggle which sections appear on the public page.</p>
          <ul className="mt-3 space-y-2">
            {allSections.map((s) => (
              <li key={s}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition hover:border-border-2">
                  <input
                    type="checkbox"
                    name={`section:${s}`}
                    checked={enabled.has(s)}
                    onChange={(e) => {
                      setEnabled((prev) => {
                        const next = new Set(prev)
                        if (e.target.checked) next.add(s)
                        else next.delete(s)
                        return next
                      })
                    }}
                    className="size-4 accent-[var(--brand)]"
                  />
                  <span className="text-sm font-medium">{sectionLabels[s]}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border bg-surface p-4">
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? 'Saving…' : 'Save & refresh preview'}
        </button>
        {state?.message && (
          <p
            role="status"
            className={`mt-3 text-center text-xs ${state.ok ? 'text-success' : 'text-danger'}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}

function ColorField({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)
  const id = `c-${name}`
  return (
    <div>
      <label htmlFor={id} className="text-xs font-medium text-muted">{label}</label>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label={`${label} color picker`}
        />
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={9}
          className="w-full bg-transparent text-sm font-mono uppercase tracking-wider focus:outline-none"
        />
      </div>
    </div>
  )
}
