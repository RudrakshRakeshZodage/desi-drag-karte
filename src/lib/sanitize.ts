/**
 * Security: strip control chars + HTML tag delimiters to neutralize
 * stored-XSS attempts before a task ever enters Zustand state.
 * React already escapes text on render, this is defense in depth.
 */
export function sanitizeText(input: unknown, maxLen = 200): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>]/g, "") // strip tag delimiters
    .replace(/[\u0000-\u001F\u007F]/g, "") // strip control chars
    .replace(/javascript:/gi, "")
    .trim()
    .slice(0, maxLen);
}

/** Safely parse persisted JSON; returns fallback on any corruption. */
export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}