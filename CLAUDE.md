# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Architecture overview and roadmap (Spanish): @docs/README.md

## Commands

- Requires Node.js ≥22 (AI SDK v7); the project targets Node 24 via `fnm` + `.nvmrc`. Setup and upgrade plan: `docs/actualizacion_dependencias_2026.md`.

- `npm run dev` / `npm run build` / `npm run lint` (`eslint .` with flat config `eslint.config.mjs` — Next 16 removed `next lint`)
- `.npmrc` sets `ignore-scripts=true` and `save-exact=true` (supply-chain protection). Ask before installing any package; prefer versions published at least 1–2 weeks ago, review the `package-lock.json` diff and run `npm audit signatures` afterwards.
- Type-check with `npx tsc --noEmit`. There are no tests and no CI — type-check + lint is the verification step.

## Conventions

- Write code comments, UI strings, error messages and commit messages in **Spanish**, matching the existing code. Some data fields are Spanish too (`artista`, `trackname`, `disco_id`) — keep those names.
- Commit directly to `main` (solo project, no PR flow).
- Tailwind v3 with `prefix: 'tw-'` (`tailwind.config.js`): every utility must be prefixed — `tw-flex`, `dark:tw-text-white`, `hover:tw-bg-...`. Unprefixed classes silently do nothing. Dark mode is class-based.
- Design rules live in `docs/design.md` (light redesign, Oct 2026): `gray` is Tailwind `stone` (warm), `brand` is the single green accent (`brand-600` #3E7F0A takes white text); `vinyl` is a deprecated alias — don't use it, nor ad-hoc blue/orange/purple or gradients; red only for destructive actions/errors; Camelot colors only via `CamelotChip` / `getCamelotHex()`. Fonts: Inter + JetBrains Mono via `next/font` in `_app`. The signature element is `VinylDisc` (cover as the label). Don't name a color `accent` (shadcn token).
- Styling is Tailwind + shadcn (`components/ui/`, `@/lib/utils`). MUI/Emotion are still in package.json but no longer used — don't add new MUI code.
- Path alias `@/*` → repo root.

## Architecture gotchas

- Mixed routers: everything lives in the Pages Router (`pages/`, `pages/api/`) **except** the DiscBOT streaming chat at `app/api/chat/route.ts` (App Router, `ai` package `OpenAIStream`). Because `app/` exists, unmatched URLs are served by the App Router: `app/global-not-found.tsx` (enabled with `experimental.globalNotFound`) is the real 404; `pages/404.tsx` only shows at `/404`.
- Auth is custom Discogs OAuth 1.0a via `disconnect` (no next-auth). Session lives in cookies (`username`, `isLoggedIn`, plus AES-encrypted httpOnly `usernameCipher` / `accessData`, keyed by `CRYPT_KEY`).
- `pages/api/auth/devLogin.ts` is a dev-only bypass (403 in production) that sets mock Discogs tokens — real Discogs API calls fail under it. The normal local setup is the full stack (real Discogs OAuth + Supabase in `.env.local`).
- AI calls use the OpenAI SDK pointed at either Gemini or OpenAI. `lib/aiClient.ts` (`getAIClient`) picks the key: env `GEMINI_API_KEY` → user's stored key (`services/supabase/getUserApiKey.ts`, encrypted in `users.openai_api_key`) → `OPENAI_API_KEY`. Keys starting with `AIza` are routed to Gemini's OpenAI-compatible endpoint. `app/api/chat/route.ts` duplicates this logic inline — keep both in sync (or migrate it to `getAIClient`).
- Supabase is **server-only**: `lib/supabase.ts` uses the secret key (`SUPABASE_SECRET_KEY`, bypasses RLS) and the `anon` role has no grants or policies. The browser never talks to Supabase — pages call API routes (via `services/client/*`) that take the user from `requireSessionUser`. Never import `services/supabase/*` or `lib/supabase` from pages/components/hooks, and never add `NEXT_PUBLIC_` Supabase vars.
- Supabase degrades gracefully: if env vars are missing/placeholder, `isSupabaseConfigured` is false and services must check it. The client mixtape (`services/client/mixtape.ts`) keeps a localStorage copy (`services/local/mixtapeStorage.ts`) and falls back to it when `/api/mixtape` fails or returns 503. Preserve this fallback.
- Named mixtapes: table `mixtapes` (one row per mixtape) + track table `mixtape` (historic singular name) with `mixtape_id`. The active mixtape (target of «+» on the album page) lives in `hooks/useMixtapes.ts`, remembered in localStorage. `/api/mixtape` always needs a `mixtape_id` and checks ownership. Track order is the `position` column (new tracks append at the end; `PATCH` with the full `track_ids` list reorders, 409 if it doesn't match); auto-sort by Camelot + BPM lives in `lib/mixtapeOrder.ts`. Without Supabase there is a single local list (`mixtapeId` null). DiscBOT and the Spotify export work per mixtape: `/chat?mixtape_id=` → body `mixtape_id` → `app/api/chat/route.ts` checks it with `getOwnedMixtapeName` (falls back to all tracks if missing or not owned); `/api/auth/authorizeSpotify?mixtape_id=` keeps it in a `spotifyMixtapeId` cookie for the callback, which exports with the Feb 2026 endpoints (`POST /me/playlists`, `/playlists/{id}/items`), searches missing track IDs and redirects back to `/mixtape?id=` with `spotify=`/`spotify_error=`. Spotify rejects `localhost` redirect URIs: locally use `http://127.0.0.1:3000` for both `BASE_URL` and the browser. `/mixtapes` is the overview page; `/mixtape?id=` is one mixtape.
- DiscBOT builds sessions from the user's Discogs collection (`services/agent/sessionBuilder.ts`, tools `build_session` / `save_session_as_mixtape`); the chat route passes the decrypted `accessData` cookie in the agent context, never in the prompt.
- BPM/key/mode come from `services/audioFeatures/getTrackAudioFeatures.ts` (ReccoBeats by album → by track → Deezer BPM-only; free, no API key). Old tracks without data are backfilled from `/mixtape` via `POST /api/mixtape/completeTracks` (`services/supabase/completeMixtapeTracks.ts`: Discogs `vinyl_position`/duration + BPM/key, only fills null fields, stamps `data_checked_at`). Vinyl helpers (side, same-record warning, session duration) live in `lib/vinyl.ts`. Title matching in `getTrackAudioFeatures.ts` compares `versionTag()` too, so a remix never takes the original's BPM. Spotify `/v1/audio-features` is dead (403 since Nov 2024) — don't reintroduce it. Spotify is only used for the album embed.
- Album/mixtape playback: `services/youtube/getAlbumPlaylist.ts` builds a per-release playlist (Discogs videos → YouTube «Artist - Topic» tracks via `YOUTUBE_API_KEY`, 100 quota units per search → «full album» video → Deezer 30 s previews). Cached in memory and in the Supabase table `album_playlists`; Deezer preview URLs expire, so they are never cached. Client playback goes through `hooks/useTrackPlayer.ts` (YouTube IFrame API + `<audio>`).
- New remote image hosts must be added to `next.config.js` (`images.domains` / `remotePatterns`).

## Environment

Template: `.env.local.sample`. Discogs vars are `CONSUMER_KEY` / `CONSUMER_SECRET` (docs/README.md wrongly says `DISCOGS_*`). Others read in code: `BASE_URL`, `NEXT_PUBLIC_BASE_URL`, `CRYPT_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `LASTFM_API_KEY`, `YOUTUBE_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
