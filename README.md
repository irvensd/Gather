# Gather

Faith. Questions. Community.

Gather is a React Native app for iOS and Android. People discuss Scripture, church life, relationships, and ordinary days in curated communities. Visitors can read before they create an account.

## Develop

```bash
npm install
npx expo start
```

Without Supabase credentials the app runs on fictional on-device data and says so. See [docs/SETUP.md](docs/SETUP.md) to connect a database.

Product, architecture, and the delivery plan are in `docs/`.

## Checks

```bash
npm run typecheck
npm test
```

Device and store builds use EAS. Do not treat a passing typecheck as a completed iOS or Android install test.
