# Implementation plan

## Phase 1 — Architecture

Document the product, the data model, and the security boundary before UI work. Resolve stack choices: Expo SDK 58, Expo Router native tabs, Supabase through one API interface, demo fallback when credentials are absent.

## Phase 2 — Foundation

Initialize the Expo TypeScript app. Add theme tokens for the specified light and dark palettes, auth/session storage, query client, and the shared UI components named in the product brief.

## Phase 3 — Screens

Home, Explore, Create, Activity, and Profile, plus discussion, community, scripture, search, settings, and moderation. Empty, loading, offline, and error states are part of the screens, not a later pass.

## Phase 4 — Backend

Versioned SQL in `supabase/migrations`. Communities are inserted by the migration so a fresh project has the eight rooms without fictional members. Setup is `docs/SETUP.md` and `.env.example`.

## Affected areas

- `src/app` routes and `src/components` presentation
- `src/features` for feed, composer, discussion, auth, profile
- `src/lib/backend` demo store and Supabase RPC client
- `src/lib/domain` and `src/lib/scripture` for rules covered by unit tests
- `supabase/migrations/20261031000000_init.sql`

## Testing strategy

Unit tests cover scripture parsing, validation, feed order, usernames, vote transitions, notification copy, comment nesting, pagination, and permission helpers. They do not need a device or a database.

`npm run test:integration` talks to a separate Supabase project using `SUPABASE_TEST_URL` and `SUPABASE_TEST_SECRET_KEY`. It skips when those are unset. The secret key is never an `EXPO_PUBLIC` variable.

Maestro flows in `maestro/journeys` describe the five product journeys for a development build with bundle id `com.gather.community`. They are configuration, not a claim that a simulator run passed.

`npm run typecheck` and `npm test` are the checks that can be run in this repository. iOS and Android binaries are produced later with EAS (`eas.json`). A green typecheck is not a device test.

## Acceptance checklist

- TypeScript compiles with strict settings.
- Unit tests pass.
- The app launches in Expo without Supabase credentials and shows the demo banner.
- With credentials, the same screens call the SQL functions.
- A visitor can browse, be asked to sign in on a comment, finish onboarding, and return.
- A report lands in the moderator queue, and a non-moderator cannot call `moderate_content` successfully.
