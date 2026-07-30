# Sugarmeow (ชูก้าร์แมวมึน) - AI & System Architecture

This `skill.md` file serves as a knowledge base for future AI assistants working on this project. If you are an AI reading this, use this context to understand the system.

## Version
Current Version: **V1.2.0** (See `CHANGELOG.md` for history)

## Tech Stack
- Next.js (App Router)
- Prisma (with PostgreSQL / Supabase)
- Tailwind CSS, Framer Motion
- LINE Messaging API (Webhook)
- AI Providers: Google Gemini, Groq, Cerebras

## Core AI Logic (`src/lib/gemini.ts`)
This project uses a **3-Tier AI Fallback Architecture** to ensure 100% uptime for parsing Thai natural language transactions into JSON.

1. **Tier 1: Google Gemini (`gemini-1.5-flash`)**
   - The default provider. Excellent at Thai language.
   - Requires `GEMINI_API_KEY`.
2. **Tier 2: Groq (`llama-3.3-70b-versatile`)**
   - Fallback if Gemini fails (e.g., quota exceeded). Extremely fast inference.
   - Requires `GROQ_API_KEY`.
   - *Note*: Ensure the model string is up-to-date, as Groq deprecates older models frequently.
3. **Tier 3: Cerebras (`llama3.1-70b`)**
   - Final fallback using `fetch` to OpenAI-compatible endpoint `https://api.cerebras.ai/v1/chat/completions`.
   - Requires `CEREBRAS_API_KEY`.

### Prompt Constraints
The AI is strictly prompted to return `json_object` matching the `ExtractedTransaction` type. 
If information is missing, the intent becomes `INCOMPLETE` and the AI formulates a natural Thai question (`replyMessage`) which the webhook sends back to the user via LINE.

## Webhook Flow (`src/app/api/line/webhook/route.ts`)
1. User sends text to the LINE bot.
2. Webhook triggers `showLoadingAnimation` for UX.
3. Webhook parses specific keywords (`สรุป`, `แดชบอร์ด`, `วิธีใช้`) and replies with Flex Messages.
4. If not a command, it calls `extractTransaction(text, previousContext)`.
5. The result is saved to `TransactionDraft` in the DB.
6. A confirmation Flex Message is sent to the user.
7. Upon clicking "Confirm" (Postback), the draft is merged into the actual tables (`Sale`, `Purchase`, `Expense`), and records for `Customer`, `Supplier`, or `Product` are upserted.

## Common Pitfalls
- **Vercel Timeout (10s limit)**: Webhooks on Vercel Free Tier time out after 10 seconds. AI requests must resolve quickly. The fallback structure prioritizes speed.
- **Prisma Schema**: Contains unified `TransactionDraft` for contextual multi-turn conversation.

When you modify this project, please update `CHANGELOG.md` and bump the version accordingly!
