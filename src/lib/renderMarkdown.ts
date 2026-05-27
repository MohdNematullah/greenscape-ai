/**
 * Converts markdown text to clean, beautifully styled HTML.
 * Strips all raw markdown symbols (**, *, ##, etc.) and produces
 * clean semantic HTML with tasteful inline styles.
 */
export function renderMarkdown(text: string): string {
  if (!text) return "";

  // First, clean up any raw markdown that might leak through
  let html = text
    // Remove ```json blocks entirely
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    // H2 headers — ## Title
    .replace(
      /^##\s+(.+)$/gm,
      '<h2 style="font-size:15px;font-weight:700;margin:20px 0 8px;color:#1e3a2f;letter-spacing:0.02em;text-transform:uppercase;border-bottom:2px solid #d1fae5;padding-bottom:6px;">$1</h2>'
    )
    // H3 headers — ### Title
    .replace(
      /^###\s+(.+)$/gm,
      '<h3 style="font-size:14px;font-weight:600;margin:16px 0 6px;color:#374151;">$1</h3>'
    )
    // Bold — **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:600;color:#111827;">$1</strong>')
    // Italic — *text* (but not inside already-processed tags)
    .replace(/(?<![<\w])\*([^*\n]+?)\*(?![>\w])/g, '<em style="font-style:italic;color:#4b5563;">$1</em>')
    // Horizontal rule — ---
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />')
    // Bullet list items — - item or • item
    .replace(
      /^[-•]\s+(.+)$/gm,
      '<div style="display:flex;gap:8px;margin:4px 0;padding-left:4px;"><span style="color:#16a34a;font-weight:bold;flex-shrink:0;">•</span><span>$1</span></div>'
    )
    // Numbered list items — 1. item
    .replace(
      /^(\d+)\.\s+(.+)$/gm,
      '<div style="display:flex;gap:8px;margin:4px 0;padding-left:4px;"><span style="color:#16a34a;font-weight:600;min-width:18px;flex-shrink:0;">$1.</span><span>$2</span></div>'
    );

  // Clean up any remaining stray * or # at start of lines
  html = html.replace(/^#+\s*/gm, "");
  // Remove any remaining isolated ** or * that weren't part of formatting
  html = html.replace(/\*{2,}/g, "");

  // Convert double newlines to paragraph breaks
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap blocks that already contain HTML block elements
      if (/^<(h[23]|hr|div)/.test(trimmed)) return trimmed;
      const inner = trimmed.replace(/\n/g, "<br />");
      return `<p style="margin:8px 0;line-height:1.7;color:#374151;">${inner}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}

/**
 * Strips ALL markdown formatting and returns plain text.
 * Used for email-ready content.
 */
export function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/\*{1,2}(.+?)\*{1,2}/g, "$1")
    .replace(/^[-•]\s+/gm, "• ")
    .trim();
}
