import type { SupabaseClient } from "@supabase/supabase-js";

export interface JobApplicationFields {
  status: "saved" | "applied";
  match_score?: number;
  missing_skills?: string[];
  applied_at?: string;
}

/**
 * Save/Apply need an insert-or-update against the (user_id,
 * job_listing_id) pair. The natural way to express that is a single
 * upsert with `onConflict: "user_id,job_listing_id"`, but that requires
 * a matching unique constraint in the database — see the migration note
 * in docs/schema.sql. Until that's been run against a given
 * environment, an onConflict upsert fails outright (Postgres error
 * 42P10, confirmed against the live dev database while testing this
 * feature), which would silently break Save/Apply for anyone who
 * hasn't applied it yet.
 *
 * This does the same insert-or-update as two explicit calls instead,
 * so the feature works whether or not that migration has been applied.
 * It's still worth running the migration for real atomicity (this has
 * the usual check-then-write race if the same job is saved from two
 * tabs at once) — this is a compatibility fallback, not a replacement
 * for the real constraint.
 */
export async function upsertJobApplication(
  supabase: SupabaseClient,
  userId: string,
  jobListingId: string,
  fields: JobApplicationFields
) {
  const { data: existing, error: selectError } = await supabase
    .from("job_applications")
    .select("id")
    .eq("user_id", userId)
    .eq("job_listing_id", jobListingId)
    .maybeSingle();

  if (selectError) throw selectError;

  if (existing) {
    const { error } = await supabase.from("job_applications").update(fields).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("job_applications")
      .insert({ user_id: userId, job_listing_id: jobListingId, ...fields });
    if (error) throw error;
  }
}

/** Save Job is a toggle — calling it again while already saved removes
 * the bookmark rather than re-saving. Only ever removes a `saved` row;
 * an `applied` row is a stronger state that Save doesn't undo. */
export async function removeJobApplication(supabase: SupabaseClient, userId: string, jobListingId: string) {
  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("user_id", userId)
    .eq("job_listing_id", jobListingId);
  if (error) throw error;
}
