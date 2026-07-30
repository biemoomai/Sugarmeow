# Changelog

## [V1.2.0] - 2026-07-30
### Added
- **AI Fallback Architecture (3-Tier)**: 
  - Implemented automatic fallback routing in `src/lib/gemini.ts`.
  - Tier 1: Google Gemini (`gemini-1.5-flash`)
  - Tier 2: Groq (`llama-3.3-70b-versatile`)
  - Tier 3: Cerebras (`llama3.1-70b`)
- Visual Loading State in Dashboard (`useTransition` and `Loader2` in `TopNav` and `DashboardClient`).

### Fixed
- Fixed "สมองเบลอ" error caused by Vercel environment override by explicitly defining models and implementing fallback.
- Fixed Groq `llama3-70b-8192` decommission error by updating to `llama-3.3-70b-versatile`.

## [V1.1.0] - 2026-07-29
### Added
- Line Webhook integration (`/api/line/webhook`).
- Rich menu and Flex Message support.
- CRUD operations for Transactions (Sale, Purchase, Expense) using Prisma.
- Dashboard UI with Tabs (Daily, Weekly, Monthly, Yearly).

## [V1.0.0] - 2026-07-28
### Added
- Initial project setup with Next.js App Router, Tailwind CSS, Prisma, NextAuth.
- Database schema for `Customer`, `Supplier`, `Product`, `Sale`, `Purchase`, `Expense`.
