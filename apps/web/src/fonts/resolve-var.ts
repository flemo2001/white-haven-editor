// Resolve `var(--font-xxx), <fallback>` expressions to the underlying font
// name produced by next/font/google. Required because the editor's canvas
// text renderer in `src/text/primitives.ts` sets `ctx.font` with this value
// directly, and the 2D canvas font parser does NOT resolve CSS variables —
// it treats `var(--font-archivo-black)` as a literal font name, doesn't find
// it, and silently falls back to sans-serif. Result: the preset chip
// highlights, params.fontFamily updates, but the rendered text never
// changes typeface.
//
// Resolution runs against `document.documentElement` because next/font
// attaches the `--font-xxx` variables to <body> via the className composed
// in `src/app/layout.tsx`, which inherits to the documentElement when read
// via getComputedStyle (browsers expose CSS-var inheritance the same way
// they expose any inherited property). In SSR / non-DOM contexts we return
// the raw value unchanged so the chip's CSS preview still works.
export function resolveCssVarFontFamily(value: string): string {
  if (!value) return value;
  if (typeof window === "undefined") return value;
  const trimmed = value.trim();
  const match = trimmed.match(/^var\((--[a-zA-Z0-9-]+)\)/);
  if (!match) return trimmed;
  const resolved = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(match[1])
    .trim();
  if (!resolved) return trimmed;
  // next/font's computed value is a comma-separated, quoted family list like:
  //   "Archivo Black","Archivo Black Fallback"
  // Pulling the primary name out gives the canvas font shorthand a single
  // identifier it can match against the loaded FontFace, instead of trying to
  // resolve the whole `"X","X Fallback"` list as one quoted family name and
  // silently dropping to sans-serif. The Fallback variant is a CSS-only
  // anti-FOUT measure — canvas waits on the real font being loaded anyway
  // (next/font preloads at the document level).
  const firstQuoted = resolved.match(/^"([^"]+)"/);
  if (firstQuoted) return firstQuoted[1];
  return resolved.split(",")[0].trim() || trimmed;
}
