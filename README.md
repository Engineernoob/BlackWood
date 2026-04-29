# Blackwood Private Office

Blackwood is an invite-only private office platform for discreet client intake, access request review, acquisition research, outreach approvals, and operator workflows.

The app is built with React, Vite, Tailwind CSS, Framer Motion, Supabase, Resend, and Polar.

## Features

- Public landing page with capabilities and access request form
- Private access request review console
- Acquisition Desk for prospect research and intake intelligence
- Outreach & Email Brain for draft approvals, reply tracking, and operator review
- Supabase Edge Functions for email notifications, confirmations, outreach sending, and Polar webhooks
- Supabase RLS protection for internal tables
- Admin-only private routes using Supabase Auth magic links

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local `.env` file:

```bash
cp .env.example .env
```

Required frontend variables:

```text
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAILS=your_admin_email@example.com
```

Optional:

```text
VITE_TAVILY_API_KEY=your_tavily_key
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Pages

Public:

```text
/
/#access
/#capabilities
```

Private operator routes:

```text
/#admin
/#desk
/#outreach
```

Private routes require Supabase Auth and an approved email in `public.blackwood_admins`.

## Admin Access

After running database migrations, add your admin email:

```sql
insert into public.blackwood_admins (email)
values ('your_admin_email@example.com')
on conflict (email) do update set active = true;
```

Use the same email in `VITE_ADMIN_EMAILS`.

In Supabase Auth settings, add redirect URLs:

```text
http://localhost:5173/*
https://your-vercel-domain.vercel.app/*
```

## Supabase

Apply database migrations:

```bash
supabase db push
```

Deploy Edge Functions as needed:

```bash
supabase functions deploy notify-access-request --no-verify-jwt
supabase functions deploy send-access-confirmation --no-verify-jwt
supabase functions deploy send-outreach-email
supabase functions deploy send-reply-email
supabase functions deploy receive-resend-webhook --no-verify-jwt
supabase functions deploy polar-webhook --no-verify-jwt
```

Required Supabase secrets:

```text
RESEND_API_KEY
BLACKWOOD_OPERATOR_EMAIL
RESEND_FROM_EMAIL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
POLAR_WEBHOOK_SECRET
```

Set secrets with:

```bash
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set BLACKWOOD_OPERATOR_EMAIL=your_operator_email
supabase secrets set RESEND_FROM_EMAIL="Blackwood Private Office <access@blackwoodprivate.xyz>"
supabase secrets set SUPABASE_URL=your_supabase_project_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
```

## Polar Webhook

Use this endpoint in Polar:

```text
https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/polar-webhook
```

Select these events:

```text
order.paid
subscription.created
subscription.active
subscription.updated
subscription.canceled
subscription.revoked
```

The webhook verifies signatures, stores webhook deliveries, handles duplicate delivery IDs, creates or updates clients, creates onboarding tasks, and sends an internal operator alert.

## Deployment

Deploy the frontend to Vercel.

Set these Vercel environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_ADMIN_EMAILS
VITE_TAVILY_API_KEY
```

After changing Vercel environment variables, redeploy the frontend.

## Security Notes

- Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, or `POLAR_WEBHOOK_SECRET` in the frontend.
- Internal pages are UI-gated with Supabase Auth and protected at the database level with RLS.
- Public users should only use the landing page, capabilities section, and access request form.
