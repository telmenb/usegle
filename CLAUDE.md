# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Usegle is a Mongolian-language Wordle clone. Players guess a daily 5-letter Mongolian word. The answer changes each day and is pre-scheduled in Redis by an admin.

## Repo layout

```
backend/   — Express + TypeScript API (Node ≥ 18), deployed on Railway
frontend/  — SvelteKit 5 + Tailwind CSS app, deployed on Vercel
```

## Commands

### Backend (`cd backend`)
```bash
npm run dev        # nodemon watch mode (ts-node)
npm run build      # tsc compile to dist/
npm run start      # run compiled dist/index.js
```

### Frontend (`cd frontend`)
```bash
npm run dev        # Vite dev server
npm run build      # SvelteKit build
npm run check      # svelte-check type checking
npm run lint       # prettier + eslint
npm run format     # prettier --write
npm run test       # vitest (single run)
npm run test:unit  # vitest (watch)
```

## Environment variables

**Backend** (copy `backend/.example.env` → `backend/.env`):
- `PORT` — server port (default 3000)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD` — Redis connection
- `PUBLIC_USEGLE_FRONTEND_HOSTS` — comma-separated allowed CORS origins in production
- `ADMIN_API_KEY` — secret key required for all `/api/admin/*` requests (sent as `x-admin-key` header)

**Frontend** (copy `frontend/.example.env` → `frontend/.env`):
- `PUBLIC_USEGLE_API_HOST` — backend base URL (e.g. `http://localhost:9000`)

## Architecture

### How a game round works

1. **Server load** (`frontend/src/routes/+page.server.ts`): on every page load, the SvelteKit server calls `GET /api/game/init` to fetch `wordLength` for today. If Redis has no word for today, it returns `wordLength: -1` and the frontend shows an error state.
2. **Client game loop** (`frontend/src/routes/App.svelte`): the main game component manages board state, keyboard state, and guess submission. Game state (board, current row, key colors) is persisted to `localStorage` keyed by the current UTC date so progress survives page reloads.
3. **Guess checking** (`backend/src/routes/game.ts`): `POST /api/game/checkGuess` validates the guess exists in the official Mongolian dictionary API (`toli.gov.mn/auto`) via `backend/src/services/dictionary-service.ts`, then scores the guess against today's cached answer. Scoring returns an array of `1` (correct position), `0` (wrong position), `-1` (not in word).
4. **Word of the day**: stored in Redis as `YYYY-MM-DD → word`. The backend caches today's answer in memory, refreshed every 60 seconds via `ensureTodaysWord()`. The word bank (valid guesses) is loaded from `backend/data/mongolian_words_5_letters.txt` at startup.

### Word scheduling (admin API)

Admins schedule future words via `POST /api/admin/words` with `{ words: string[], startDate?: string }`. Words are written to Redis as date-keyed entries. All admin routes require the `x-admin-key` header matching `ADMIN_API_KEY`.

### Frontend state management

- Uses Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`)
- Theme (dark/light mode) is shared via Svelte context (`'theme'`) initialized in `+layout.svelte`
- `StateColor` enum drives cell and keyboard key colors: `INACTIVE`, `ACTIVE`, `CORRECT`, `PARTIAL`, `INCORRECT`
- `frontend/src/lib/index.ts` exports board initialization, key layout (Mongolian Cyrillic), and storage helpers
- `frontend/src/lib/storageHelper.ts` wraps `localStorage` with safe SSR guards

### Dictionary validation

Word validity is checked against the external `toli.gov.mn` API with an in-memory cache (`dictionaryCache` Map). The local word bank (`mongolian_words_5_letters.txt`) is used only for the wordBank endpoint, not for guess validation.
