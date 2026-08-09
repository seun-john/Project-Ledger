# Project Ledger

Project Ledger is a local-first project pipeline for independent consultants, small studios, and service teams. It keeps project stages, deadlines, fees, payments, balances, and notes together in one focused workspace.

The app is white-label by design: a first-run setup screen lets each installation choose its company name, logo, currency, precision, and pipeline stages. Business data stays in a local SQLite file.

## Features

- Kanban and sortable list views
- Configurable pipeline stages with rename, add, remove, and reorder controls
- Project health indicators for upcoming and overdue deadlines
- Fee, payment, outstanding balance, and overpayment tracking
- Configurable currency symbol, code, decimal display, and minor-unit storage
- Safe rescaling of saved amounts when the minor-unit factor changes
- First-run onboarding plus an always-available Settings screen
- Company name and uploaded or URL-based logo branding
- Project notes, client contact details, and CSV export
- Light, dark, and system theme modes
- Local SQLite storage with no hosted account required
- Optional fictional demo data using reserved `example.invalid` addresses

## Screenshots

Screenshots are intentionally left as placeholders until the public release is styled and populated with final demo data.

| View | Preview |
| --- | --- |
| Pipeline dashboard | `docs/screenshots/dashboard.png` — add before publishing the repository |
| White-label settings | `docs/screenshots/settings.png` — add before publishing the repository |

## Tech stack

- Next.js 15 and React 19
- TypeScript
- Prisma ORM
- SQLite
- Zod validation
- Plain CSS with responsive light and dark themes

## Requirements

- Windows, macOS, or Linux
- Node.js 20 or newer
- npm (included with Node.js)

## Quick start

```bash
git clone <your-repository-url>
cd ConsultTrack
cp .env.example .env
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first-run screen will ask for your company, logo, currency, and pipeline.

On Windows, you can instead double-click `Start Project Ledger.bat`. The launcher uses its own folder automatically, creates `.env`, installs missing dependencies, prepares a fresh database, and opens the app in your default browser. Node.js is still required for this launcher.

### Load fictional demo data

After setup, run:

```bash
npm run db:seed:demo
```

The demo records use labels such as “Sample Client A” and email addresses under the reserved `example.invalid` domain. The command will not add demo projects to a database that already contains projects.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run setup` | Generate Prisma, create the SQLite database, and seed default stages |
| `npm run db:seed:demo` | Add fictional sample projects to an empty project database |
| `npm run typecheck` | Check the TypeScript code |
| `npm run db:studio` | Open Prisma’s local database browser |

## Local data and backups

The default database is `prisma/dev.db`. It is excluded from Git because it can contain real client information. Back up that file while the app is stopped if you need to move an installation.

Uploaded logos are stored as data URLs inside the same local database. Remote logo URLs are also supported.

Changing the currency’s minor-unit factor rescales existing stored fees and payments to preserve their major-unit values. For example, USD normally uses `100` minor units and `2` display decimal places; a zero-decimal currency normally uses `1` and `0`.

## Environment variables

Copy `.env.example` to `.env`:

```env
DATABASE_URL="file:./dev.db"
```

No API keys or hosted services are required.

## Windows desktop packaging

A standalone `.exe`/installer is not included yet. Packaging a Next.js server, Prisma’s native engine, and a writable per-user SQLite database inside Electron needs a dedicated signing, migration, and update workflow to be reliable for non-technical users. It is planned as a follow-up; until then, use the documented Node.js setup or the Windows double-click launcher.

## Privacy and deployment note

Project Ledger is designed for a trusted local machine. It does not include authentication or multi-user access controls. Do not expose the development or production server directly to the public internet without adding authentication, authorization, HTTPS, and an appropriate deployment database.

## Contributing

Issues and pull requests are welcome. Please run `npm run typecheck` and `npm run build` before submitting a change. Never commit `.env` or files under `prisma/*.db`.

## License

[MIT](LICENSE)
