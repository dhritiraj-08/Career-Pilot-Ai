import { NextResponse } from "next/server";
import { extractText } from "unpdf";

import { createClient } from "@/lib/supabase/server";
import { callOpenRouter } from "@/lib/ai/openrouter";
import { buildResumeParseMessages } from "@/lib/ai/prompts/resume-parse";
import { extractResumeFallback } from "@/lib/ai/fallbacks/resume-parse";
import { toOnboardingPrefill } from "@/lib/validations/resume-parse";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Onboarding's "Upload Resume" step. Always saves the file to the
 * Resume Vault first — a parsing failure below must never lose the
 * upload — then attempts AI extraction with a deterministic fallback.
 * Returns 200 with `usedFallback: true` rather than an error status
 * whenever the fallback path is used, since the resume was still saved
 * successfully; only a genuinely failed upload returns a non-2xx status.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDF only" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const resumeId = crypto.randomUUID();
  const storagePath = `${user.id}/${resumeId}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, buffer, { contentType: "application/pdf" });
  if (uploadError) {
    return NextResponse.json(
      { error: `Couldn't save resume: ${uploadError.message}` },
      { status: 500 }
    );
  }

  // Onboarding uploads always become primary — the user is establishing
  // their current resume here, not casually adding to a collection
  // (unlike the Resume Vault's own upload button, which only defaults a
  // new resume to primary when it's the user's first).
  await supabase.from("resumes").update({ is_primary: false }).eq("user_id", user.id);

  const { error: insertError } = await supabase.from("resumes").insert({
    id: resumeId,
    user_id: user.id,
    name: file.name,
    file_url: storagePath,
    parsed_content: { file_size_bytes: file.size, mime_type: file.type },
    is_primary: true,
  });
  if (insertError) {
    await supabase.storage.from("resumes").remove([storagePath]);
    return NextResponse.json(
      { error: `Couldn't save resume: ${insertError.message}` },
      { status: 500 }
    );
  }

  // From here on, any failure still returns 200 with a fallback — the
  // resume itself is already safely saved above.
  let resumeText = "";
  try {
    const { text } = await extractText(buffer, { mergePages: true });
    resumeText = text.trim();
  } catch {
    resumeText = "";
  }

  if (!resumeText || resumeText.length < 40) {
    // No usable text layer (e.g. a scanned image PDF) — skip the LLM
    // call rather than spending a request on nothing useful.
    return NextResponse.json({
      resumeId,
      usedFallback: true,
      profile: toOnboardingPrefill(extractResumeFallback("")),
    });
  }

  try {
    const raw = await callOpenRouter({
      messages: buildResumeParseMessages(resumeText),
      jsonMode: true,
    });
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in LLM response");
    const parsedJson = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      resumeId,
      usedFallback: false,
      profile: toOnboardingPrefill(parsedJson),
    });
  } catch {
    return NextResponse.json({
      resumeId,
      usedFallback: true,
      profile: toOnboardingPrefill(extractResumeFallback(resumeText)),
    });
  }
}
