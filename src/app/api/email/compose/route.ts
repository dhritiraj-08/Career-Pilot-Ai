import { NextResponse } from "next/server";
import { extractText } from "unpdf";

import { createClient } from "@/lib/supabase/server";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildComposeMessages, buildReplyMessages, type ComposeContext } from "@/lib/ai/prompts/email";
import { fallbackComposeEmail, fallbackReply } from "@/lib/ai/fallbacks/email";
import { parseComposedEmail, COMPOSE_TYPES, type ComposeType } from "@/lib/validations/email";

interface RequestBody {
  // Fresh compose (the "Compose New Email" modal's AI assist):
  type?: string;
  company?: string;
  role?: string;
  highlights?: string;
  recipientName?: string;
  /** Optional — id of a resume from the vault to pull real experience
   * from. Looked up server-side (never trusting client-supplied resume
   * text), same as emailId below. */
  resumeId?: string;
  // Suggested reply (the email detail view) — mutually exclusive with
  // the above; emailId is looked up server-side rather than trusting
  // client-supplied "original email" content, both for correctness and
  // so this can't be used to launder arbitrary text through the LLM as
  // if it were a real stored email.
  emailId?: string;
}

// Resume extraction (only when a resumeId is given) can take a few
// seconds on top of the compose call itself.
export const maxDuration = 60;

const MAX_RESUME_CHARS = 6000;

/** Same on-demand-extract-then-cache pattern as the Interview and
 * Resume Architect routes — parsed_content only ever holds the raw
 * extracted text, so a resume analyzed once anywhere doesn't need
 * re-extraction here. Returns "" (never throws) on any failure — a
 * missing/unreadable resume degrades the draft to less personalized
 * rather than failing compose outright. */
async function getResumeText(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  resumeId: string
): Promise<string> {
  const { data: resume } = await supabase
    .from("resumes")
    .select("id, file_url, parsed_content")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!resume) return "";

  const existingParsedContent = (resume.parsed_content ?? {}) as Record<string, unknown>;
  const cached = existingParsedContent.extracted_text;
  if (typeof cached === "string" && cached) return cached.slice(0, MAX_RESUME_CHARS);

  try {
    const { data: fileBlob, error: downloadError } = await supabase.storage.from("resumes").download(resume.file_url);
    if (downloadError || !fileBlob) return "";
    const buffer = new Uint8Array(await fileBlob.arrayBuffer());
    const { text } = await extractText(buffer, { mergePages: true });
    const resumeText = text.trim();
    if (resumeText) {
      await supabase
        .from("resumes")
        .update({ parsed_content: { ...existingParsedContent, extracted_text: resumeText } })
        .eq("id", resumeId);
    }
    return resumeText.slice(0, MAX_RESUME_CHARS);
  } catch {
    return "";
  }
}

/** Generates a draft — either a fresh email for the compose modal, or
 * (when emailId is given) a suggested reply to an existing synced
 * email. Never sends anything itself, just returns text for the user
 * to review and edit. */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as RequestBody | null;

  if (body?.emailId) {
    const { data: original, error: fetchError } = await supabase
      .from("emails")
      .select("sender, subject, body")
      .eq("id", body.emailId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (fetchError || !original) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();
    const candidateName = profile?.full_name ?? "";
    const originalEmail = { sender: original.sender ?? "", subject: original.subject ?? "", body: original.body ?? "" };

    let reply;
    let usedFallback = false;
    try {
      const raw = await callOpenRouter({ messages: buildReplyMessages(originalEmail, candidateName), jsonMode: true });
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in reply response");
      const parsed = parseComposedEmail(JSON.parse(jsonMatch[0]));
      if (!parsed.body) throw new Error("Empty body in reply response");
      reply = parsed;
    } catch (err) {
      console.error("[email] reply suggestion failed:", err instanceof Error ? err.message : err);
      usedFallback = true;
      reply = fallbackReply(originalEmail, candidateName);
    }

    const subject = originalEmail.subject.toLowerCase().startsWith("re:") ? originalEmail.subject : `Re: ${originalEmail.subject}`;
    return NextResponse.json({ subject, body: reply.body, usedFallback });
  }

  const type = body?.type as ComposeType | undefined;
  if (!type || !COMPOSE_TYPES.includes(type)) {
    return NextResponse.json({ error: "type must be a valid compose type" }, { status: 400 });
  }

  const resumeId = body?.resumeId?.trim();
  const [{ data: profile }, { data: skillRows }, resumeText] = await Promise.all([
    supabase.from("profiles").select("full_name, current_job_role, current_company, years_experience").eq("user_id", user.id).maybeSingle(),
    supabase.from("skills").select("name").eq("user_id", user.id),
    resumeId ? getResumeText(supabase, user.id, resumeId) : Promise.resolve(""),
  ]);

  const ctx: ComposeContext = {
    company: body?.company?.trim() ?? "",
    role: body?.role?.trim() ?? "",
    highlights: body?.highlights?.trim() ?? "",
    recipientName: body?.recipientName?.trim() ?? "",
    candidateName: profile?.full_name ?? "",
    currentJobRole: profile?.current_job_role ?? "",
    currentCompany: profile?.current_company ?? "",
    yearsExperience: profile?.years_experience ?? null,
    skills: (skillRows ?? []).map((s) => s.name),
    resumeText,
  };

  let draft;
  let usedFallback = false;
  try {
    const raw = await callOpenRouter({ messages: buildComposeMessages(type, ctx), jsonMode: true });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in compose response");
    draft = parseComposedEmail(JSON.parse(jsonMatch[0]));
    if (!draft.body) throw new Error("Empty body in compose response");
  } catch (err) {
    console.error("[email] compose generation failed:", err instanceof Error ? err.message : err);
    usedFallback = true;
    draft = fallbackComposeEmail(type, ctx);
  }

  await supabase.from("agent_activities").insert({
    user_id: user.id,
    agent_name: "email_agent",
    action: `Drafted a ${type} email${ctx.company ? ` for ${ctx.company}` : ""}`,
    status: "success",
    details: { usedFallback },
  });

  return NextResponse.json({ subject: draft.subject, body: draft.body, usedFallback });
}
