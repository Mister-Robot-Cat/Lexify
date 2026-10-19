const isWord = (ch: string | undefined) => !!ch && /[\p{L}\p{N}']/u.test(ch);

export type Segment = { text: string; error?: number };

/**
 * Splits an essay into plain and highlighted segments. Errors are located by
 * their quoted text (models are unreliable with offsets); each quote is
 * matched once, skipping overlaps.
 */
export function highlightSegments(text: string, quotes: string[]): Segment[] {
  const spans: { start: number; end: number; error: number }[] = [];
  quotes.forEach((quote, error) => {
    const q = quote.trim();
    if (!q) return;
    let from = 0;
    while (from <= text.length) {
      const start = text.indexOf(q, from);
      if (start < 0) return;
      const end = start + q.length;
      // Don't match "i" inside "think": quotes must sit on word boundaries.
      const boundary = !(isWord(q[0]) && isWord(text[start - 1])) && !(isWord(q[q.length - 1]) && isWord(text[end]));
      if (boundary && !spans.some((s) => start < s.end && end > s.start)) {
        spans.push({ start, end, error });
        return;
      }
      from = start + 1;
    }
  });
  spans.sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let pos = 0;
  for (const s of spans) {
    if (s.start > pos) out.push({ text: text.slice(pos, s.start) });
    out.push({ text: text.slice(s.start, s.end), error: s.error });
    pos = s.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return out;
}
