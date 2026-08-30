# CareerPilot AI — Folder Structure

```
careerpilot-ai/
├── docs/
│   ├── schema.sql                     # Deliverable 1 — full DB schema
│   ├── folder-structure.md            # this file
│   └── design-system.md               # Deliverable 3 — design tokens
│
├── public/
│   ├── icons/                         # favicons, app icons, PWA manifest icons
│   └── images/                        # static marketing / illustration assets
│
├── supabase/
│   ├── migrations/                    # timestamped .sql migration files (schema.sql seeds the first one)
│   └── config.toml                    # Supabase CLI project config
│
├── src/
│   ├── middleware.ts                  # Supabase session refresh + route protection
│   │
│   ├── app/
│   │   ├── layout.tsx                 # root layout (ThemeProvider, Toaster, fonts)
│   │   ├── page.tsx                   # public landing page
│   │   ├── globals.css                # Tailwind base + CSS variables (design tokens)
│   │   ├── not-found.tsx
│   │   │
│   │   ├── (auth)/                    # unauthenticated route group
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   │
│   │   ├── (onboarding)/              # first-run wizard, gated: authed but incomplete profile
│   │   │   ├── layout.tsx
│   │   │   └── onboarding/page.tsx
│   │   │
│   │   ├── (dashboard)/               # authenticated app shell (sidebar + topbar)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx             # home / overview
│   │   │   ├── profile/page.tsx               # profile, skills, education, certifications
│   │   │   ├── resumes/
│   │   │   │   ├── page.tsx                   # Resume Vault (list)
│   │   │   │   ├── new/page.tsx                # upload/create
│   │   │   │   └── [resumeId]/page.tsx         # view / analysis detail
│   │   │   ├── resume-architect/
│   │   │   │   ├── page.tsx                   # AI resume builder entry
│   │   │   │   └── [resumeId]/page.tsx         # guided editor
│   │   │   ├── jobs/
│   │   │   │   ├── page.tsx                   # Job Hunter feed
│   │   │   │   ├── [jobId]/page.tsx            # job detail + match score
│   │   │   │   └── applications/page.tsx       # application tracker (Kanban/list)
│   │   │   ├── interviews/
│   │   │   │   ├── page.tsx                   # session history
│   │   │   │   ├── new/page.tsx                # configure a new mock interview
│   │   │   │   └── [sessionId]/page.tsx        # live voice interview room + feedback
│   │   │   ├── emails/page.tsx                # Email Agent inbox/outbox
│   │   │   ├── roadmap/
│   │   │   │   ├── page.tsx                   # career goals overview
│   │   │   │   └── [goalId]/page.tsx           # roadmap steps for one goal
│   │   │   ├── agents/page.tsx                # Master Orchestrator activity log
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/page.tsx              # account, preferences, theme
│   │   │
│   │   └── api/                       # server route handlers (called by client + agents)
│   │       ├── resumes/
│   │       │   ├── parse/route.ts             # extract text/structure from uploaded file
│   │       │   └── analyze/route.ts           # ATS scoring
│   │       ├── cover-letters/
│   │       │   └── generate/route.ts
│   │       ├── jobs/
│   │       │   ├── search/route.ts            # trigger Job Hunter search
│   │       │   └── match/route.ts             # score job against profile
│   │       ├── interviews/
│   │       │   ├── generate-questions/route.ts
│   │       │   ├── evaluate-answer/route.ts
│   │       │   └── transcribe/route.ts        # speech-to-text passthrough
│   │       ├── emails/
│   │       │   ├── generate/route.ts
│   │       │   └── send/route.ts
│   │       ├── roadmap/
│   │       │   └── generate/route.ts
│   │       ├── agents/
│   │       │   ├── orchestrator/route.ts
│   │       │   ├── resume-architect/route.ts
│   │       │   ├── job-hunter/route.ts
│   │       │   ├── email-agent/route.ts
│   │       │   └── interview-agent/route.ts
│   │       └── webhooks/
│   │           └── supabase/route.ts          # auth/db webhook receiver
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui primitives (button, input, dialog, tabs, ...)
│   │   ├── layout/                    # sidebar, topbar, mobile-nav, footer
│   │   ├── auth/                      # login-form, signup-form, auth-guard
│   │   ├── onboarding/                # step components, progress-indicator
│   │   ├── profile/                   # profile-form, skills-editor, education-list
│   │   ├── resume/                    # resume-card, resume-uploader, ats-score-ring, resume-editor
│   │   ├── jobs/                      # job-card, job-filters, match-score-badge, application-kanban
│   │   ├── interview/                 # voice-recorder, question-panel, live-transcript, score-breakdown
│   │   ├── email/                     # email-thread, email-composer, template-picker
│   │   ├── roadmap/                   # goal-card, roadmap-timeline, step-checklist
│   │   ├── agents/                    # agent-status-card, activity-feed, orchestrator-panel
│   │   ├── dashboard/                 # stat-card, progress-widget, quick-actions
│   │   └── shared/                    # loading-spinner, empty-state, error-boundary, page-header
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # browser client (createBrowserClient)
│   │   │   ├── server.ts              # server component / route handler client
│   │   │   ├── middleware.ts          # session refresh helper used by src/middleware.ts
│   │   │   └── admin.ts               # service-role client (server-only, for job_listings writes etc.)
│   │   ├── ai/
│   │   │   ├── openrouter.ts          # OpenRouter client wrapper
│   │   │   ├── prompts/               # prompt templates per feature
│   │   │   │   ├── resume.ts
│   │   │   │   ├── interview.ts
│   │   │   │   ├── email.ts
│   │   │   │   ├── roadmap.ts
│   │   │   │   └── job-match.ts
│   │   │   └── fallbacks/             # deterministic non-AI fallback logic per feature
│   │   │       ├── resume.ts
│   │   │       ├── interview.ts
│   │   │       ├── email.ts
│   │   │       ├── roadmap.ts
│   │   │       └── job-match.ts
│   │   ├── agents/                    # orchestration logic consumed by app/api/agents/*
│   │   │   ├── orchestrator.ts
│   │   │   ├── resume-architect.ts
│   │   │   ├── job-hunter.ts
│   │   │   ├── email-agent.ts
│   │   │   └── interview-agent.ts
│   │   ├── validations/               # zod schemas, one file per domain
│   │   │   ├── profile.ts
│   │   │   ├── resume.ts
│   │   │   ├── job.ts
│   │   │   ├── interview.ts
│   │   │   └── roadmap.ts
│   │   ├── types/
│   │   │   ├── database.ts            # generated Supabase types (supabase gen types)
│   │   │   └── index.ts               # shared app-level types
│   │   ├── constants.ts               # enums mirrored from DB check constraints, route paths
│   │   └── utils.ts                   # cn(), formatters, date helpers
│   │
│   ├── hooks/
│   │   ├── use-user.ts                # current auth user
│   │   ├── use-profile.ts
│   │   ├── use-resumes.ts
│   │   ├── use-job-applications.ts
│   │   ├── use-notifications.ts
│   │   └── use-media-query.ts
│   │
│   └── styles/
│       └── fonts.ts                   # next/font declarations (headings + body)
│
├── .env.local.example                 # NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENROUTER_API_KEY, ...
├── .eslintrc.json
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

**Notes**
- Route groups `(auth)`, `(onboarding)`, `(dashboard)` share no URL segment — each gets its own `layout.tsx` for guarding and chrome.
- `lib/ai/fallbacks/` exists 1:1 with `lib/ai/prompts/` so every AI call in the build rules ("every AI call has a deterministic fallback") has an obvious home for its non-AI counterpart.
- `lib/agents/*` is plain orchestration logic; `app/api/agents/*` are thin route handlers that call into it — keeps agent logic testable outside the request/response cycle.
- `components/ui/` is reserved for shadcn/ui-generated primitives only; feature components live in their own folders so `ui/` stays a clean, regenerable base.
