export const HELP_SCROLL_OFFSET = 96; // clears the reading-progress bar + page top bar

export function scrollToHelpSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HELP_SCROLL_OFFSET;
  window.scrollTo({ top, behavior: "smooth" });
}
