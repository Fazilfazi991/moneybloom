# Money Bloom

Money Bloom is a personal finance and income-goal dashboard built with React, TypeScript and Vite. It keeps income received, everyday expenses, debt repayments, account transfers and earning forecasts in separate calculation paths.

## Run locally

```powershell
pnpm install
pnpm dev
```

The initial demo is illustrative and stored in browser `localStorage`. Use **Settings → Start with blank data** to begin a personal ledger, or **Restore demo data** to return to the sample figures.

## Cloud sync

The Neon project supplies `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in `.env.local`. Keep these values private. Run `pnpm db:migrate` to create the sync table, then start the app as above. In Settings, choose **Set up cloud sync** and save the recovery code somewhere private. On another device, enter the same code under **Connect another device**. Connecting replaces that device's local dashboard; export a backup first if needed. The code grants access to the dashboard and cannot be recovered if lost. Data is stored in Neon and is not end-to-end encrypted.

Changes sync while the app is open. If both devices change data before syncing, the app stops rather than silently overwriting either copy. Export the local backup before reconnecting to the cloud copy.

For production, build with `pnpm build` and run `pnpm start` on a Node host with `DATABASE_URL` configured. The server serves the frontend and API together. A static-only host cannot run the sync API; a publicly reachable HTTPS deployment is needed for access from other devices. `localhost` only works on the computer running the app.

## Checks

```powershell
pnpm typecheck
pnpm lint
pnpm build
pnpm test
```

The financial calculation tests cover the seeded totals, transfer neutrality and the separation between actual income and forecasts.
