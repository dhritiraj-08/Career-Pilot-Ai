# CareerPilot AI 🚀

> **AI-Powered Career Operating System** — Automate your job search with 6 intelligent agents working 24/7.

[![Live Demo](https://img.shields.io/badge/Live-Demo-violet?style=for-the-badge)](https://career-pilot-ai-sepia-pi.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)](https://supabase.com)

---

## 📌 Overview

CareerPilot AI is a full-stack AI career automation platform built for Indian job seekers and students. It uses autonomous AI agents to handle every step of the job search — from building resumes to applying for jobs, preparing for interviews, and tracking career progress.

**The problem:** Job searching is time-consuming, repetitive, and stressful.

**The solution:** 6 specialized AI agents that work together autonomously, with you approving every action before it's taken.

---

## 🌐 Live Demo

🔗 **[https://career-pilot-ai-sepia-pi.vercel.app](https://career-pilot-ai-sepia-pi.vercel.app)**

---

## ✨ Features

### 🤖 6 AI Agents

| Agent | Code Name | Purpose |
|-------|-----------|---------|
| Resume Architect | **Nexus** | Builds ATS-optimized resumes tailored to specific job descriptions |
| Job Hunter | **Radar** | Scrapes real jobs from RemoteOK and WeWorkRemotely, scores by match |
| Interview Coach | **Mentor** | Conducts voice-based mock interviews with real-time feedback |
| Email Agent | **Hermes** | Connects Gmail, monitors job emails, composes and sends replies |
| Career Navigator | **Atlas** | Generates week-by-week career roadmaps with XP tracking |
| Career Autopilot | **Aria** | Orchestrates all agents with one click, human-in-loop approval |

### 🎯 Core Features

- **Smart Resume Builder** — Upload existing resume or build from scratch. AI tailors it per JD with ATS scoring
- **Real Job Discovery** — Live scraping from RemoteOK and WeWorkRemotely with India-friendly filter
- **One-Click Autopilot** — Aria runs all agents simultaneously, creates drafts for your approval
- **Voice Interview Practice** — Mentor conducts realistic interviews using Web Speech API
- **Gmail Integration** — Hermes reads job emails, categorizes them, suggests AI replies
- **Career Roadmap** — Atlas creates personalized week-by-week plans with XP gamification
- **Human-in-Loop Approval** — Nothing is sent without your explicit approval
- **Resume Vault** — Store multiple resumes, mark primary for agent use

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CareerPilot AI                          │
│                                                             │
│  ┌─────────────┐    ┌─────────────────────────────────┐    │
│  │   Next.js   │    │         AI Agents Layer          │    │
│  │   Frontend  │◄──►│                                 │    │
│  │  (App Router│    │  Nexus  │ Radar  │ Mentor       │    │
│  │  TypeScript │    │  Hermes │ Atlas  │ Aria         │    │
│  │  Tailwind)  │    └────────────────┬────────────────┘    │
│  └─────────────┘                     │                      │
│         │                            ▼                      │
│         │              ┌─────────────────────┐             │
│         │              │    OpenRouter API    │             │
│         │              │  (nvidia/nemotron-  │             │
│         │              │  3-super-120b-a12b: │             │
│         │              │  free)              │             │
│         │              └─────────────────────┘             │
│         │                                                   │
│         ▼                                                   │
│  ┌─────────────────────────────────────────────────┐       │
│  │                  Supabase                        │       │
│  │                                                  │       │
│  │  PostgreSQL DB  │  Auth  │  Storage  │  RLS     │       │
│  │                                                  │       │
│  │  Tables: profiles, resumes, skills, education,  │       │
│  │  job_listings, job_applications, interviews,    │       │
│  │  interview_sessions, emails, oauth_tokens,      │       │
│  │  career_goals, roadmap_steps, autopilot_runs,  │       │
│  │  autopilot_approvals, notifications + more      │       │
│  └─────────────────────────────────────────────────┘       │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐                      │
│  │  Gmail API   │    │  Job Boards  │                      │
│  │  (OAuth 2.0) │    │  RemoteOK    │                      │
│  │  Read/Send   │    │  WeWorkRemot │                      │
│  └──────────────┘    └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Autopilot Flow

```
User clicks "Run Aria"
         │
         ▼
┌─────────────────┐
│  Radar finds    │
│  matching jobs  │
│  (real scraping)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Nexus tailors  │
│  resume per JD  │
│  (per job)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Hermes drafts  │
│  application    │
│  email          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────┐
│  Notification   │────►│  YOU REVIEW │
│  Center shows   │     │  & APPROVE  │
│  draft card     │     └──────┬──────┘
└─────────────────┘            │
                               ▼
                    ┌─────────────────┐
                    │  Email sent via │
                    │  Gmail API      │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   ┌─────────────────┐           ┌─────────────────┐
   │  Mentor creates │           │  Atlas creates  │
   │  interview prep │           │  career roadmap │
   │  session        │           │  for this role  │
   └─────────────────┘           └─────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** — App Router, Server Components, API Routes
- **TypeScript** — Full type safety
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Animations and transitions
- **Shadcn/ui** — Component library base
- **Lucide React** — Icons
- **Sonner** — Toast notifications
- **Next Themes** — Dark/light mode

### Backend
- **Supabase** — PostgreSQL database, Auth, Storage, RLS
- **OpenRouter API** — LLM calls (nvidia/nemotron-3-super-120b-a12b:free)
- **Gmail API** — Email read/send via OAuth 2.0
- **Web Speech API** — Voice input/output for interviews
- **unpdf** — PDF text extraction

### Infrastructure
- **Vercel** — Deployment and hosting
- **Supabase** — Database hosting (Mumbai region for India)
- **GitHub** — Version control

---

## 📁 Project Structure

```
career-pilot-ai/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, signup pages
│   │   ├── (dashboard)/         # All dashboard pages
│   │   │   ├── dashboard/       # Home dashboard
│   │   │   ├── dashboard/profile/
│   │   │   ├── dashboard/resumes/
│   │   │   ├── dashboard/resume-architect/  # Nexus
│   │   │   ├── dashboard/jobs/              # Radar
│   │   │   ├── dashboard/interview/         # Mentor
│   │   │   ├── dashboard/email/             # Hermes
│   │   │   ├── dashboard/roadmap/           # Atlas
│   │   │   └── dashboard/autopilot/         # Aria
│   │   ├── (onboarding)/        # New user onboarding
│   │   ├── api/
│   │   │   ├── agents/          # AI agent API routes
│   │   │   │   ├── resume-architect/
│   │   │   │   ├── job-hunter/
│   │   │   │   ├── interview/
│   │   │   │   └── roadmap/
│   │   │   ├── autopilot/       # Orchestrator routes
│   │   │   ├── email/           # Gmail integration
│   │   │   └── resume/          # Resume operations
│   │   ├── auth/                # OAuth callbacks
│   │   └── help/                # Help & guide page
│   ├── components/
│   │   ├── ui/                  # Base UI components
│   │   ├── auth/                # Auth forms
│   │   ├── dashboard/           # Dashboard components
│   │   ├── onboarding/          # Onboarding wizard
│   │   ├── marketing/           # Landing page
│   │   ├── autopilot/           # Aria's approval UI
│   │   ├── roadmap/             # Atlas's goal/roadmap UI
│   │   ├── interview/           # Mentor's interview room
│   │   ├── resume-architect/    # Nexus's analysis UI
│   │   ├── jobs/                # Radar's job list/cards
│   │   ├── resumes/             # Resume vault UI
│   │   ├── profile/             # Profile tabs
│   │   ├── help/                # Help guide UI
│   │   └── email/               # Hermes's inbox UI
│   ├── lib/
│   │   ├── agents/              # Agent logic modules
│   │   │   ├── job-hunter.ts    # Radar logic
│   │   │   ├── resume-architect.ts  # Nexus logic
│   │   │   ├── interview.ts     # Mentor logic
│   │   │   └── roadmap.ts       # Atlas logic
│   │   ├── ai/
│   │   │   ├── openrouter.ts    # LLM client
│   │   │   ├── prompts/         # AI prompts
│   │   │   └── fallbacks/       # Deterministic fallbacks
│   │   ├── supabase/            # Supabase clients
│   │   ├── gmail.ts             # Gmail API wrapper
│   │   ├── pdf.ts               # PDF generation
│   │   ├── speech.ts            # Web Speech API wrapper
│   │   ├── agent-metadata.ts    # Agent names/icons
│   │   └── animations.ts        # Framer Motion variants
│   └── middleware.ts            # Route protection
├── docs/
│   ├── schema.sql               # Complete DB schema
│   ├── folder-structure.md
│   └── design-system.md
└── .env.local                   # Environment variables
```

---

## 🗄️ Database Schema

CareerPilot uses **22 tables** in Supabase PostgreSQL with Row Level Security on every table:

```
Core Tables:
├── profiles          — User profile data
├── skills            — User skills with proficiency
├── education         — Education history
├── certifications    — Professional certifications
├── job_preferences   — Job search preferences

Resume Tables:
├── resumes           — Resume vault (multiple resumes)
├── resume_analyses   — ATS scoring results
├── cover_letters     — Generated cover letters

Job Tables:
├── job_listings      — Shared job catalog (real scraped jobs)
├── job_applications  — User's applied jobs with status

Interview Tables:
├── interview_sessions    — Mock interview sessions
├── interview_questions   — Generated questions
├── interview_answers     — User answers + AI feedback

Email Tables:
├── emails            — Synced job-related emails
├── oauth_tokens      — Gmail OAuth tokens (encrypted)

Career Tables:
├── career_goals      — User career goals
├── roadmap_steps     — Week-by-week tasks with XP

Autopilot Tables:
├── autopilot_runs      — Orchestration run history
├── autopilot_approvals — Pending/sent drafts
├── autopilot_settings  — User parameters

System Tables:
├── notifications       — In-app notifications
└── agent_activities    — Activity feed logs
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenRouter API key
- Google Cloud project (for Gmail)

### Installation

```bash
# Clone the repository
git clone https://github.com/dhritiraj-08/Career-Pilot-Ai.git
cd Career-Pilot-Ai

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Fill in your values (see Environment Variables section)

# Run the database migrations
# Copy docs/schema.sql and run in Supabase SQL Editor

# Start development server
npm run dev
```

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenRouter (LLM)
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free

# Gmail OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/gmail/callback

# Security
TOKEN_ENCRYPTION_KEY=your_32_byte_base64_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create a new Supabase project
2. Go to SQL Editor
3. Copy the entire contents of `docs/schema.sql`
4. Run the SQL
5. Run the grants migration:

```sql
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
```

---

## 🤖 AI Agent Details

### Nexus (Resume Architect)
- Extracts text from uploaded PDF resumes using `unpdf`
- Scores ATS compatibility against job descriptions
- Generates tailored resume content matching JD keywords
- Creates personalized cover letters
- **Model:** nvidia/nemotron-3-super-120b-a12b:free via OpenRouter
- **Fallback:** Keyword-based heuristic scoring

### Radar (Job Hunter)
- Scrapes WeWorkRemotely RSS feed and RemoteOK API
- Scores jobs by averaging four factors: skills match, role relevance, location preference, and salary range
- Filters India-friendly listings (detects region restrictions)
- **No mock data** — real live job listings only

### Mentor (Interview Coach)
- Generates questions based on resume + JD using LLM
- Uses Web Speech API for voice input/output
- Evaluates answers for technical accuracy, communication, confidence
- Provides per-question feedback and overall score
- Auto-creates sessions when Autopilot approves a job

### Hermes (Email Agent)
- Connects Gmail via OAuth 2.0 (read + send permissions)
- Two-phase email filtering:
  1. Keyword pre-filter (loose)
  2. AI relevance classification (batch of 10 per call)
- Categorizes: Recruiter, Interview Invite, Offer, Rejection, Follow-up
- Generates professional reply drafts using LLM
- **Tokens encrypted** with AES-256-GCM before storage

### Atlas (Career Roadmap)
- Generates week-by-week roadmaps based on career goal
- Considers user's current skills and target role
- XP system for completed tasks
- Auto-creates roadmap when Autopilot approves a job application

### Aria (Autopilot Orchestrator)
- Runs all agents in sequence with one click
- Creates human-in-loop approval drafts
- Respects daily application limits
- Activity feed shows real-time progress
- On approval: sends email + creates interview session + creates roadmap

---

## 🔒 Security

- **Row Level Security** — Every Supabase table has RLS policies
- **Token Encryption** — Gmail OAuth tokens encrypted with AES-256-GCM
- **No Auto-Send** — Every email requires explicit user approval
- **Auth Protection** — All dashboard routes require authentication
- **Service Role** — Only used server-side, never exposed to client
- **No Credential Logging** — Email content never logged to console

---

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with agent showcase |
| `/login` | Sign in / Sign up |
| `/onboarding` | New user setup wizard |
| `/dashboard` | Home with stats and agent overview |
| `/dashboard/profile` | Profile management |
| `/dashboard/resumes` | Resume vault |
| `/dashboard/resume-architect` | Nexus — Resume builder |
| `/dashboard/jobs` | Radar — Job discovery |
| `/dashboard/interview` | Mentor — Mock interviews |
| `/dashboard/email` | Hermes — Email management |
| `/dashboard/roadmap` | Atlas — Career roadmap |
| `/dashboard/autopilot` | Aria — One-click automation |
| `/help` | Complete user guide |

---

## 🎨 Design System

- **Background:** `#080B14` (deep blue-black)
- **Cards:** `#0F1320` with border `#1E2433`
- **Primary:** `#7C5CFC` (violet)
- **Secondary:** `#00D4FF` (cyan)
- **Success:** `#10B981`
- **Warning:** `#F59E0B`
- **Error:** `#EF4444`

**Typography:**
- Headings: Space Grotesk
- Body: Inter
- Numbers/Code: JetBrains Mono

---

## 🙏 Acknowledgements

- [OpenRouter](https://openrouter.ai) — Free LLM API access
- [Supabase](https://supabase.com) — Backend infrastructure
- [Vercel](https://vercel.com) — Deployment platform
- [WeWorkRemotely](https://weworkremotely.com) — Job listings
- [RemoteOK](https://remoteok.com) — Job listings
- [Shadcn/ui](https://ui.shadcn.com) — UI components

---

## 📄 License

MIT License — feel free to use this project for learning and building.

---

## 👨‍💻 Built By

**Dhritiraj Lahakar**
- B.Tech CSE (AI & ML), Jain University, Bengaluru
- [GitHub](https://github.com/dhritiraj-08)
- [LinkedIn](https://linkedin.com/in/dhritiraj-lahakar)

---

<p align="center">
  Built with ❤️ for Indian job seekers
  <br/>
  <a href="https://career-pilot-ai-sepia-pi.vercel.app">Try CareerPilot AI →</a>
</p>
