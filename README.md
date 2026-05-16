# AlignOS — Enterprise Goal Setting Portal

Next.js App Router application for enterprise goal lifecycle management (Syntra / AlignOS).

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

1. Create a [Supabase](https://supabase.com) project.
2. Run migrations in order from `supabase/migrations/` (SQL editor or Supabase CLI).
3. Run `supabase/seed.sql` for departments, thrust areas, and the FY26 goal cycle.
4. Copy `.env.local.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; optional for local seed scripts)
5. Create users via **Supabase Auth** (Dashboard → Authentication, or app sign-up on `/login`).
6. For each auth user, add a matching row in `public.profiles` with `id = auth.users.id` (or use sign-up, which upserts a profile when email confirmation is disabled).
7. Run `npm run dev` and sign in with a real account, or use **Quick Demo Access** without Supabase.

### Without Supabase env vars

The app runs in **mock demo mode**: goal cycle, dashboards, and login role navigation use `lib/mock-data.ts`. No backend required for demos or Vercel previews.

## Build

```bash
npm run build
npm start
```

## Project structure (Supabase slices)

| Slice | Scope |
|-------|--------|
| 1 | Reference data, active goal cycle in sidebar |
| 2 | Auth, profiles, login with mock fallback (`lib/data/auth.ts`, `lib/data/profiles.ts`) |
| 3 | Dashboard headers use `DashboardHeader` + `useCurrentProfile()` (goal data still mock) |

Use `components/layout/dashboard-header.tsx` on wired pages; business data on those pages still comes from `lib/mock-data.ts`.
