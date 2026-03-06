# QueueUp — Smart Queue Management

Reserve your spot in real-world queues. No more waiting in line — scan, book, and go.

## Features

- **QR Code Reservations** — Place a QR code at your station; users scan and book timeslots
- **Capacity Control** — Set max reservations per timeslot (e.g., 2 microwaves, 3 spots)
- **Email Notifications** — Confirmation on booking + reminder 15 minutes before
- **Admin Panel** — Create events, manage timeslots (single or bulk), view reservations
- **Multi-use** — Microwaves, printers, study rooms, meeting rooms — anything with a queue

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **shadcn/ui** + **Tailwind CSS**
- **Supabase** (PostgreSQL + Email)
- **Docker** for deployment

## Quick Start

### 1. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration files under `supabase/migrations/` in order.
3. Copy your project URL, anon key, and service role key

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-secure-password
```

### 3. Run with Docker

```bash
docker compose up --build
```

App runs at **http://localhost:3000**.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing page
│   ├── events/[eventId]/                 # Public reservation flow
│   ├── admin/login/                      # Admin login
│   ├── admin/(dashboard)/                # Admin panel
│   │   ├── page.tsx                      # Dashboard
│   │   └── events/                       # Event & timeslot management
│   └── actions/                          # Server actions
├── components/ui/                        # shadcn/ui components
├── lib/
│   ├── supabase/                         # Supabase clients
│   ├── email.ts                          # Email templates
│   ├── cron.ts                           # Reminder cron job
│   └── types.ts                          # TypeScript types
└── middleware.ts                         # Admin auth protection
```

## Admin Usage

1. Go to `/admin/login` and enter the `ADMIN_PASSWORD`
2. Create events (e.g., "Microwave Station A")
3. Add timeslots — individually or in bulk (e.g., every 10 min from 11:00–14:00 with capacity 2)
4. Download the QR code and place it at the station
5. Monitor reservations from the admin panel

## Email Setup

Emails are sent via a Supabase Edge Function at `/functions/v1/send-email`. You'll need to deploy this function in your Supabase project. Alternatively, integrate any email provider (Resend, SendGrid, etc.) by modifying `src/lib/email.ts`.
