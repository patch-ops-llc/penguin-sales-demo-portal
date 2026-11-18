# Penguin Sales Demo Portal

A private portal where Penguin Strategies and HubSpot sales reps run short, scripted demos of what
Penguin builds on HubSpot. A rep signs in, picks a vertical and a demo, and walks a prospect through
it inside a simulated HubSpot portal.

Everything a prospect sees is simulated. The app makes no HubSpot API calls and holds no customer data.

## What is in it

- **Sign-in.** Invite-only, with two roles (user and admin). Email and password, an optional emailed
  sign-in link, and optional Google sign-in. Signed-out screens carry Penguin branding only.
- **Launchpad.** Vertical and demo picker. Manufacturing is live; the other verticals show as coming soon.
- **Simulated HubSpot shell.** Navigation, index pages, records, quotes, tasks, products, and workflows,
  all running in the browser from one data pack per vertical. Moving around a demo never asks the server for a page.
- **Demo bar.** Step counter, Next and Back, View as another person, highlight of Penguin extensions, one-click reset.
- **Penguin extension callouts.** Anything Penguin would build carries a small Penguin pin with a
  one-line callout. Native HubSpot pieces carry no marker. The split lives in one file per vertical:
  `src/verticals/manufacturing/extensions.ts` (`by: "penguin"` or `by: "native"`).
- **Admin.** Users and invitations, access log (sign-ins, and which vertical and demo each person opened),
  demo runs, and an audit trail of admin actions.

## Run it locally

Needs Node 22 and Postgres.

```bash
cp .env.example .env        # then fill in the values
npm install
npx prisma migrate deploy   # create the tables
npm run db:seed             # create the first admin from ADMIN_EMAILS
npm run dev                 # http://localhost:3000
```

`npm run db:seed` reads variables from the environment. With a local `.env` file, run it as
`node --env-file=.env prisma/seed.mjs`.

Checks: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e`.

## Deploy on Railway

One project with two services: Postgres and the app.

1. Create a project and add a **PostgreSQL** database service.
2. Add a service for this repository (deploy from GitHub, or `railway up` from a checkout).
3. Set the variables below on the app service.
4. Under the app service's Networking settings, generate a domain. Set `APP_URL` to that URL, with `https://` and no trailing slash.
5. Deploy.

`railway.json` in this repository sets the commands, so nothing else has to be typed into Railway:

| Step | Command | What it does |
| --- | --- | --- |
| Build | `npm run build` | `prisma generate`, then `next build` |
| Start | `npm run start` | `prisma migrate deploy` (applies any new migrations), `node prisma/seed.mjs` (creates or updates the admins, prunes old log rows), then `next start` |
| Health check | `GET /api/health` | Returns 200 when the app can reach the database |

The migration step runs on every start and is safe to repeat: it applies only migrations that have not run yet.

### Variables

Required:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (a reference to the Postgres service) |
| `APP_URL` | The public URL, for example `https://your-app.up.railway.app`. Used for links in emails, redirects, and secure cookies |
| `SESSION_SECRET` | A long random string (`openssl rand -base64 48`). Signs one-time tokens |
| `ADMIN_EMAILS` | Comma-separated emails that are admins. Each one is created as an admin on every start |
| `ADMIN_INITIAL_PASSWORD` | The first password for those admins, at least 10 characters. Used only when an admin has no password yet, so a password changed in the app is never overwritten |

Optional:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | Resend API key. With it, invitations, reset links, and sign-in links are emailed. Without it, the admin screen shows each one-time link to copy |
| `EMAIL_FROM` | Sender, for example `Penguin Sales Demo Portal <demos@your-verified-domain.com>`. The domain must be verified in Resend |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Turns on Google sign-in. The button is hidden unless both are set |
| `ADMIN_PASSWORD_RESET` | Set to `true` for one deploy to reset the admins' passwords to `ADMIN_INITIAL_PASSWORD`, then remove it |
| `SESSION_TTL_DAYS` | Days a session lasts without use. Default 30 |
| `LOG_RETENTION_DAYS` | Days access log rows are kept. Default 730 |

Never commit real values. `.env` is ignored by git; `.env.example` holds names only.

### The first admin

On each start the seed makes every address in `ADMIN_EMAILS` an active admin. If the admin has no password,
it is set from `ADMIN_INITIAL_PASSWORD`. The admin can change it afterwards under **Account** (top right of the
launchpad), and that change sticks across deploys. If `ADMIN_INITIAL_PASSWORD` is not set, the seed prints a
one-time setup link in the deploy log instead.

### Google sign-in

Access stays invite-only. Google sign-in works only for an email an admin has already added, and never
creates an account. In Google Cloud Console, create an OAuth client of type **Web application** with:

- Authorized JavaScript origin: `<APP_URL>`
- Authorized redirect URI: `<APP_URL>/auth/google/callback`

Then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` on the app service and redeploy.

## How the demos work

- `src/verticals/<vertical>/` holds a vertical's data pack: companies, contacts, deals, products, quotes,
  and the content of each demo. The pack is plain JSON, sent only to signed-in users, and cached by the browser.
- `src/demos/scripts.ts` holds the storyboards: the steps of each demo, shared by every vertical.
- `src/store/` holds the in-browser state. The world is always the seed data plus a list of actions, so
  reset drops the list and Back replays a shorter one. Nothing typed in a demo is sent to the server.
- `src/shell/` is the simulated HubSpot interface.
- The server records only access events: sign-ins, and which vertical, demo, and step a user reached.
