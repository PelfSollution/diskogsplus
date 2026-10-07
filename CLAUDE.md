# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Architecture overview and roadmap (Spanish): @docs/README.md

## Commands

- `npm run dev` / `npm run build` / `npm run lint` (`eslint .` with flat config `eslint.config.mjs` — Next 16 removed `next lint`)
- `.npmrc` sets `ignore-scripts=true` and `save-exact=true` (supply-chain protection). Ask before installing any package; prefer versions published at least 1–2 weeks ago, review the `package-lock.json` diff and run `npm audit signatures` afterwards.
- Type-check with `npx tsc --noEmit`. There are no tests and no CI — type-check + lint is the verification step.

## Conventions

- Write code comments, UI strings, error messages and commit messages in **Spanish**, matching the existing code. Some data fields are Spanish too (`artista`, `trackname`, `disco_id`) — keep those names.
- Commit directly to `main` (solo project, no PR flow).
- Tailwind v3 with `prefix: 'tw-'` (`tailwind.config.js`): every utility must be prefixed — `tw-flex`, `dark:tw-text-white`, `hover:tw-bg-...`. Unprefixed classes silently do nothing. Dark mode is class-based.
- Styling is Tailwind + shadcn (`components/ui/`, `@/lib/utils`). MUI/Emotion are still in package.json but no longer used — don't add new MUI code.
- Path alias `@/*` → repo root.

## Architecture gotchas

- Mixed routers: everything lives in the Pages Router (`pages/`, `pages/api/`) **except** the DiscBOT streaming chat at `app/api/chat/route.ts` (App Router, `ai` package `OpenAIStream`).
- Auth is custom Discogs OAuth 1.0a via `disconnect` (no next-auth). Session lives in cookies (`username`, `isLoggedIn`, plus AES-encrypted httpOnly `usernameCipher` / `accessData`, keyed by `CRYPT_KEY`).
- `pages/api/auth/devLogin.ts` is a dev-only bypass (403 in production) that sets mock Discogs tokens — real Discogs API calls fail under it. The normal local setup is the full stack (real Discogs OAuth + Supabase in `.env.local`).
- AI calls use the OpenAI SDK pointed at either Gemini or OpenAI. `lib/aiClient.ts` (`getAIClient`) picks the key: env `GEMINI_API_KEY` → user's stored key (`services/supabase/getUserApiKey.ts`, encrypted in `users.openai_api_key`) → `OPENAI_API_KEY`. Keys starting with `AIza` are routed to Gemini's OpenAI-compatible endpoint. `app/api/chat/route.ts` duplicates this logic inline — keep both in sync (or migrate it to `getAIClient`).
- Supabase (`lib/supabase.ts`) degrades gracefully: if env vars are missing/placeholder, `isSupabaseConfigured` is false and services must check it. Mixtape services fall back to localStorage (`services/local/mixtapeStorage.ts`). Preserve this fallback when touching `services/supabase/*`.
- BPM/key/mode come from `services/audioFeatures/getTrackAudioFeatures.ts` (ReccoBeats by album → by track → Deezer BPM-only; free, no API key). Spotify `/v1/audio-features` is dead (403 since Nov 2024) — don't reintroduce it. Spotify is only used for the album embed.
- New remote image hosts must be added to `next.config.js` (`images.domains` / `remotePatterns`).

## Environment

Template: `.env.local.sample`. Discogs vars are `CONSUMER_KEY` / `CONSUMER_SECRET` (docs/README.md wrongly says `DISCOGS_*`). Others read in code: `BASE_URL`, `NEXT_PUBLIC_BASE_URL`, `CRYPT_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `LASTFM_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
