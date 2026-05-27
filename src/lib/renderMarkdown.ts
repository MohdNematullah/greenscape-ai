/**
 * Converts markdown text to clean, beautifully styled HTML.
 * Handles: ## headers, **bold**, *italic*, bullet lists, numbered lists, line breaks.
 * Used in Proposal preview and Customer Updates display.
 */
export function renderMarkdown(text: string): string {
  if (!text) return "";

  let html = text
    // H2 headers — ## Title
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-bold mt-5 mb-2 text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-900 pb-1 tracking-wide uppercase text-xs">$1</h2>')
    // H3 headers — ### Title
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-4 mb-1 text-gray-700 dark:text-gray-300">$1</h3>')
    // Bold — **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>')
    // Italic — *text*
    .replace(/\*(.+?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>')
    // Horizontal rule — ---
    .replace(/^---$/gm, '<hr class="my-4 border-gray-200 dark:border-zinc-700" />')
    // Bullet list items — - item or * item (but not bold *)
    .replace(/^[-•] (.+)$/gm, '<li class="flex gap-2 my-1"><span class="text-emerald-500 mt-0.5 shrink-0">▸</span><span>$1</span></li>')
    // Numbered list items — 1. item
    .replace(/^\d+\. (.+)$/gm, '<li class="flex gap-2 my-1"><span class="text-emerald-500 font-semibold shrink-0 tabular-nums min-w-[1.2rem]">•</span><span>$1</span></li>');

  // Wrap consecutive <li> elements in a <ul>
  html = html.replace(/(<li[\s\S]*?<\/li>\n?)+/g, (match) => {
    return `<ul class="my-2 space-y-0.5 pl-1">${match}</ul>`;
  });

  // Convert double newlines to paragraph breaks (skip lines already containing HTML tags)
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      // Don't wrap blocks that already start with HTML tags
      if (/^<(h[23]|ul|li|hr)/.test(block.trim())) return block;
      const inner = block.replace(/\n/g, "<br />");
      if (!inner.trim()) return "";
      return `<p class="my-2 leading-relaxed text-gray-700 dark:text-gray-300">${inner}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return html;
}
