import type jsPDF from "jspdf";
import type { InterviewResultResponse } from "@/app/api/agents/interview/result/[sessionId]/route";

// ---------------------------------------------------------------------
// Shared typesetting engine
//
// Every PDF in the app renders through this one builder so margins,
// font family, and heading/body/bullet treatment stay identical across
// documents — the thing the previous flat-text-dump version had no way
// to guarantee. Client-only: jsPDF builds the file entirely in the
// browser dynamically imported (100+kB) so it only loads when a
// download button is actually clicked.
// ---------------------------------------------------------------------

const PAGE_WIDTH_MM = 210; // A4
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 20; // same on all four sides, per spec
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;
const PT_TO_MM = 0.352778;

const INK: [number, number, number] = [23, 23, 23];
const MUTED: [number, number, number] = [95, 95, 95];
const RULE: [number, number, number] = [70, 70, 70];

class PdfBuilder {
  private doc: jsPDF;
  private y = MARGIN_MM;

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.doc.setFont("helvetica", "normal"); // one font family throughout, as specified
  }

  private lineHeightMm(sizePt: number, multiplier = 1.42): number {
    return sizePt * PT_TO_MM * multiplier;
  }

  /** Page-break handling: anything that won't fit before the bottom
   * margin pushes to a fresh page rather than overflowing/cutting off. */
  private ensureSpace(neededMm: number) {
    if (this.y + neededMm > PAGE_HEIGHT_MM - MARGIN_MM) {
      this.doc.addPage();
      this.y = MARGIN_MM;
    }
  }

  /** How tall a paragraph would render at the given size, without
   * drawing it — lets a caller reserve space for a multi-part block
   * (heading + its own content) before starting it. */
  measureParagraphHeight(text: string, sizePt = 10): number {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(sizePt);
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH_MM) as string[];
    return lines.length * this.lineHeightMm(sizePt);
  }

  /** Forces a page break now if `neededMm` wouldn't fit on the rest of
   * the current page. Used before a heading that's about to be
   * followed by its own content, so the automatic per-line breaking in
   * addParagraph can't split them — a heading alone at the bottom of a
   * page with its content starting on the next is exactly the kind of
   * "page breaks handled properly" defect this exists to prevent. Only
   * reserves up to one full page's worth — a block genuinely taller
   * than that still flows across pages normally rather than leaving a
   * blank page trying to fit it whole. */
  reserveBlock(neededMm: number) {
    const usable = PAGE_HEIGHT_MM - MARGIN_MM * 2;
    this.ensureSpace(Math.min(neededMm, usable));
  }

  addSpacer(mm: number) {
    this.y += mm;
  }

  /** Document title — the name on a resume, or a report's own title. */
  addTitle(text: string, sizePt = 18, center = false) {
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(sizePt);
    this.doc.setTextColor(...INK);
    const lh = this.lineHeightMm(sizePt);
    this.ensureSpace(lh);
    const x = center ? (PAGE_WIDTH_MM - this.doc.getTextWidth(text)) / 2 : MARGIN_MM;
    this.doc.text(text, x, this.y);
    this.y += lh;
  }

  /** Small muted line — contact info, dates, meta. */
  addMeta(text: string, sizePt = 10, center = false) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(sizePt);
    this.doc.setTextColor(...MUTED);
    const lh = this.lineHeightMm(sizePt);
    this.ensureSpace(lh);
    const x = center ? (PAGE_WIDTH_MM - this.doc.getTextWidth(text)) / 2 : MARGIN_MM;
    this.doc.text(text, x, this.y);
    this.y += lh;
  }

  /** Section header — bold with a rule underneath, per spec. */
  addSectionHeader(text: string, sizePt = 12) {
    this.addSpacer(4);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(sizePt);
    this.doc.setTextColor(...INK);
    const lh = this.lineHeightMm(sizePt);
    this.ensureSpace(lh + 3);
    this.doc.text(text.toUpperCase(), MARGIN_MM, this.y);
    this.y += lh * 0.4;
    this.doc.setDrawColor(...RULE);
    this.doc.setLineWidth(0.35);
    this.doc.line(MARGIN_MM, this.y, MARGIN_MM + CONTENT_WIDTH_MM, this.y);
    this.y += 4;
  }

  /** Small bold label on its own line (e.g. "Your answer:") — lighter
   * weight than a section header, no rule, for sub-structure within a
   * section. */
  addLabel(text: string, sizePt = 10) {
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(sizePt);
    this.doc.setTextColor(...INK);
    const lh = this.lineHeightMm(sizePt);
    this.ensureSpace(lh);
    this.doc.text(text, MARGIN_MM, this.y);
    this.y += lh;
  }

  /** Body paragraph — wraps to the content width, page-break aware
   * line by line so a paragraph never gets cut off mid-line. */
  addParagraph(text: string, sizePt = 10, spacingAfterMm = 3) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(sizePt);
    this.doc.setTextColor(...INK);
    const lh = this.lineHeightMm(sizePt);
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH_MM) as string[];
    for (const line of lines) {
      this.ensureSpace(lh);
      this.doc.text(line, MARGIN_MM, this.y);
      this.y += lh;
    }
    this.y += spacingAfterMm;
  }

  /** Bullet point with a hanging indent — wrapped continuation lines
   * align under the text, not under the bullet glyph. */
  addBullet(text: string, sizePt = 10, indentMm = 5) {
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(sizePt);
    this.doc.setTextColor(...INK);
    const lh = this.lineHeightMm(sizePt);
    const lines = this.doc.splitTextToSize(text, CONTENT_WIDTH_MM - indentMm) as string[];
    lines.forEach((line, i) => {
      this.ensureSpace(lh);
      if (i === 0) this.doc.text("•", MARGIN_MM, this.y);
      this.doc.text(line, MARGIN_MM + indentMm, this.y);
      this.y += lh;
    });
    this.y += 1;
  }

  /** Thin horizontal divider — used between repeated items (e.g.
   * per-question review entries) rather than a full section header. */
  addDivider() {
    this.addSpacer(2);
    this.doc.setDrawColor(225, 225, 225);
    this.doc.setLineWidth(0.2);
    this.doc.line(MARGIN_MM, this.y, MARGIN_MM + CONTENT_WIDTH_MM, this.y);
    this.addSpacer(4);
  }

  save(filename: string) {
    this.doc.save(filename);
  }
}

async function createBuilder(): Promise<PdfBuilder> {
  const { default: JsPdfCtor } = await import("jspdf");
  return new PdfBuilder(new JsPdfCtor({ unit: "mm", format: "a4" }));
}

// ---------------------------------------------------------------------
// Resume / cover-letter content parsing
//
// The AI writes these as plain text (its own prompt asks for "blank
// lines between sections, plain dashes for bullets" — see
// lib/ai/prompts/resume-architect.ts) rather than structured JSON, so
// there's no guaranteed schema to render from directly. This recovers
// enough structure to typeset properly: heuristic, not a real parser —
// documented inline, and it degrades to plain paragraphs rather than
// misrendering if the AI's output doesn't follow the expected shape.
// ---------------------------------------------------------------------

const BULLET_PREFIX = /^[-•*]\s+/;

interface ResumeSection {
  heading: string;
  items: { type: "bullet" | "text"; text: string }[];
}

function parseResumeContent(content: string, fallbackName: string): {
  name: string;
  contactLines: string[];
  sections: ResumeSection[];
} {
  const blocks = content
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return { name: fallbackName, contactLines: [], sections: [] };

  // The AI's own convention puts "Name" then contact details as the
  // very first block — detected here (short first line, not a bullet)
  // rather than assumed, so a response that skips straight to content
  // still renders sensibly under the real candidate name instead.
  const firstBlockLines = blocks[0].split("\n").map((l) => l.trim()).filter(Boolean);
  const hasHeaderBlock =
    firstBlockLines.length > 0 && !BULLET_PREFIX.test(firstBlockLines[0]) && firstBlockLines[0].length <= 60;

  const name = hasHeaderBlock ? firstBlockLines[0] : fallbackName;
  const contactLines = hasHeaderBlock ? firstBlockLines.slice(1) : [];
  const sectionBlocks = hasHeaderBlock ? blocks.slice(1) : blocks;

  const sections: ResumeSection[] = sectionBlocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      const first = lines[0] ?? "";
      const looksLikeHeading = !BULLET_PREFIX.test(first) && first.length <= 40 && !/[.,;]$/.test(first);
      const heading = looksLikeHeading ? first : "";
      const bodyLines = looksLikeHeading ? lines.slice(1) : lines;

      return {
        heading,
        items: bodyLines.map((l) => ({
          type: (BULLET_PREFIX.test(l) ? "bullet" : "text") as "bullet" | "text",
          text: l.replace(BULLET_PREFIX, "").trim(),
        })),
      };
    })
    .filter((s) => s.heading || s.items.length > 0);

  return { name, contactLines, sections };
}

/**
 * Resume PDF: name in large bold at top, contact info smaller beneath
 * it, section headers bold with a rule, bullets properly indented,
 * consistent 10pt body throughout.
 */
export async function downloadResumePdf(filename: string, candidateName: string, content: string) {
  const builder = await createBuilder();
  const { name, contactLines, sections } = parseResumeContent(content, candidateName || "Your Name");

  builder.addTitle(name, 18);
  if (contactLines.length > 0) {
    builder.addMeta(contactLines.join("  |  "), 10);
  }
  builder.addSpacer(2);

  for (const section of sections) {
    if (section.heading) builder.addSectionHeader(section.heading, 12);
    for (const item of section.items) {
      if (item.type === "bullet") builder.addBullet(item.text, 10);
      else builder.addParagraph(item.text, 10, 2);
    }
    builder.addSpacer(2);
  }

  builder.save(filename);
}

/**
 * Cover letter PDF: candidate name + today's date at the top (the
 * letter body itself already opens with its own greeting), consistent
 * 11pt body, clean paragraph spacing.
 */
export async function downloadCoverLetterPdf(filename: string, candidateName: string, content: string) {
  const builder = await createBuilder();

  if (candidateName) builder.addTitle(candidateName, 14);
  builder.addMeta(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    10
  );
  builder.addSpacer(6);

  const paragraphs = content
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const paragraph of paragraphs) {
    builder.addParagraph(paragraph, 11, 4);
  }

  builder.save(filename);
}

function scoreLabel(score: number | null): string {
  return score == null ? "-" : String(score);
}

const QUESTION_TYPE_LABEL: Record<string, string> = {
  technical: "Technical",
  behavioral: "Behavioral",
  hr: "HR",
  aptitude: "Aptitude",
};

/**
 * Interview report PDF: rendered directly from the already-structured
 * result data (no text parsing needed here, unlike the resume/cover
 * letter) — overall score prominent, clear sections, per-question Q&A.
 */
export async function downloadInterviewReportPdf(filename: string, data: InterviewResultResponse) {
  const builder = await createBuilder();
  const { session, questions } = data;

  builder.addTitle("Mock Interview Report", 18, true);
  const metaParts = [
    session.jobTitle ?? "Untitled role",
    new Date(session.createdAt).toLocaleDateString(),
    session.durationMinutes ? `${session.durationMinutes} min` : null,
  ].filter(Boolean);
  builder.addMeta(metaParts.join("  ·  "), 10, true);
  builder.addSpacer(6);

  builder.addTitle(`${scoreLabel(session.overallScore)}/100`, 28, true);
  builder.addMeta("Overall Score", 10, true);
  builder.addSpacer(2);
  builder.addMeta(
    `Technical: ${scoreLabel(session.technicalScore)}   ·   Communication: ${scoreLabel(session.communicationScore)}   ·   Confidence: ${scoreLabel(session.confidenceScore)}`,
    10,
    true
  );
  builder.addSpacer(4);

  if (session.summary) {
    builder.addSectionHeader("Summary");
    builder.addParagraph(session.summary, 10);
  }
  if (session.strengths.length > 0) {
    builder.addSectionHeader("Strengths");
    session.strengths.forEach((s) => builder.addBullet(s, 10));
    builder.addSpacer(2);
  }
  if (session.weaknesses.length > 0) {
    builder.addSectionHeader("Weaknesses");
    session.weaknesses.forEach((w) => builder.addBullet(w, 10));
    builder.addSpacer(2);
  }
  if (session.recommendations.length > 0) {
    builder.addSectionHeader("Recommendations");
    session.recommendations.forEach((r) => builder.addBullet(r, 10));
    builder.addSpacer(2);
  }

  builder.addSectionHeader("Per-Question Review");
  questions.forEach((q, i) => {
    if (i > 0) builder.addDivider();

    const headerLabel = `Q${i + 1} · ${QUESTION_TYPE_LABEL[q.type] ?? q.type}${q.answer?.score != null ? `  —  ${q.answer.score}/100` : ""}`;
    const answerText = q.answer?.text || "(no answer given)";
    // Reserve the whole block (or up to a full page) up front so the
    // header can't end up alone at the bottom of a page with its own
    // question/answer starting fresh on the next.
    const blockHeight =
      builder.measureParagraphHeight(headerLabel, 10) +
      builder.measureParagraphHeight(q.question, 10) +
      2 +
      builder.measureParagraphHeight("Your answer:", 9) +
      builder.measureParagraphHeight(answerText, 10) +
      2 +
      (q.answer?.feedback
        ? builder.measureParagraphHeight("Feedback:", 9) + builder.measureParagraphHeight(q.answer.feedback, 10) + 2
        : 0);
    builder.reserveBlock(blockHeight);

    builder.addLabel(headerLabel, 10);
    builder.addParagraph(q.question, 10, 2);
    builder.addLabel("Your answer:", 9);
    builder.addParagraph(answerText, 10, 2);
    if (q.answer?.feedback) {
      builder.addLabel("Feedback:", 9);
      builder.addParagraph(q.answer.feedback, 10, 2);
    }
  });

  builder.save(filename);
}
