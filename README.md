# Budgetly

Budgetly is a private household finance application for a small family. It is built with Next.js, TypeScript, Tailwind CSS, ShadCN-style UI primitives, and Supabase PostgreSQL.

The app is designed for a shared household workflow with internal database-backed authentication, monthly reporting, mobile-first navigation, and finance modules beyond basic income and expense tracking.

## Features

- Dashboard with balance, income, expense, savings progress, charts, and budget highlights
- Transactions with create, edit, delete, search, CSV export, and payment method support
- Goals with create, edit, delete, progress tracking, and completion state
- Budgets with monthly category limits, usage progress, and delete support
- Client invoices with paid and unpaid status
- Debt and receivables tracking
- Investments tracking
- Subscriptions with payable monthly cycles
- AI-generated monthly reports
- Settings for category master data, report generation, and backup export
- Profile page with password change
- Dark mode
- Mobile bottom navigation and responsive tablet/desktop navigation
- Hide or show money amounts globally

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Radix UI primitives
- React Hook Form
- Zod
- Zustand
- TanStack Query
- Recharts
- Framer Motion
- Supabase PostgreSQL

## Authentication

This project does not use Supabase Auth for login.

Authentication is handled by internal database tables and a signed session cookie:

- login supports email or username
- passwords are stored in the application database
- session cookie name: `budgetly_session`
- protected routes are enforced by middleware

## Project Structure

```text
app/
components/
features/
hooks/
lib/
services/
supabase/
types/
utils/
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_SESSION_SECRET=
AI_API_BASE_URL=https://ai.rasmadibnu.com
AI_API_KEY=
AI_MODEL=gemini-3-flash
APP_HOUSEHOLD_NAME=Budgetly Household
```

### Notes

- `SUPABASE_SERVICE_ROLE_KEY` is required because server-side data access uses the service role.
- `AUTH_SESSION_SECRET` is required for signing the internal session cookie.
- `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` are used for the monthly AI report.

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Type-check the project:

```bash
npx tsc --noEmit
```

## Database Setup

Apply the Supabase SQL migrations in this order:

1. `supabase/migrations/20260330140000_budgetly_schema.sql`
2. `supabase/migrations/20260330153000_internal_auth.sql`
3. `supabase/migrations/20260330170000_client_invoices.sql`
4. `supabase/migrations/20260330190000_finance_extensions.sql`
5. `supabase/migrations/20260330200000_change_password.sql`

Optional seed data:

```text
supabase/seed/seed.sql
```

The seed creates sample household data for internal users and finance modules. If you want a clean start, do not run the seed.

## Main Modules

### Dashboard

- current balance
- monthly income
- monthly expense
- budget usage highlights
- active goals
- charts and recent transactions

### Transactions

- income and expense records
- search
- CSV export
- payment method dropdown
- add and edit in dialog or mobile sheet

### Goals

- create, edit, delete
- mark as completed
- progress and remaining amount

### Budgets

- create monthly category budgets
- delete budgets
- category list in the create form only shows categories not yet budgeted for the selected month

### Invoice

- client invoices
- paid and unpaid status

### Debt & Receivables

- track money owed by you or to you

### Investments

- track invested amount, current value, and status

### Subscriptions

- recurring monthly subscription records
- monthly cycle status

### Reports

- monthly finance snapshot
- AI-generated insights and recommendations

## Mobile UX

- mobile bottom dock navigation
- center floating add-transaction action
- auto-hide bottom navigation while scrolling down
- tablet layout uses hamburger navigation
- desktop layout uses a sidebar

## Important Security Note

This repository expects secrets through environment variables only. Do not commit real production secrets.

If any service-role or AI key has been exposed, rotate it before production deployment.

## Deployment Notes

For Cloudflare or other hosted environments, make sure these values are configured:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SESSION_SECRET`
- `AI_API_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`
- `APP_HOUSEHOLD_NAME`

## Verification

Recommended verification command:

```bash
npx tsc --noEmit
```
