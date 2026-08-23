# Muziclly Global — Phase 1

A faithful reconstruction of the original **Muziclly Global** public website, rebuilt from
recovered crawl data (see [`Recovered Data/`](./Recovered%20Data)) after the original
deployment was lost. This is **Phase 1**: the public marketing site, auth pages, and the
`/studio` (Muziclly Studio ecosystem) page.

Not in Phase 1 (recovered evidence shows these exist but are out of scope — see
[`Recovered Data/`](./Recovered%20Data) for what was captured): the logged-in dashboards
(`/admin`, `/student`, `/teacher`), the M-Series tools under `/mlab`, and M-Studio (the DAW
inside M-Lab). Those are Phase 2.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **CSS Modules** — every component's styles were extracted verbatim from the recovered
  production stylesheets (hash suffixes stripped, values otherwise untouched)
- **Firebase** (Auth + Firestore) — the site's original client config, recovered from the
  production bundle, wired into sign in / sign up / password reset / Forum Hub submissions
- Self-hosted **Outfit** + **Italianno** fonts (recovered `.woff` files, via `next/font/local`)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/                 route segments (one per recovered page)
  components/          shared UI: Navbar, Footer, Button, Section, Hero, Reviews, ...
  context/AuthContext.tsx   Firebase auth provider (login/signup/social/reset)
  lib/firebase.ts      Firebase client init
  fonts.ts             next/font/local declarations
public/                logo, gallery photos, and other static assets recovered as-is
```

## Provenance

Every page, component, and design token here traces back to specific files under
`Recovered Data/` — mainly the `SiteOne-Crawler` capture, which was the most complete and
authoritative of the five recovery sources (a live crawl vs. the others' offline/wayback
snapshots). Where the compiled JS bundles contained readable source for a component's exact
logic (Navbar, Button, AuthProvider, the Assessment/Forum Hub/Studio pages, etc.), that logic
was ported directly rather than re-implemented from guesswork. Comments in the code point back
to the specific recovered chunk file a component or value came from.

A few known, deliberate simplifications from the original:
- Scroll-triggered reveal animations (IntersectionObserver fade-ins on Reviews, Approach, etc.)
  are omitted; content renders in its final visible state.
- Course sub-pages linked from the Courses dropdown (Keyboard Piano, Guitar, Bollywood Singing,
  More) return 404 — they returned 404 on the original site too (confirmed via the crawl log),
  so this is faithful rather than a gap.
