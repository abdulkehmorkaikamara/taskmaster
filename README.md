# taskmaster

A full-stack task and calendar management app, with shared lists, reminders,
and calendar syncing.

## Tech stack

- **Client:** React (Ionic UI), FullCalendar, i18next
- **Server:** Express, PostgreSQL, JWT auth, Stripe billing, OpenAI, Google Calendar sync

## Project structure

- `client/` — React frontend
- `server/` — Express API and background jobs (reminders, cron)

## Running locally

**Server**

```bash
cd server
npm install
npm start
```

**Client**

```bash
cd client
npm install
npm start
```

Both `client/` and `server/` expect a `.env` file with the relevant API keys
and database connection details (see the imports in `server/server.js` for
the full list of required environment variables).
