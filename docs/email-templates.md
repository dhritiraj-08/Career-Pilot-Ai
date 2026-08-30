# Supabase Email Templates — required setup

CareerPilot AI has two sign-in paths that share these templates:
- Email OTP (no password): users type a 6-digit code OR click the link
  in the same email — both must work.
- Email + password (primary as of the password-auth phase): signup
  still sends one confirmation email (same "Confirm signup" template,
  since `supabase.auth.signUp()` and OTP's `shouldCreateUser: true`
  both trigger it); password reset uses a third template below.

Supabase's default templates don't produce any of this correctly out
of the box. Run through this once per environment (local + any
deployed project).

## Why this is needed

- **No visible 6-digit code**: the default templates only include
  `{{ .ConfirmationURL }}` (the link), not `{{ .Token }}` (the code).
  Add `{{ .Token }}` to see the code in the email.
- **Clicking the link does nothing**: the default `{{ .ConfirmationURL }}`
  points at Supabase's own hosted verify endpoint, which — after
  verifying server-side — redirects to your app. Without an explicit
  `emailRedirectTo` on the `signInWithOtp` call (set in
  `login-form.tsx`), that redirect lands on the bare Site URL, not
  `/auth/callback`, so the app never processes it. Using the explicit
  link format below avoids depending on that hosted-redirect hop at
  all — Supabase's default template flow.

## Site URL / Redirect URLs (Dashboard → Authentication → URL Configuration)

- **Site URL**: `http://localhost:3000` (your real domain in production)
- **Redirect URLs**: add `http://localhost:3000/**`

## Templates to edit (Dashboard → Authentication → Email Templates)

Two templates need this — **"Confirm signup"** fires for a brand-new
email address (first-ever sign-in); **"Magic Link"** fires for a
returning one. Both need the same shape, or one of the two paths keeps
producing a link-only email with no code.

Replace each template's body with:

```html
<h2>Your CareerPilot AI sign-in code</h2>
<p>Enter this code to sign in:</p>
<p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">{{ .Token }}</p>
<p>Or click this link:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Sign in to CareerPilot AI</a></p>
```

For the **"Confirm signup"** template specifically, change `type=email`
to `type=signup` in the link (the `type` param must match what
`verifyOtp` in `src/app/auth/callback/route.ts` is asked to verify).
This same template now also fires for email/password sign-ups — the
`{{ .Token }}` code just isn't needed for that flow, only the link;
harmless to leave it in the email either way.

## Third template: "Reset Password"

Password recovery needs its own template (Dashboard → Authentication →
Email Templates → **"Reset Password"**). Unlike the two above, there's
no code to type here — link only, since `updateUser({ password })`
needs an actual recovery session established server-side, not a
typed token compared client-side:

```html
<h2>Reset your CareerPilot AI password</h2>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

`type=recovery` is what tells `src/app/auth/callback/route.ts` to
redirect to `/auth/reset-password` instead of the normal dashboard/
onboarding logic once verified.

## Verifying it worked

1. Sign in with a brand-new email → the email should show a 6-digit
   code *and* a working link.
2. Type the code into the app's OTP boxes → should sign in.
3. Instead, click the link in a fresh test → should also sign in,
   landing on `/onboarding` (new user) or `/dashboard` (existing user,
   i.e. a `job_preferences` row already exists).
4. If a link click ever fails, check the server logs for
   `[auth/callback]` lines — the route logs exactly why verification
   failed (see `src/app/auth/callback/route.ts`).
5. Sign up with email + password (new email) → should get one
   confirmation email; clicking it lands on `/onboarding`.
6. Sign in with email + password (existing account) → straight to
   `/dashboard` (or `/onboarding` if `job_preferences` doesn't exist
   yet), no email round-trip at all.
7. Click "Forgot password?" → submit an existing email → click the
   reset link in the email → should land on `/auth/reset-password`
   with an active session, not the dashboard.
