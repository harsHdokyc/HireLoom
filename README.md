# Hireloom

Your job search, on your own machine: one profile, a tailored resume and cover letter for every job, and every application tracked from draft to offer.

Hireloom keeps your career history in one place and turns it into a clean resume. For every job you apply to, it reads the posting, shows how you match, and drafts a tailored resume and cover letter that only use facts from your profile. You refine them in a chat, download them as PDFs, and track each application from draft to offer.

Built for one person: one password, your data in your own PostgreSQL database, and an AI model of your choice (local via Ollama / LM Studio, or a hosted OpenAI-compatible / Anthropic / Mistral API).

## Features

- **Profile** — basics, skills, experience, projects, education, and more, with a strength meter
- **Base resume** — multiple themes and a theme builder, printed to PDF on the server
- **Find jobs** — search postings, score them against your profile, start an application in one click
- **Startups** — hiring startups from YC and Hacker News, ranked against your profile
- **Job agent (optional)** — daily search, scoring, and draft prep for your review (never auto-applies)
- **Tailored applications** — paste a posting; get a match analysis plus resume and cover letter drafts that never invent experience
- **Refine** — chat to edit drafts, undo, and keep private notes
- **Track** — board + table of every application, funnel dashboard, and calendar
- **Optional** — Claude connector, Gmail + Calendar

## Run locally

### With Docker Compose

```bash
cp .env.example .env
# set HIRELOOM_PASSWORD (hash), HIRELOOM_SECRET, and DATABASE_URL
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000), sign in, then pick an AI model in **Settings → AI provider**.

### With Node.js

```bash
cp .env.example .env
# fill in HIRELOOM_PASSWORD, HIRELOOM_SECRET, DATABASE_URL
yarn install
yarn prisma migrate deploy
yarn dev
```

Make a password hash with:

```bash
yarn hash-password
```

## Docs in this repo

- [PRIVACY.md](PRIVACY.md) — what stays on your server and what can leave it
- [SECURITY.md](SECURITY.md) — how the app protects your data
- [DEVELOPMENT.md](DEVELOPMENT.md) — working on the app itself

## Known limitations

- Desktop browsers only
- Single user (one password, one profile)
- English UI (documents can be written in other languages)
