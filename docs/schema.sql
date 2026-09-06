-- =====================================================================
-- CareerPilot AI — Complete Database Schema
-- Target: Supabase (PostgreSQL 15+)
-- Run this once against a fresh Supabase project (SQL Editor or CLI).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- Shared helper: auto-update `updated_at` on row change
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. profiles
-- =====================================================================
create table public.profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  full_name         text,
  email             text,
  phone             text,
  avatar_url        text,
  bio               text,
  location          text,
  city              text,
  github_url        text,
  linkedin_url      text,
  portfolio_url     text,
  years_experience  numeric(4,1) default 0,
  current_job_role  text,
  current_company   text,
  xp                int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index idx_profiles_user_id on public.profiles(user_id);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 2. skills
-- =====================================================================
create table public.skills (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  level       text not null default 'beginner'
              check (level in ('beginner', 'intermediate', 'advanced', 'expert')),
  category    text,
  created_at  timestamptz not null default now()
);

create index idx_skills_user_id on public.skills(user_id);

alter table public.skills enable row level security;

create policy "skills_select_own" on public.skills
  for select using (auth.uid() = user_id);
create policy "skills_insert_own" on public.skills
  for insert with check (auth.uid() = user_id);
create policy "skills_update_own" on public.skills
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "skills_delete_own" on public.skills
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 3. education
-- =====================================================================
create table public.education (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  institution  text not null,
  degree       text,
  field        text,
  start_date   date,
  end_date     date,
  grade        text,
  description  text,
  created_at   timestamptz not null default now()
);

create index idx_education_user_id on public.education(user_id);

alter table public.education enable row level security;

create policy "education_select_own" on public.education
  for select using (auth.uid() = user_id);
create policy "education_insert_own" on public.education
  for insert with check (auth.uid() = user_id);
create policy "education_update_own" on public.education
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "education_delete_own" on public.education
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 4. certifications
-- =====================================================================
create table public.certifications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  issuer           text,
  issue_date       date,
  expiry_date      date,
  credential_url   text,
  created_at       timestamptz not null default now()
);

create index idx_certifications_user_id on public.certifications(user_id);

alter table public.certifications enable row level security;

create policy "certifications_select_own" on public.certifications
  for select using (auth.uid() = user_id);
create policy "certifications_insert_own" on public.certifications
  for insert with check (auth.uid() = user_id);
create policy "certifications_update_own" on public.certifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "certifications_delete_own" on public.certifications
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 5. job_preferences  (one row per user)
-- =====================================================================
create table public.job_preferences (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null unique references auth.users(id) on delete cascade,
  target_roles           text[] not null default '{}',
  target_fields          text[] not null default '{}',
  min_salary             numeric(12,2),
  max_salary             numeric(12,2),
  currency               text not null default 'INR',
  work_mode              text check (work_mode in ('remote', 'hybrid', 'onsite', 'any')),
  preferred_locations    text[] not null default '{}',
  preferred_countries    text[] not null default '{}',
  notice_period          text,
  job_search_status      text not null default 'active'
                         check (job_search_status in ('active', 'passive', 'not_looking')),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index idx_job_preferences_user_id on public.job_preferences(user_id);

create trigger trg_job_preferences_updated_at
  before update on public.job_preferences
  for each row execute function public.set_updated_at();

alter table public.job_preferences enable row level security;

create policy "job_preferences_select_own" on public.job_preferences
  for select using (auth.uid() = user_id);
create policy "job_preferences_insert_own" on public.job_preferences
  for insert with check (auth.uid() = user_id);
create policy "job_preferences_update_own" on public.job_preferences
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "job_preferences_delete_own" on public.job_preferences
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 6. resumes
-- =====================================================================
create table public.resumes (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  file_url         text,
  parsed_content   jsonb,
  is_primary       boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_resumes_user_id on public.resumes(user_id);

create trigger trg_resumes_updated_at
  before update on public.resumes
  for each row execute function public.set_updated_at();

alter table public.resumes enable row level security;

create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);
create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);
create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 7. resume_analyses
-- =====================================================================
create table public.resume_analyses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  resume_id           uuid not null references public.resumes(id) on delete cascade,
  target_role         text,
  ats_score           int check (ats_score between 0 and 100),
  scoring_breakdown   jsonb,
  strengths           text[] not null default '{}',
  weaknesses          text[] not null default '{}',
  recommendations     text[] not null default '{}',
  keywords_found      text[] not null default '{}',
  keywords_missing    text[] not null default '{}',
  created_at          timestamptz not null default now()
);

create index idx_resume_analyses_user_id on public.resume_analyses(user_id);
create index idx_resume_analyses_resume_id on public.resume_analyses(resume_id);

alter table public.resume_analyses enable row level security;

create policy "resume_analyses_select_own" on public.resume_analyses
  for select using (auth.uid() = user_id);
create policy "resume_analyses_insert_own" on public.resume_analyses
  for insert with check (auth.uid() = user_id);
create policy "resume_analyses_update_own" on public.resume_analyses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "resume_analyses_delete_own" on public.resume_analyses
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 8. cover_letters
-- =====================================================================
create table public.cover_letters (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  resume_id          uuid references public.resumes(id) on delete set null,
  target_role        text,
  target_company     text,
  job_description    text,
  content            text,
  created_at         timestamptz not null default now()
);

create index idx_cover_letters_user_id on public.cover_letters(user_id);
create index idx_cover_letters_resume_id on public.cover_letters(resume_id);

alter table public.cover_letters enable row level security;

create policy "cover_letters_select_own" on public.cover_letters
  for select using (auth.uid() = user_id);
create policy "cover_letters_insert_own" on public.cover_letters
  for insert with check (auth.uid() = user_id);
create policy "cover_letters_update_own" on public.cover_letters
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cover_letters_delete_own" on public.cover_letters
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 9. job_listings
-- Shared catalogue populated by the Job Hunter agent (service role).
-- NOT user-owned — every authenticated user may read active listings;
-- only the service role (which bypasses RLS) writes to this table.
-- =====================================================================
create table public.job_listings (
  id             uuid primary key default gen_random_uuid(),
  source         text not null,
  external_id    text not null,
  title          text not null,
  company        text not null,
  location       text,
  job_type       text check (job_type in ('full_time', 'part_time', 'internship', 'contract', 'freelance')),
  salary_min     numeric(12,2),
  salary_max     numeric(12,2),
  currency       text not null default 'INR',
  description    text,
  requirements   text[] not null default '{}',
  apply_url      text,
  posted_at      timestamptz,
  discovered_at  timestamptz not null default now(),
  is_active      boolean not null default true,
  unique (source, external_id)
);

create index idx_job_listings_is_active on public.job_listings(is_active);
create index idx_job_listings_posted_at on public.job_listings(posted_at desc);

alter table public.job_listings enable row level security;

-- Any authenticated user can browse active listings.
create policy "job_listings_select_authenticated" on public.job_listings
  for select using (auth.role() = 'authenticated');

-- No insert/update/delete policy is defined for regular users, so all
-- writes are denied by default under RLS. The Job Hunter agent writes
-- using the Supabase service-role key, which bypasses RLS entirely.


-- =====================================================================
-- 10. job_applications
-- =====================================================================
create table public.job_applications (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  job_listing_id     uuid references public.job_listings(id) on delete set null,
  resume_id          uuid references public.resumes(id) on delete set null,
  status             text not null default 'saved'
                     check (status in ('saved', 'applied', 'interviewing', 'offer', 'rejected', 'withdrawn')),
  applied_at         timestamptz,
  cover_letter_id    uuid references public.cover_letters(id) on delete set null,
  notes              text,
  match_score        int check (match_score between 0 and 100),
  missing_skills     text[] not null default '{}',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- One row per (user, listing): Save/Apply upsert against this pair
  -- (job_listing_id null rows, e.g. manually-tracked applications, are
  -- exempt — Postgres treats NULLs as distinct for uniqueness).
  unique (user_id, job_listing_id)
);

create index idx_job_applications_user_id on public.job_applications(user_id);
create index idx_job_applications_job_listing_id on public.job_applications(job_listing_id);
create index idx_job_applications_status on public.job_applications(status);

create trigger trg_job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

alter table public.job_applications enable row level security;

create policy "job_applications_select_own" on public.job_applications
  for select using (auth.uid() = user_id);
create policy "job_applications_insert_own" on public.job_applications
  for insert with check (auth.uid() = user_id);
create policy "job_applications_update_own" on public.job_applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "job_applications_delete_own" on public.job_applications
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 11. interview_sessions
-- =====================================================================
create table public.interview_sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  resume_id           uuid references public.resumes(id) on delete set null,
  job_title           text,
  company             text,
  job_description     text,
  status              text not null default 'scheduled'
                      check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  overall_score       int check (overall_score between 0 and 100),
  technical_score     int check (technical_score between 0 and 100),
  communication_score int check (communication_score between 0 and 100),
  aptitude_score      int check (aptitude_score between 0 and 100),
  feedback_summary    text,
  duration_minutes    int,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

create index idx_interview_sessions_user_id on public.interview_sessions(user_id);

alter table public.interview_sessions enable row level security;

create policy "interview_sessions_select_own" on public.interview_sessions
  for select using (auth.uid() = user_id);
create policy "interview_sessions_insert_own" on public.interview_sessions
  for insert with check (auth.uid() = user_id);
create policy "interview_sessions_update_own" on public.interview_sessions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "interview_sessions_delete_own" on public.interview_sessions
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 12. interview_questions
-- No direct user_id — ownership is derived through interview_sessions.
-- =====================================================================
create table public.interview_questions (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references public.interview_sessions(id) on delete cascade,
  question       text not null,
  question_type  text check (question_type in ('technical', 'behavioral', 'aptitude', 'hr')),
  order_index    int not null default 0,
  created_at     timestamptz not null default now()
);

create index idx_interview_questions_session_id on public.interview_questions(session_id);

alter table public.interview_questions enable row level security;

create policy "interview_questions_select_own" on public.interview_questions
  for select using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_questions.session_id and s.user_id = auth.uid()
    )
  );
create policy "interview_questions_insert_own" on public.interview_questions
  for insert with check (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_questions.session_id and s.user_id = auth.uid()
    )
  );
create policy "interview_questions_update_own" on public.interview_questions
  for update using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_questions.session_id and s.user_id = auth.uid()
    )
  );
create policy "interview_questions_delete_own" on public.interview_questions
  for delete using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_questions.session_id and s.user_id = auth.uid()
    )
  );


-- =====================================================================
-- 13. interview_answers
-- No direct user_id — ownership is derived through interview_sessions.
-- =====================================================================
create table public.interview_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.interview_sessions(id) on delete cascade,
  question_id   uuid not null references public.interview_questions(id) on delete cascade,
  answer_text   text,
  audio_url     text,
  score         int check (score between 0 and 100),
  feedback      text,
  created_at    timestamptz not null default now()
);

create index idx_interview_answers_session_id on public.interview_answers(session_id);
create index idx_interview_answers_question_id on public.interview_answers(question_id);

alter table public.interview_answers enable row level security;

create policy "interview_answers_select_own" on public.interview_answers
  for select using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_answers.session_id and s.user_id = auth.uid()
    )
  );
create policy "interview_answers_insert_own" on public.interview_answers
  for insert with check (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_answers.session_id and s.user_id = auth.uid()
    )
  );
create policy "interview_answers_update_own" on public.interview_answers
  for update using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_answers.session_id and s.user_id = auth.uid()
    )
  );
create policy "interview_answers_delete_own" on public.interview_answers
  for delete using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_answers.session_id and s.user_id = auth.uid()
    )
  );


-- =====================================================================
-- 14. emails
-- =====================================================================
create table public.emails (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  job_application_id   uuid references public.job_applications(id) on delete set null,
  -- Original set covered emails the app itself drafts/sends. The Email
  -- Agent's inbox categories need four more for what Gmail sync
  -- classifies incoming mail as — added rather than reusing 'received'
  -- for all of them, since "Recruiter Emails / Interview Invites /
  -- Offer Letters / Rejections" are each their own filter bucket in
  -- the UI, not one undifferentiated pile.
  type                 text not null
                       check (type in ('application', 'follow_up', 'thank_you', 'offer_response', 'received', 'other', 'recruiter_outreach', 'interview_invite', 'offer', 'rejection')),
  subject              text,
  body                 text,
  recipient            text,
  sender               text,
  -- Sender's actual address (sender can just be a display name) —
  -- needed to reply to the right address and isn't derivable from
  -- sender alone.
  sender_email         text,
  status               text not null default 'draft'
                       check (status in ('draft', 'sent', 'failed', 'received')),
  sent_at              timestamptz,
  received_at          timestamptz,
  -- Set only for rows synced from Gmail (never for app-drafted/sent
  -- mail) — gmail_message_id dedups repeat syncs, gmail_thread_id
  -- carries the thread forward when replying.
  gmail_message_id     text,
  gmail_thread_id      text,
  created_at           timestamptz not null default now()
);

create index idx_emails_user_id on public.emails(user_id);
create index idx_emails_job_application_id on public.emails(job_application_id);
create unique index idx_emails_user_gmail_message on public.emails(user_id, gmail_message_id) where gmail_message_id is not null;

alter table public.emails enable row level security;

create policy "emails_select_own" on public.emails
  for select using (auth.uid() = user_id);
create policy "emails_insert_own" on public.emails
  for insert with check (auth.uid() = user_id);
create policy "emails_update_own" on public.emails
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "emails_delete_own" on public.emails
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 14b. oauth_tokens
-- One row per (user, provider) — Gmail today, structured to allow
-- other providers later without a schema change. access_token and
-- refresh_token are stored encrypted at rest (see lib/crypto.ts) —
-- RLS is the second layer, not the only one, since these are live
-- credentials to the user's real inbox.
-- =====================================================================
create table public.oauth_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider        text not null check (provider in ('gmail')),
  access_token    text not null,
  refresh_token   text not null,
  token_expiry    timestamptz not null,
  email           text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, provider)
);

create index idx_oauth_tokens_user_id on public.oauth_tokens(user_id);

create trigger trg_oauth_tokens_updated_at
  before update on public.oauth_tokens
  for each row execute function public.set_updated_at();

alter table public.oauth_tokens enable row level security;

create policy "oauth_tokens_select_own" on public.oauth_tokens
  for select using (auth.uid() = user_id);
create policy "oauth_tokens_insert_own" on public.oauth_tokens
  for insert with check (auth.uid() = user_id);
create policy "oauth_tokens_update_own" on public.oauth_tokens
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "oauth_tokens_delete_own" on public.oauth_tokens
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 15. career_goals
-- =====================================================================
create table public.career_goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  description    text,
  target_date    date,
  status         text not null default 'not_started'
                 check (status in ('not_started', 'in_progress', 'completed', 'abandoned')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_career_goals_user_id on public.career_goals(user_id);

create trigger trg_career_goals_updated_at
  before update on public.career_goals
  for each row execute function public.set_updated_at();

alter table public.career_goals enable row level security;

create policy "career_goals_select_own" on public.career_goals
  for select using (auth.uid() = user_id);
create policy "career_goals_insert_own" on public.career_goals
  for insert with check (auth.uid() = user_id);
create policy "career_goals_update_own" on public.career_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "career_goals_delete_own" on public.career_goals
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 16. roadmap_steps
-- user_id is denormalized from career_goals for simple, direct RLS.
-- =====================================================================
create table public.roadmap_steps (
  id             uuid primary key default gen_random_uuid(),
  goal_id        uuid not null references public.career_goals(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  title          text not null,
  description    text,
  order_index    int not null default 0,
  status         text not null default 'not_started'
                 check (status in ('not_started', 'in_progress', 'completed', 'skipped')),
  due_date       date,
  completed_at   timestamptz,
  -- One roadmap_steps row is one task; week_number groups tasks into
  -- the "week by week" view and focus_area is that week's theme,
  -- denormalized onto every task row in it rather than a separate
  -- weeks table (see docs on the Roadmap agent).
  week_number    int,
  focus_area     text,
  created_at     timestamptz not null default now()
);

create index idx_roadmap_steps_user_id on public.roadmap_steps(user_id);
create index idx_roadmap_steps_goal_id on public.roadmap_steps(goal_id);

alter table public.roadmap_steps enable row level security;

create policy "roadmap_steps_select_own" on public.roadmap_steps
  for select using (auth.uid() = user_id);
create policy "roadmap_steps_insert_own" on public.roadmap_steps
  for insert with check (auth.uid() = user_id);
create policy "roadmap_steps_update_own" on public.roadmap_steps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "roadmap_steps_delete_own" on public.roadmap_steps
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 17. agent_activities
-- Audit log of autonomous agent actions, surfaced in the dashboard.
-- =====================================================================
create table public.agent_activities (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  agent_name    text not null
                check (agent_name in ('resume_architect', 'job_hunter', 'email_agent', 'interview_agent', 'orchestrator')),
  action        text not null,
  status        text not null default 'running'
                check (status in ('running', 'success', 'failed')),
  details       jsonb,
  created_at    timestamptz not null default now()
);

create index idx_agent_activities_user_id on public.agent_activities(user_id);
create index idx_agent_activities_created_at on public.agent_activities(created_at desc);

alter table public.agent_activities enable row level security;

create policy "agent_activities_select_own" on public.agent_activities
  for select using (auth.uid() = user_id);
create policy "agent_activities_insert_own" on public.agent_activities
  for insert with check (auth.uid() = user_id);
create policy "agent_activities_update_own" on public.agent_activities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agent_activities_delete_own" on public.agent_activities
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 18. notifications
-- =====================================================================
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  message       text,
  type          text not null default 'info'
                check (type in ('info', 'success', 'warning', 'error')),
  is_read       boolean not null default false,
  link          text,
  created_at    timestamptz not null default now()
);

create index idx_notifications_user_id on public.notifications(user_id);
create index idx_notifications_is_read on public.notifications(is_read);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_insert_own" on public.notifications
  for insert with check (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 19. autopilot_runs
-- One row per "Run Career Autopilot" click (or scheduled run) — the
-- top-level record the status panel and activity feed hang off of.
-- =====================================================================
create table public.autopilot_runs (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  status             text not null default 'running'
                     check (status in ('running', 'completed', 'failed', 'paused')),
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  jobs_found         int not null default 0,
  drafts_created     int not null default 0,
  applications_sent  int not null default 0,
  error_message      text,
  created_at         timestamptz not null default now()
);

create index idx_autopilot_runs_user_id on public.autopilot_runs(user_id);
create index idx_autopilot_runs_started_at on public.autopilot_runs(started_at desc);

alter table public.autopilot_runs enable row level security;

create policy "autopilot_runs_select_own" on public.autopilot_runs
  for select using (auth.uid() = user_id);
create policy "autopilot_runs_insert_own" on public.autopilot_runs
  for insert with check (auth.uid() = user_id);
create policy "autopilot_runs_update_own" on public.autopilot_runs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "autopilot_runs_delete_own" on public.autopilot_runs
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 20. autopilot_approvals
-- One row per human-in-the-loop decision the orchestrator is waiting
-- on — a drafted application email, interview reply, or follow-up.
-- Nothing under type job_application/interview_reply/followup is ever
-- sent to Gmail until this row's status flips to 'approved'.
-- =====================================================================
create table public.autopilot_approvals (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  run_id                uuid references public.autopilot_runs(id) on delete cascade,
  type                  text not null
                        check (type in ('job_application', 'interview_reply', 'followup')),
  status                text not null default 'pending'
                        check (status in ('pending', 'approved', 'rejected', 'sent')),
  job_listing_id        uuid references public.job_listings(id) on delete set null,
  job_application_id    uuid references public.job_applications(id) on delete set null,
  email_draft_subject   text,
  email_draft_body      text,
  email_to              text,
  resume_id             uuid references public.resumes(id) on delete set null,
  context               jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index idx_autopilot_approvals_user_id on public.autopilot_approvals(user_id);
create index idx_autopilot_approvals_run_id on public.autopilot_approvals(run_id);
create index idx_autopilot_approvals_status on public.autopilot_approvals(status);

create trigger trg_autopilot_approvals_updated_at
  before update on public.autopilot_approvals
  for each row execute function public.set_updated_at();

alter table public.autopilot_approvals enable row level security;

create policy "autopilot_approvals_select_own" on public.autopilot_approvals
  for select using (auth.uid() = user_id);
create policy "autopilot_approvals_insert_own" on public.autopilot_approvals
  for insert with check (auth.uid() = user_id);
create policy "autopilot_approvals_update_own" on public.autopilot_approvals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "autopilot_approvals_delete_own" on public.autopilot_approvals
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- 21. autopilot_settings  (one row per user)
-- =====================================================================
create table public.autopilot_settings (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null unique references auth.users(id) on delete cascade,
  min_match_score            int not null default 70 check (min_match_score between 50 and 95),
  max_applications_per_day   int not null default 5 check (max_applications_per_day between 1 and 10),
  auto_schedule              text not null default 'manual'
                             check (auto_schedule in ('manual', 'daily', 'weekly')),
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

create index idx_autopilot_settings_user_id on public.autopilot_settings(user_id);

create trigger trg_autopilot_settings_updated_at
  before update on public.autopilot_settings
  for each row execute function public.set_updated_at();

alter table public.autopilot_settings enable row level security;

create policy "autopilot_settings_select_own" on public.autopilot_settings
  for select using (auth.uid() = user_id);
create policy "autopilot_settings_insert_own" on public.autopilot_settings
  for insert with check (auth.uid() = user_id);
create policy "autopilot_settings_update_own" on public.autopilot_settings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "autopilot_settings_delete_own" on public.autopilot_settings
  for delete using (auth.uid() = user_id);


-- =====================================================================
-- Grants
--
-- RLS policies above are the *second* gate: Postgres checks base table
-- GRANTs first, and only evaluates RLS if that passes. Supabase's
-- dashboard Table Editor applies these grants automatically when you
-- create a table through it; raw SQL run through the SQL Editor (like
-- this file) does not — without this section every request from
-- `anon`/`authenticated` gets a blanket "permission denied" before RLS
-- is ever consulted, and even `service_role` (which bypasses RLS via
-- its BYPASSRLS attribute) still needs these base grants first.
-- =====================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

-- Applies the same grants to any table/sequence/function created later,
-- so this doesn't have to be remembered and re-run for future tables.
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;

-- =====================================================================
-- Migration: job_applications unique(user_id, job_listing_id)
--
-- Added when building the Job Hunter agent (Save/Apply need to upsert
-- against this pair to avoid duplicate rows for the same job). The
-- create table statement above now includes it for fresh installs —
-- if you already ran schema.sql before this, run this once against
-- your existing database (safe if the table is still empty; if you've
-- already got duplicate (user_id, job_listing_id) rows from testing,
-- deduplicate those first or this will fail):
--
--   alter table public.job_applications
--     add constraint job_applications_user_id_job_listing_id_key
--     unique (user_id, job_listing_id);
-- =====================================================================

-- =====================================================================
-- Migration: profiles.xp, roadmap_steps.week_number/focus_area
--
-- Added when building the Career Roadmap agent. profiles.xp powers the
-- XP awarded when a roadmap task is marked complete; roadmap_steps'
-- two new columns group tasks into the "week by week" timeline (see
-- the roadmap_steps comment above). The create table statements above
-- now include all three for fresh installs — if you already ran
-- schema.sql before this, run this once against your existing
-- database BEFORE using the Roadmap feature. week_number/focus_area
-- are required — roadmap creation writes them on every task row, so
-- it fails outright without this migration. xp is the one part of
-- this that degrades gracefully on its own (task completion still
-- works, XP awarding is skipped and logged instead of failing the
-- request) since it's a separate, non-critical update:
--
--   alter table public.profiles add column if not exists xp int not null default 0;
--   alter table public.roadmap_steps add column if not exists week_number int;
--   alter table public.roadmap_steps add column if not exists focus_area text;
-- =====================================================================

-- =====================================================================
-- Migration: oauth_tokens table, emails Gmail-sync columns/categories
--
-- Added when building the Email Agent. REQUIRED before using it —
-- unlike some earlier migrations this one has no graceful fallback:
-- connecting Gmail writes to oauth_tokens directly, and syncing writes
-- gmail_message_id/gmail_thread_id on every row, so both fail outright
-- without this. If you already ran schema.sql before this, run once
-- against your existing database:
--
--   create table if not exists public.oauth_tokens (
--     id              uuid primary key default gen_random_uuid(),
--     user_id         uuid not null references auth.users(id) on delete cascade,
--     provider        text not null check (provider in ('gmail')),
--     access_token    text not null,
--     refresh_token   text not null,
--     token_expiry    timestamptz not null,
--     email           text not null,
--     created_at      timestamptz not null default now(),
--     updated_at      timestamptz not null default now(),
--     unique (user_id, provider)
--   );
--   create index if not exists idx_oauth_tokens_user_id on public.oauth_tokens(user_id);
--   alter table public.oauth_tokens enable row level security;
--   create policy "oauth_tokens_select_own" on public.oauth_tokens
--     for select using (auth.uid() = user_id);
--   create policy "oauth_tokens_insert_own" on public.oauth_tokens
--     for insert with check (auth.uid() = user_id);
--   create policy "oauth_tokens_update_own" on public.oauth_tokens
--     for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   create policy "oauth_tokens_delete_own" on public.oauth_tokens
--     for delete using (auth.uid() = user_id);
--   create trigger trg_oauth_tokens_updated_at
--     before update on public.oauth_tokens
--     for each row execute function public.set_updated_at();
--
--   alter table public.emails add column if not exists sender_email text;
--   alter table public.emails add column if not exists gmail_message_id text;
--   alter table public.emails add column if not exists gmail_thread_id text;
--   create unique index if not exists idx_emails_user_gmail_message
--     on public.emails(user_id, gmail_message_id) where gmail_message_id is not null;
--   alter table public.emails drop constraint emails_type_check;
--   alter table public.emails add constraint emails_type_check
--     check (type in ('application', 'follow_up', 'thank_you', 'offer_response', 'received', 'other', 'recruiter_outreach', 'interview_invite', 'offer', 'rejection'));
-- =====================================================================

-- =====================================================================
-- Migration: autopilot_runs, autopilot_approvals, autopilot_settings
--
-- Added when building the Master Orchestrator (Autopilot). REQUIRED —
-- no graceful fallback: /api/autopilot/run writes an autopilot_runs row
-- before doing anything else and an autopilot_approvals row per
-- matched job, and the Autopilot page reads autopilot_settings on
-- load, so all three fail outright without this. agent_activities
-- already allowed 'orchestrator' as an agent_name from the original
-- schema design — no change needed there. If you already ran
-- schema.sql before this, run once against your existing database:
--
--   create table if not exists public.autopilot_runs (
--     id                 uuid primary key default gen_random_uuid(),
--     user_id            uuid not null references auth.users(id) on delete cascade,
--     status             text not null default 'running'
--                        check (status in ('running', 'completed', 'failed', 'paused')),
--     started_at         timestamptz not null default now(),
--     completed_at       timestamptz,
--     jobs_found         int not null default 0,
--     drafts_created     int not null default 0,
--     applications_sent  int not null default 0,
--     error_message      text,
--     created_at         timestamptz not null default now()
--   );
--   create index if not exists idx_autopilot_runs_user_id on public.autopilot_runs(user_id);
--   create index if not exists idx_autopilot_runs_started_at on public.autopilot_runs(started_at desc);
--   alter table public.autopilot_runs enable row level security;
--   create policy "autopilot_runs_select_own" on public.autopilot_runs
--     for select using (auth.uid() = user_id);
--   create policy "autopilot_runs_insert_own" on public.autopilot_runs
--     for insert with check (auth.uid() = user_id);
--   create policy "autopilot_runs_update_own" on public.autopilot_runs
--     for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   create policy "autopilot_runs_delete_own" on public.autopilot_runs
--     for delete using (auth.uid() = user_id);
--
--   create table if not exists public.autopilot_approvals (
--     id                    uuid primary key default gen_random_uuid(),
--     user_id               uuid not null references auth.users(id) on delete cascade,
--     run_id                uuid references public.autopilot_runs(id) on delete cascade,
--     type                  text not null
--                           check (type in ('job_application', 'interview_reply', 'followup')),
--     status                text not null default 'pending'
--                           check (status in ('pending', 'approved', 'rejected', 'sent')),
--     job_listing_id        uuid references public.job_listings(id) on delete set null,
--     job_application_id    uuid references public.job_applications(id) on delete set null,
--     email_draft_subject   text,
--     email_draft_body      text,
--     email_to              text,
--     resume_id             uuid references public.resumes(id) on delete set null,
--     context               jsonb,
--     created_at            timestamptz not null default now(),
--     updated_at            timestamptz not null default now()
--   );
--   create index if not exists idx_autopilot_approvals_user_id on public.autopilot_approvals(user_id);
--   create index if not exists idx_autopilot_approvals_run_id on public.autopilot_approvals(run_id);
--   create index if not exists idx_autopilot_approvals_status on public.autopilot_approvals(status);
--   alter table public.autopilot_approvals enable row level security;
--   create policy "autopilot_approvals_select_own" on public.autopilot_approvals
--     for select using (auth.uid() = user_id);
--   create policy "autopilot_approvals_insert_own" on public.autopilot_approvals
--     for insert with check (auth.uid() = user_id);
--   create policy "autopilot_approvals_update_own" on public.autopilot_approvals
--     for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   create policy "autopilot_approvals_delete_own" on public.autopilot_approvals
--     for delete using (auth.uid() = user_id);
--   create trigger trg_autopilot_approvals_updated_at
--     before update on public.autopilot_approvals
--     for each row execute function public.set_updated_at();
--
--   create table if not exists public.autopilot_settings (
--     id                         uuid primary key default gen_random_uuid(),
--     user_id                    uuid not null unique references auth.users(id) on delete cascade,
--     min_match_score            int not null default 70 check (min_match_score between 50 and 95),
--     max_applications_per_day   int not null default 5 check (max_applications_per_day between 1 and 10),
--     auto_schedule              text not null default 'manual'
--                                check (auto_schedule in ('manual', 'daily', 'weekly')),
--     created_at                 timestamptz not null default now(),
--     updated_at                 timestamptz not null default now()
--   );
--   create index if not exists idx_autopilot_settings_user_id on public.autopilot_settings(user_id);
--   alter table public.autopilot_settings enable row level security;
--   create policy "autopilot_settings_select_own" on public.autopilot_settings
--     for select using (auth.uid() = user_id);
--   create policy "autopilot_settings_insert_own" on public.autopilot_settings
--     for insert with check (auth.uid() = user_id);
--   create policy "autopilot_settings_update_own" on public.autopilot_settings
--     for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
--   create policy "autopilot_settings_delete_own" on public.autopilot_settings
--     for delete using (auth.uid() = user_id);
--   create trigger trg_autopilot_settings_updated_at
--     before update on public.autopilot_settings
--     for each row execute function public.set_updated_at();
-- =====================================================================

-- =====================================================================
-- End of schema
-- =====================================================================
