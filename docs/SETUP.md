# Setup

## Run the app without a database

```bash
npm install
npx expo start
```

Leave the Supabase variables empty. Gather uses the on-device demo. A banner says the posts are fictional. Demo password for every sample account is `gather-demo`. One moderator account is `rowan@demo.gather`.

## Connect Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env`.
3. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the project’s API settings. Use the publishable key, not the secret key.
4. Apply `supabase/migrations/20261031000000_init.sql` in the SQL editor, or with the Supabase CLI.
5. Restart Expo so it reads the env file.

`supabase/seed.sql` intentionally does not insert people or posts. Write the first real discussions from team accounts after you sign up.

Email confirmation depends on the project’s Auth settings. If confirmation is required, sign-up tells the person to check email and does not create a session until they do.

Password reset emails should allow the redirect `gather://reset-password`.

## Checks

```bash
npm run typecheck
npm test
```

Integration tests need a disposable project and a secret key that is not prefixed with `EXPO_PUBLIC`:

```bash
SUPABASE_TEST_URL=... SUPABASE_TEST_SECRET_KEY=... EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... npm run test:integration
```

## Builds

`eas.json` defines development, preview, and production profiles. Those builds have not been run as part of the initial implementation. Use `eas build` when you are ready to install on a device.
