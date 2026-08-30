/** Renders plain text as a simple, paginated PDF and triggers a
 * download. Client-only — jsPDF builds the file entirely in the
 * browser, no server round-trip needed. jsPDF is a sizeable library
 * (100+kB), so it's dynamically imported here rather than at module
 * top level — it only loads when a user actually clicks a download
 * button, not on every page that merely imports this file. */
export async function downloadTextAsPdf(filename: string, title: string, content: string) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, margin, y);
  y += 28;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lineHeight = 16;
  const lines = doc.splitTextToSize(content, maxWidth);

  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }

  doc.save(filename);
}
