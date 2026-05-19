/**
 * Seeds a complete, demoable story against the running stack:
 *
 *   demo organizer  →  published "DevConf 2026" event (Tech Conference
 *   template, customized)  →  3 attendees registered with QR codes.
 *
 * Idempotent: re-running logs in the existing organizer instead of failing,
 * and skips attendees / publish steps that are already done.
 *
 * Usage:  npm run seed:demo        (stack must be up — see README)
 *         API_URL=http://host:3000 npm run seed:demo
 */

const API = process.env.API_URL ?? 'http://localhost:3000'

const ORGANIZER = {
  email: 'demo@eventra.dev',
  password: 'DemoPass123!',
  firstName: 'Dana',
  lastName: 'Organizer',
}

const ATTENDEES = [
  { email: 'maya@example.com', firstName: 'Maya', lastName: 'Rao' },
  { email: 'jonas@example.com', firstName: 'Jonas', lastName: 'Keller' },
  { email: 'amara@example.com', firstName: 'Amara', lastName: 'Lin' },
]

const TEMPLATE_ID = 'tech-conf'

async function api(path, { method = 'GET', token, body } = {}) {
  let res
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error(`Cannot reach the gateway at ${API}. Is the stack running?`)
  }
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    const err = new Error(msg || `HTTP ${res.status} on ${method} ${path}`)
    err.status = res.status
    throw err
  }
  return data
}

function datesFromNow(daysOut, durationDays) {
  const start = new Date(Date.now() + daysOut * 86400000)
  start.setHours(9, 0, 0, 0)
  const end = new Date(start.getTime() + durationDays * 86400000)
  end.setHours(18, 0, 0, 0)
  return { startDate: start.toISOString(), endDate: end.toISOString() }
}

async function getOrganizer() {
  try {
    const out = await api('/api/v1/auth/register', { method: 'POST', body: ORGANIZER })
    console.log(`✓ Registered organizer ${ORGANIZER.email}`)
    return out
  } catch (e) {
    if (e.status === 409 || /already/i.test(e.message)) {
      const out = await api('/api/v1/auth/login', {
        method: 'POST',
        body: { email: ORGANIZER.email, password: ORGANIZER.password },
      })
      console.log(`✓ Logged in existing organizer ${ORGANIZER.email}`)
      return out
    }
    throw e
  }
}

async function main() {
  console.log(`\nSeeding Eventra demo against ${API}\n`)

  const { accessToken, user } = await getOrganizer()
  const organizerId = user.id

  const { startDate, endDate } = datesFromNow(30, 2)
  const event = await api(`/api/v1/events?organizerId=${organizerId}`, {
    method: 'POST',
    token: accessToken,
    body: {
      name: 'DevConf 2026',
      description:
        'Three days of deep-dive talks, hands-on workshops and the best hallway track in tech. Built and run on Eventra.',
      startDate,
      endDate,
      venue: 'Berlin Congress Center',
      city: 'Berlin',
      country: 'Germany',
      maxParticipants: 2000,
    },
  })
  console.log(`✓ Created event #${event.id} "${event.name}"`)

  await api(`/api/v1/events/${event.id}`, {
    method: 'PUT',
    token: accessToken,
    body: {
      templateId: TEMPLATE_ID,
      configuration: {
        tagline: 'Where the people building the future get together.',
        enabledSections: [
          'hero', 'about', 'speakers', 'schedule', 'sponsors', 'location', 'register',
        ],
        paletteOverride: { primary: '#7c3aed', accent: '#06b6d4' },
      },
    },
  })
  console.log(`✓ Applied & customized "${TEMPLATE_ID}" template`)

  try {
    await api(`/api/v1/events/${event.id}/publish`, { method: 'PATCH', token: accessToken })
    console.log('✓ Published event')
  } catch (e) {
    if (/only draft/i.test(e.message)) console.log('• Event already published')
    else throw e
  }

  let registered = 0
  for (const a of ATTENDEES) {
    try {
      const { user: guest } = await api('/api/v1/auth/guest', { method: 'POST', body: a })
      await api('/api/v1/public/register', {
        method: 'POST',
        body: { eventId: event.id, userId: guest.id },
      })
      registered++
    } catch (e) {
      if (/already registered/i.test(e.message)) registered++
      else console.warn(`  ! ${a.email}: ${e.message}`)
    }
  }
  console.log(`✓ ${registered}/${ATTENDEES.length} demo attendees registered`)

  console.log('\n─────────────────────────────────────────────')
  console.log(' Demo ready. Walk the flow:')
  console.log(`  • Sign in:      http://localhost:3100/login`)
  console.log(`      email:      ${ORGANIZER.email}`)
  console.log(`      password:   ${ORGANIZER.password}`)
  console.log(`  • Dashboard:    http://localhost:3100/dashboard`)
  console.log(`  • Public page:  http://localhost:3100/e/${event.id}`)
  console.log('')
  console.log('  Confirmation emails (dev transport, no SMTP needed) are')
  console.log('  written to apps/email-service/.maildev/*.html — open one')
  console.log('  in a browser to see an attendee ticket + QR.')
  console.log('─────────────────────────────────────────────\n')
}

main().catch((e) => {
  console.error(`\n✗ Seed failed: ${e.message}\n`)
  process.exit(1)
})
