import Link from 'next/link'

type Tab =
  | 'analytics' | 'registrations' | 'checkin'
  | 'emails' | 'tasks' | 'forms' | 'networking'

const TABS: { key: Tab; label: string; seg: string }[] = [
  { key: 'analytics', label: 'Analytics', seg: 'analytics' },
  { key: 'registrations', label: 'Registrations', seg: 'registrations' },
  { key: 'forms', label: 'Forms', seg: 'forms' },
  { key: 'checkin', label: 'Check-in', seg: 'checkin' },
  { key: 'emails', label: 'Emails', seg: 'emails' },
  { key: 'tasks', label: 'Tasks', seg: 'tasks' },
  { key: 'networking', label: 'Networking', seg: 'networking' },
]

/** Shared header + sub-nav for every per-event console page. */
export function EventConsoleNav({
  eventId,
  eventName,
  active,
}: {
  eventId: number
  eventName: string
  active: Tab
}) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" className="shrink-0 text-sm text-muted hover:text-foreground">
            ← Dashboard
          </Link>
          <span className="truncate text-sm font-medium">{eventName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={`/dashboard/events/${eventId}/customize`}
            className="hidden text-xs text-muted hover:text-foreground sm:inline"
          >
            Customize
          </Link>
          <Link
            href={`/e/${eventId}`}
            target="_blank"
            className="text-xs text-brand hover:underline"
          >
            Public page ↗
          </Link>
        </div>
      </div>
      <nav className="container-page flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const isActive = t.key === active
          return (
            <Link
              key={t.key}
              href={`/dashboard/events/${eventId}/${t.seg}`}
              className={`-mb-px whitespace-nowrap border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-brand text-foreground'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
