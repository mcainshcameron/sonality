# Sonality

A local-first personal web app for understanding the people in your life: record dated
behaviour observations, tag each with **Big Five** and **MBTI** trait evidence, and read a
deterministic, evidence-weighted profile per person. You are the analyst — there is no AI
inference; every score is computed from the evidence you tag.

All data lives in your browser (IndexedDB). Nothing leaves your device except an explicit
JSON export. No accounts, no backend, no telemetry.

## Stack

React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS · Dexie/IndexedDB · Zod · Recharts ·
Vitest + React Testing Library · Playwright (+ axe)

The architecture is layered (`docs/02-technical-design.md §1`): a pure, UI-independent
`src/domain` core (types, Zod schemas, `computeProfile`), a `src/data` repository layer over
Dexie, and a `src/ui` React layer that consumes both.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Quality gates

```bash
npm run lint       # ESLint (flat config)
npm run build      # tsc -b + vite build
npm test           # Vitest unit + component
npm run coverage   # domain-layer coverage (gate ≥95% lines)
npm run e2e        # Playwright e2e across Chromium + Firefox (axe, journeys, offline)
```

## Documentation

Full requirements, design, tasks, test strategy, and traceability live in [`docs/`](./docs).
Start with [`docs/00-overview-and-decisions.md`](./docs/00-overview-and-decisions.md).
