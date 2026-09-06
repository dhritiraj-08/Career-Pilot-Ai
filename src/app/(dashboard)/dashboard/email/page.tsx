import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { computeDailyDigest } from "@/lib/email-digest";
import { EmailClient } from "@/components/email/email-client";

const EMAIL_LIMIT = 200;

export default async function EmailPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: gmailToken }, { data: emailRows }, { data: applicationRows }] = await Promise.all([
    supabase.from("oauth_tokens").select("email").eq("user_id", user.id).eq("provider", "gmail").maybeSingle(),
    supabase
      .from("emails")
      .select("id, type, status, subject, body, sender, sender_email, recipient, gmail_thread_id, received_at, sent_at, created_at")
      .eq("user_id", user.id)
      .order("received_at", { ascending: false, nullsFirst: false })
      .limit(EMAIL_LIMIT),
    supabase
      .from("job_applications")
      .select("id, status, applied_at, job_listings(company)")
      .eq("user_id", user.id),
  ]);

  const jobApplications = (applicationRows ?? []).map((a) => ({
    id: a.id,
    status: a.status,
    applied_at: a.applied_at,
    // Supabase's embedded-resource typing calls this an array even
    // for a to-one relationship without an explicit FK uniqueness hint
    // — same shape quirk already handled this way in the Job Hunter
    // and Interview routes.
    company: Array.isArray(a.job_listings) ? a.job_listings[0]?.company ?? null : (a.job_listings as { company: string } | null)?.company ?? null,
  }));

  const digest = computeDailyDigest(emailRows ?? [], jobApplications);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-foreground">Email Agent</h1>
      <EmailClient
        connectedEmail={gmailToken?.email ?? null}
        initialEmails={emailRows ?? []}
        initialDigest={digest}
      />
    </div>
  );
}
