# UCS Voting Platform

UNZA Computer Society election app. Share one HTTPS link in WhatsApp. Eligible students sign in with computer number, CS email, and email OTP, then vote once on a bound device. Admins see live results; voters never see scores.

## Local setup

```bash
cd C:\Users\TECHARBOR\Projects\ucs-vote
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for voters and [http://localhost:3000/admin/login](http://localhost:3000/admin/login) for officers.

Default local passwords (change these in `.env`):

- Admin: `ucs-admin`
- Observer: `ucs-observer`

Without a `RESEND_API_KEY`, OTP codes are printed in the terminal.

## Run an election

1. Sign in as admin.
2. Upload a CSV (`computer_number,cs_email,full_name`). A sample is in `public/sample-voters.csv`.
3. Add candidates (photos optional — upload later).
4. Open voting.
5. Copy the voter link or share it to WhatsApp.
6. Watch live results. After close, download the CSV report or print to PDF.

## Deploy (WhatsApp link)

SQLite is for local demo only. For a public URL:

1. Create a free [Neon](https://neon.tech) Postgres database.
2. In `prisma/schema.prisma` and `lib/prisma.ts`, switch the provider/adapter to Postgres (`@prisma/adapter-pg` + `pg`) **or** keep developing locally and point production `DATABASE_URL` at Neon after changing `provider = "postgresql"`.
3. Push the schema: `npx prisma db push`.
4. Deploy to [Vercel](https://vercel.com). Set env vars from `.env.example`:
   - `DATABASE_URL`
   - `SESSION_SECRET` (long random string)
   - `ADMIN_PASSWORD`
   - `OBSERVER_PASSWORD`
   - `RESEND_API_KEY` and `EMAIL_FROM` so OTP emails actually arrive
   - `APP_URL` (your Vercel URL)
5. Paste the Vercel URL in the WhatsApp group.

## Branding

Colours and type follow the UCS brand guide: teal `#2C8992`, orange `#FF9000`, off-white `#F4F2EF`, gray `#454B4C`, Josefin Sans + Poppins. Place official PNG logos in `public/branding/` as `ucs-logo.png` and `unza-crest.png` if you want the exact crest files instead of the SVG stand-ins.
