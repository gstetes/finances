# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm test             # run tests once (vitest)
npm run test:watch   # vitest in watch mode
npm run test:ui      # vitest with browser UI
```

Run a single test file: `npx vitest run src/components/ui/__tests__/Button.test.tsx`

## Architecture

This is a personal finance SPA (React 19 + Vite + TypeScript) backed by Supabase.

**Auth flow:** `AuthContext` (`src/contexts/AuthContext.tsx`) wraps the app and exposes `user` (undefined while loading, null when logged out, User when logged in). `ProtectedRoute` guards all app routes; unauthenticated users land on `/auth/login`.

**Routing:** Defined in `src/App.tsx`. Protected pages sit under `AppLayout` (sidebar shell). Four main pages: Dashboard, Accounts, CreditCards, Transactions.

**Data access pattern:** Each entity has a custom hook (`src/hooks/`) that calls Supabase directly, manages local state, and exposes CRUD operations. Hooks do optimistic/local state updates after mutations — no global store or query cache.

**Database (Supabase):** All tables use RLS — every row is scoped to `auth.uid()`. Key constraints:
- A `transaction` must have either `account_id` or `invoice_id` (check constraint).
- Postgres triggers automatically update `accounts.balance` and `credit_card_invoices.total_amount` when transactions are inserted/updated/deleted.
- New users auto-get a `profile` and seeded default categories via DB triggers.
- Recurring transactions are processed by a Supabase Edge Function (`supabase/functions/process-recurring/`) scheduled via `pg_cron` (migration 002).

**UI components:** Custom component library in `src/components/ui/` — no shadcn/ui or external component library. Uses Tailwind CSS v4 (via `@tailwindcss/vite` plugin). `cn()` utility from `src/lib/utils.ts` merges class names.

**Currency/locale:** The app is in Brazilian Portuguese. Use `formatCurrency()` (BRL / pt-BR) and `formatDate()` (pt-BR) from `src/lib/utils.ts` for all display formatting.

**Types:** `src/types/database.ts` is the authoritative type source. The `Database` interface uses `any` for Insert/Update intentionally to avoid false-negative TypeScript errors — do not "fix" this. Run `supabase gen types typescript` to regenerate if the schema changes.

**Path alias:** `@/` maps to `src/`.

## Environment

Copy `.env.example` to `.env.local` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
