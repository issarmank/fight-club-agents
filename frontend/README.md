# Fight Club Agents — Frontend

A redesigned Next.js frontend for the Fight Club Agents simulation: an editorial
landing page with a WebGL arena hero, and a live dashboard wired **straight to
the backend WebSocket** (no mock data, no fallback simulation).

- **Stack:** Next.js 15 App Router · React 19 · TypeScript · Tailwind ·
  react-three-fiber (hero) · Zustand (live WS store) · plain `<canvas>` (arena)
- **Theme:** warm white primary with orange / burnt / brown / sand secondaries;
  Instrument Serif + Instrument Sans + JetBrains Mono.

## File map

```
frontend/
├─ app/
│  ├─ layout.tsx            # fonts (next/font) + metadata
│  ├─ globals.css           # design tokens + landing styles
│  ├─ page.tsx              # landing page (assembles the sections)
│  └─ game/
│     ├─ page.tsx           # live arena dashboard (opens the socket)
│     └─ game.css           # dashboard styles
├─ components/
│  ├─ landing/              # Nav, Hero, HeroArena (r3f), Ticker, WhatItDoes,
│  │                        # Personalities, HowItWorks, AccessCTA, Details,
│  │                        # Faq, Footer, Reveal
│  └─ game/                 # TopBar, Arena (canvas), Inspector, EventFeed,
│                           # Leaderboard
└─ lib/
   ├─ types.ts              # WS message + Agent/Resource types (mirror backend)
   ├─ agents.ts             # personality metadata + action color-coding
   └─ useGameStore.ts       # Zustand store + live WebSocket connection
```

## Setup

These files assume a standard Next.js App Router project. To drop them into a
fresh app:

```bash
npx create-next-app@latest fight-club-agents --ts --tailwind --app --eslint
cd fight-club-agents
# copy the contents of this `frontend/` folder over the generated app/, plus
# the new components/ and lib/ folders and tailwind.config.ts
npm install three @react-three/fiber zustand
cp .env.example .env.local
npm run dev
```

The `@/` import alias resolves to the project root (the default
`create-next-app` `tsconfig.json` already sets `"@/*": ["./*"]`).

### Tailwind v4 note

`globals.css` uses the v3 directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

If your project is on Tailwind v4, replace those three lines with:

```css
@import "tailwindcss";
```

Everything else is plain CSS + CSS variables, so it works on either version.
`tailwind.config.ts` is only needed for v3 (and is harmless on v4).

## Connecting to the backend

The dashboard connects on mount via `useGameSocket()` in `app/game/page.tsx`.
It reads the URL from `NEXT_PUBLIC_WS_URL` (default `ws://localhost:8000/ws`).

Start the backend, then the frontend:

```bash
# backend/
uvicorn main:app --reload          # serves ws://localhost:8000/ws

# frontend/
npm run dev                        # http://localhost:3000  →  /game
```

The store (`lib/useGameStore.ts`) handles the full backend protocol:

- on connect the server sends a `GAME_STATE` snapshot;
- a `GAME_STATE` is broadcast every 0.5 s tick (agents, resources, grid);
- `EVENT` messages (`event_type: "COLLISION"`) carry `thought_process`,
  `spoken_dialogue`, `action`, and `emotional_state`.

It auto-reconnects with exponential backoff (0.5→8 s) and sends a keepalive
ping every 20 s, so a backend restart reconnects on its own. Connection state
is surfaced in the top bar ("Live Arena" / "Connecting…" / "Offline") and as an
overlay on the arena until the first snapshot arrives.

> CORS: `backend/main.py` currently allows `http://localhost:3000`. Add your
> deployed frontend origin there for production, and use `wss://` for the URL.

## Notes

- The landing hero (`HeroArena.tsx`) is decorative and self-contained — it does
  **not** open a socket. Only `/game` connects.
- The arena renders on a `requestAnimationFrame` loop reading the latest
  snapshot from the store, interpolating agent positions between the 2 Hz ticks
  so motion stays smooth. Panels (inspector / feed / leaderboard) subscribe to
  store slices and re-render per tick.
- Agent display names are shortened from the backend `name` (e.g. "The Greedy
  Merchant" → "Greedy Merchant") via `shortName()`.
