/* ============================================================================
   Eventra — landing page
   "Eventra" is a placeholder product name; rename freely.
   Pure server component: all motion is CSS-driven (see app/globals.css).
   ========================================================================== */

import Link from "next/link";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Workflow", href: "#workflow" },
  { label: "Customers", href: "#customers" },
  { label: "Pricing", href: "#cta" },
];

const FEATURES = [
  {
    title: "Registration & ticketing",
    desc: "No-code form builder, tiered tickets, promo codes and rules-based pricing — with instant, on-brand confirmations.",
    Icon: TicketIcon,
  },
  {
    title: "Fast check-in & badges",
    desc: "QR check-in that keeps working offline, on-site badge printing and a live arrivals board for your crew.",
    Icon: QrIcon,
  },
  {
    title: "Attendee networking",
    desc: "Smart matchmaking, rich profiles, in-app messaging and 1:1 meeting scheduling so your community actually connects.",
    Icon: UsersIcon,
  },
  {
    title: "Email campaigns",
    desc: "Segment your audience, design beautiful emails and automate the reminder sequences that fill the room.",
    Icon: MailIcon,
  },
  {
    title: "Real-time analytics",
    desc: "Registrations, revenue, attendance and session engagement on one live dashboard you can share with sponsors.",
    Icon: ChartIcon,
  },
  {
    title: "Support desk & ops tasks",
    desc: "Ticketed attendee support plus an operations board, so nothing slips before, during or after the event.",
    Icon: LifebuoyIcon,
  },
];

const STATS = [
  { value: "120K+", label: "Attendees checked in" },
  { value: "98.7%", label: "Check-ins under 5 seconds" },
  { value: "4.9/5", label: "Average organizer rating" },
  { value: "30+", label: "Native integrations" },
];

const STEPS = [
  {
    title: "Build your event",
    desc: "Spin up an event page, design the registration flow and set ticket tiers in minutes — no developers required.",
  },
  {
    title: "Fill the room",
    desc: "Launch email campaigns, open attendee networking and watch sign-ups roll in on a live dashboard.",
  },
  {
    title: "Run it flawlessly",
    desc: "Check attendees in at the door, print badges, track sessions and handle support — all from one place.",
  },
];

const MARQUEE = [
  "NeoCloud",
  "Hexabyte",
  "Kernel Labs",
  "Quantum IO",
  "Devhouse",
  "Northwind",
  "Pixel & Sync",
  "Loopstack",
  "BitForge",
  "Aurora Systems",
  "Stackline",
  "Cobalt",
];

const FOOTER_COLUMNS = [
  { title: "Product", links: ["Features", "Integrations", "Changelog", "Roadmap", "Status"] },
  { title: "Solutions", links: ["Conferences", "Meetups", "Hackathons", "Summits", "Workshops"] },
  { title: "Resources", links: ["Docs", "API reference", "Help center", "Community", "Blog"] },
  { title: "Company", links: ["About", "Careers", "Customers", "Contact", "Press kit"] },
];

/* --------------------------------- page ---------------------------------- */

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <LogoMarquee />
        <Features />
        <StatsBand />
        <Workflow />
        <CtaSection />
      </main>
      <SiteFooter />
    </>
  );
}

/* -------------------------------- header --------------------------------- */

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="glass-strong border-x-0 border-t-0">
        <nav className="container-page flex h-16 items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <Logo />
            <span className="text-[1.05rem]">Eventra</span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost hidden h-9 px-3.5 text-sm sm:inline-flex">
              Sign in
            </Link>
            <Link href="/register" className="btn btn-primary h-9 px-4 text-sm">
              Get started
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

/* --------------------------------- hero ---------------------------------- */

function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="bg-grid mask-radial-top absolute inset-0 opacity-60" />
        <div
          className="animate-pulse-glow absolute -top-48 left-1/2 size-[44rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--glow), transparent 60%)" }}
        />
        <div
          className="animate-float-slow absolute -left-40 top-24 size-[34rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--accent) 50%, transparent), transparent 65%)" }}
        />
        <div
          className="animate-float absolute -right-40 top-44 size-[32rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--pink) 45%, transparent), transparent 65%)" }}
        />
      </div>

      <div className="container-page grid items-center gap-14 py-20 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:py-28">
        <div className="max-w-2xl">
          <a href="#features" className="pill animate-fade-up">
            <SparkIcon />
            <span>Eventra 3.0 — meet the new live analytics</span>
            <ArrowRightIcon className="size-3" />
          </a>

          <h1 className="anim-delay-75 mt-6 animate-fade-up text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.75rem]">
            Run <span className="text-gradient animate-gradient">unforgettable</span> IT events — from first registration to standing ovation.
          </h1>

          <p className="anim-delay-150 mt-6 max-w-xl animate-fade-up text-lg leading-8 text-muted">
            Eventra brings registration, fast check-in, attendee networking, email campaigns and real-time analytics into one platform — so your team ships great events instead of juggling tools.
          </p>

          <div className="anim-delay-200 mt-8 flex flex-wrap items-center gap-3 animate-fade-up">
            <Link href="/register" className="btn btn-primary btn-lg">
              Start free
              <ArrowRightIcon />
            </Link>
            <a href="#workflow" className="btn btn-outline btn-lg">
              <PlayIcon />
              See how it works
            </a>
          </div>

          <ul className="anim-delay-300 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 animate-fade-up text-sm text-muted">
            <li className="flex items-center gap-2">
              <CheckIcon /> No credit card
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon /> Free up to 100 attendees
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon /> Set up in minutes
            </li>
          </ul>
        </div>

        <div className="anim-delay-200 relative animate-fade-up">
          <HeroMock />
        </div>
      </div>
    </section>
  );
}

function HeroMock() {
  const bars = [38, 52, 44, 66, 58, 80, 72];
  const tiles = [
    { k: "Registered", v: "4,820", d: "+312 today", up: true },
    { k: "Checked in", v: "3,114", d: "65% arrived" },
    { k: "Sessions", v: "42", d: "8 live now" },
  ];
  const avatars = [
    { i: "MR", c: "#7c3aed" },
    { i: "JK", c: "#db2777" },
    { i: "AL", c: "#06b6d4" },
    { i: "TS", c: "#2563eb" },
    { i: "Nø", c: "#0891b2" },
  ];

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none">
      <div aria-hidden className="bg-aurora absolute -inset-6 -z-10 rounded-[2.25rem] blur-2xl" />

      <div className="card card-spotlight card-hover animate-float overflow-hidden p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid size-9 place-items-center rounded-xl text-white shadow-md"
              style={{ background: "var(--grad-brand)" }}
            >
              <CalendarIcon />
            </span>
            <div>
              <p className="text-sm font-semibold leading-tight">DevConf 2026</p>
              <p className="text-xs text-faint">Berlin · Mar 14–16</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {tiles.map((t) => (
            <div key={t.k} className="rounded-xl border border-border bg-surface-2 p-3">
              <p className="text-[0.7rem] uppercase tracking-wide text-faint">{t.k}</p>
              <p className="mt-1 text-lg font-semibold leading-none">{t.v}</p>
              <p className={`mt-1.5 text-[0.7rem] ${t.up ? "text-success" : "text-faint"}`}>{t.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Registrations · last 7 days</p>
            <p className="text-xs font-medium text-success">▲ 28%</p>
          </div>
          <div className="mt-3 flex h-24 items-end gap-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 animate-fade-up rounded-md"
                style={{
                  height: `${h}%`,
                  animationDelay: `${320 + i * 70}ms`,
                  background: i >= 5 ? "var(--grad-brand)" : "color-mix(in oklab, var(--brand) 26%, var(--surface-3))",
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center -space-x-2">
            {avatars.map((a) => (
              <span
                key={a.i}
                className="grid size-7 place-items-center rounded-full text-[0.62rem] font-semibold text-white ring-2 ring-surface"
                style={{ background: a.c }}
              >
                {a.i}
              </span>
            ))}
            <span className="grid size-7 place-items-center rounded-full bg-surface-3 text-[0.6rem] font-semibold text-muted ring-2 ring-surface">
              2k+
            </span>
          </div>
          <span className="text-xs text-faint">attending</span>
        </div>
      </div>

      <div className="absolute -left-6 bottom-12 hidden w-56 animate-float-slow lg:block">
        <div className="glass-strong rounded-xl p-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-7 place-items-center rounded-full text-[0.66rem] font-semibold text-white"
              style={{ background: "var(--grad-brand)" }}
            >
              MR
            </span>
            <div className="text-xs leading-tight">
              <p className="font-medium">New registration</p>
              <p className="text-faint">Maya R. · VIP ticket</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-5 -top-5 hidden animate-float lg:block">
        <div className="inline-flex items-center gap-2 rounded-full border border-border-2 bg-surface px-3 py-1.5 text-xs font-medium shadow-md">
          <BoltIcon className="size-3.5 text-brand" />
          Check-in 2.1s avg
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- marquee --------------------------------- */

function LogoMarquee() {
  return (
    <section id="customers" className="overflow-x-clip border-y border-border bg-background-2 py-10">
      <div className="container-page">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-faint">
          Trusted by teams running the events you actually want to attend
        </p>
        <div className="mask-fade-x relative mt-7 overflow-hidden">
          <div className="flex w-max animate-marquee items-center">
            {[...MARQUEE, ...MARQUEE].map((name, i) => (
              <span
                key={`${name}-${i}`}
                aria-hidden={i >= MARQUEE.length}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap pr-12 text-lg font-semibold tracking-tight text-faint transition-colors hover:text-foreground"
              >
                <span className="grid size-6 place-items-center rounded-md border border-border-2 text-[0.6rem]">◆</span>
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- features -------------------------------- */

function Features() {
  return (
    <section id="features" className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="pill mx-auto">
          <LayersIcon />
          One platform · every stage
        </span>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything it takes to run a great event — <span className="text-gradient">in one place</span>
        </h2>
        <p className="mt-4 text-lg text-muted">
          Stop stitching together six tools and a spreadsheet. Eventra covers the whole journey, from the first registration to the post-event report.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <article
            key={f.title}
            className="card card-hover card-spotlight group animate-fade-up p-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex size-12 items-center justify-center rounded-xl border border-border-2 bg-surface-2 text-brand transition-colors group-hover:border-brand group-hover:bg-brand-soft">
              <f.Icon />
            </div>
            <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{f.desc}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Learn more
              <ArrowRightIcon className="size-3.5" />
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ stats band ------------------------------- */

function StatsBand() {
  return (
    <section className="container-page py-8">
      <div
        className="relative overflow-hidden rounded-[var(--radius-xl)] px-6 py-12 text-white sm:px-12 sm:py-16"
        style={{ background: "var(--grad-brand)" }}
      >
        <div aria-hidden className="absolute -right-16 -top-24 size-64 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-10 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4 lg:text-left">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-semibold tracking-tight sm:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm text-white/75">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- workflow -------------------------------- */

function Workflow() {
  return (
    <section id="workflow" className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <span className="pill mx-auto">
          <RouteIcon />
          How it works
        </span>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          From idea to &ldquo;that was incredible&rdquo; in three moves
        </h2>
        <p className="mt-4 text-lg text-muted">
          No migrations, no implementation project. Most teams send their first invite the same afternoon.
        </p>
      </div>

      <ol className="mt-14 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <li
            key={s.title}
            className="card card-hover relative animate-fade-up overflow-hidden p-6"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-2 -top-6 text-[5.5rem] font-bold leading-none text-foreground/[0.045]"
            >
              {i + 1}
            </span>
            <span
              className="grid size-10 place-items-center rounded-full text-sm font-semibold text-white"
              style={{ background: "var(--grad-brand)" }}
            >
              {i + 1}
            </span>
            <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{s.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* --------------------------------- cta ----------------------------------- */

function CtaSection() {
  return (
    <section id="cta" className="container-page py-16 sm:py-24">
      <div
        className="relative isolate overflow-hidden rounded-[var(--radius-xl)] px-6 py-14 text-center text-white sm:px-12 sm:py-20"
        style={{ background: "var(--grad-brand)" }}
      >
        <div aria-hidden className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(255 255 255 / 0.6) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.6) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000, transparent)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, #000, transparent)",
            }}
          />
          <div className="absolute left-1/2 top-0 size-72 -translate-x-1/2 rounded-full bg-white/20 blur-3xl" />
        </div>

        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Ready to run your best event yet?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/80">
          Create your first event free — no card required. Bring your team, your brand and your big ideas.
        </p>

        <form action="/register" method="get" className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="you@company.com"
            aria-label="Work email"
            className="w-full rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm text-white backdrop-blur-sm transition placeholder:text-white/60 focus:border-white/60 focus:bg-white/15 focus:outline-none"
          />
          <button
            type="submit"
            className="btn btn-lg shrink-0 bg-white text-[#5b21b6] hover:-translate-y-0.5 hover:shadow-xl"
          >
            Get started
            <ArrowRightIcon />
          </button>
        </form>
        <p className="mt-4 text-xs text-white/70">Join 4,000+ organizers · cancel anytime</p>
      </div>
    </section>
  );
}

/* -------------------------------- footer --------------------------------- */

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background-2">
      <div className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <a href="#" className="flex items-center gap-2.5 font-semibold tracking-tight">
              <Logo />
              <span className="text-[1.05rem]">Eventra</span>
            </a>
            <p className="mt-4 text-sm leading-6 text-muted">
              The all-in-one platform for IT events — registration, check-in, networking, campaigns and analytics, minus the chaos.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border-2 bg-surface px-3 py-1.5 text-xs text-muted">
              <span className="size-1.5 rounded-full bg-success" />
              All systems operational
            </span>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider my-10" />

        <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Eventra. Crafted for unforgettable events.</p>
          <div className="flex items-center gap-2">
            <a
              href="#"
              aria-label="GitHub"
              className="grid size-9 place-items-center rounded-full border border-border-2 text-muted transition-colors hover:border-brand hover:text-foreground"
            >
              <GitHubIcon />
            </a>
            <a
              href="#"
              aria-label="X"
              className="grid size-9 place-items-center rounded-full border border-border-2 text-muted transition-colors hover:border-brand hover:text-foreground"
            >
              <XIcon />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="grid size-9 place-items-center rounded-full border border-border-2 text-muted transition-colors hover:border-brand hover:text-foreground"
            >
              <LinkedInIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------- logo ---------------------------------- */

function Logo() {
  return (
    <span
      className="grid size-8 place-items-center rounded-[0.6rem] text-white shadow-md"
      style={{ background: "var(--grad-brand)" }}
    >
      <BoltIcon className="size-[18px]" />
    </span>
  );
}

/* --------------------------------- icons --------------------------------- */
/* Minimal inline icons — no extra dependencies. */

type IconProps = { className?: string };

function stroke(className = "size-5") {
  return {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}

function ArrowRightIcon({ className = "size-4" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function PlayIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.78-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

function CheckIcon({ className = "size-4 text-success" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function SparkIcon({ className = "size-3.5 text-brand" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2c.4 2.6 1.2 4 2.4 5.2C15.6 8.4 17 9.2 19.6 9.6 17 10 15.6 10.8 14.4 12 13.2 13.2 12.4 14.6 12 17.2c-.4-2.6-1.2-4-2.4-5.2C8.4 10.8 7 10 4.4 9.6 7 9.2 8.4 8.4 9.6 7.2 10.8 6 11.6 4.6 12 2Z" />
      <path d="M19 13c.2 1.2.6 1.9 1.2 2.5.6.6 1.3 1 2.5 1.2-1.2.2-1.9.6-2.5 1.2-.6.6-1 1.3-1.2 2.5-.2-1.2-.6-1.9-1.2-2.5-.6-.6-1.3-1-2.5-1.2 1.2-.2 1.9-.6 2.5-1.2.6-.6 1-1.3 1.2-2.5Z" />
    </svg>
  );
}

function BoltIcon({ className = "size-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13.5 2 4 14h6.2L9 22l9.5-12H12.3L13.5 2Z" />
    </svg>
  );
}

function CalendarIcon({ className = "size-[18px]" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </svg>
  );
}

function TicketIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v1a2.5 2.5 0 0 0 0 5v1a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 15.5v-1a2.5 2.5 0 0 0 0-5v-1Z" />
      <path d="M14 6.5v11" strokeDasharray="1.5 3" />
    </svg>
  );
}

function QrIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <path d="M14 14h3.5v3.5M21 21v-3.5M17.5 21H21M14 21h.01" />
    </svg>
  );
}

function UsersIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.9M16.5 14.6a5.5 5.5 0 0 1 4 5.4" />
    </svg>
  );
}

function MailIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function ChartIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="M4 4v15a1 1 0 0 0 1 1h15" />
      <path d="M7.5 14.5 11 11l3 2.5 5-6" />
      <path d="M19 7.5h-2.6M19 7.5v2.6" />
    </svg>
  );
}

function LifebuoyIcon({ className = "size-5" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="m6 6 3.4 3.4M14.6 14.6 18 18M18 6l-3.4 3.4M9.4 14.6 6 18" />
    </svg>
  );
}

function LayersIcon({ className = "size-3.5 text-brand" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12.5 9 5 9-5M3 17l9 5 9-5" />
    </svg>
  );
}

function RouteIcon({ className = "size-3.5 text-brand" }: IconProps) {
  return (
    <svg {...stroke(className)}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H14a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h5.5" />
    </svg>
  );
}

function GitHubIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function XIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M18.9 1.15h3.68l-8.05 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93Zm-1.3 19.49h2.04L6.49 3.24H4.3l13.3 17.4Z" />
    </svg>
  );
}

function LinkedInIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5.001 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21h-4V9Z" />
    </svg>
  );
}
