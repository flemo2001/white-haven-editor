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
  // The presets are stored as `var(--font-xxx), <generic>`. Pull the var
  // expression, resolve it, drop the generic — `buildTextFontString` will
  // re-append `, sans-serif` itself.
  const trimmed = value.trim();
  const match = trimmed.match(/^var\((--[a-zA-Z0-9-]+)\)/);
  if (!match) return trimmed;
  const resolved = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(match[1])
    .trim();
  // If the var isn't defined in this document (mounted outside the
  // <body className={fontVariables}> scope, or pre-hydration) keep the raw
  // string — no regression vs current behaviour.
  return resolved || trimmed;
}
