// IG-flavor preset font styles for the WHC Editor.
// 2026-06-12 — Flemo prompt: surface a familiar IG-style picker for operators
// editing reels. Instagram's actual typefaces are proprietary; this maps each
// style to a free Google Fonts equivalent that matches the visual feel.
// Fonts are bundled at build time via next/font/google in app/layout.tsx and
// exposed as CSS custom properties; we reference them by `var(--font-xxx)`.
//
// Style notes:
//   - Anton intentionally appears in two rows (Meme + Poster) — one font
//     download, two treatments.
//   - Treatments shipped in v1: fontWeight, fontStyle, letterSpacing.
//     uppercase/text-stroke/text-shadow are v2 (require extending the editor's
//     TEXT_PARAM_KEYS in registry.tsx — out of scope for the speedrun).

export type IgStylePreset = {
  id: string;
  /** Short label rendered on the preset chip. */
  displayName: string;
  /** CSS font-family value. Falls back to category-appropriate generic. */
  fontFamily: string;
  fontWeight: number;
  /** "normal" | "italic" — wired into the existing fontStyle param. */
  fontStyle: "normal" | "italic";
  /** CSS letter-spacing in px (or null = inherit). */
  letterSpacingPx: number | null;
  /**
   * Cosmetic-only metadata (NOT applied to elements yet — v2):
   *   - uppercase: transform content visually
   *   - textStroke: -webkit-text-stroke for the Meme outline look
   *   - textShadow: glow for the Neon look
   * Kept on the spec for future render-layer wiring; v1 just applies the
   * three supported params above.
   */
  v2?: {
    uppercase?: boolean;
    textStroke?: string;
    textShadow?: string;
  };
};

export const IG_STYLE_PRESETS: IgStylePreset[] = [
  {
    id: "classic",
    displayName: "Classic",
    fontFamily: "var(--font-inter), sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: null,
  },
  {
    id: "modern",
    displayName: "Modern",
    fontFamily: "var(--font-montserrat), sans-serif",
    fontWeight: 600,
    fontStyle: "normal",
    letterSpacingPx: null,
  },
  {
    id: "neon",
    displayName: "Neon",
    fontFamily: "var(--font-pacifico), cursive",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: null,
    v2: {
      textShadow:
        "0 0 4px #fff, 0 0 8px currentColor, 0 0 14px currentColor",
    },
  },
  {
    id: "typewriter",
    displayName: "Typewriter",
    fontFamily: "var(--font-courier-prime), monospace",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: null,
  },
  {
    id: "strong",
    displayName: "Strong",
    fontFamily: "var(--font-archivo-black), sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: -0.5,
    v2: { uppercase: true },
  },
  {
    id: "meme",
    displayName: "Meme",
    fontFamily: "var(--font-anton), sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: null,
    v2: { uppercase: true, textStroke: "1px #000" },
  },
  {
    id: "elegant",
    displayName: "Elegant",
    fontFamily: "var(--font-playfair), serif",
    fontWeight: 500,
    fontStyle: "normal",
    letterSpacingPx: null,
  },
  {
    id: "directional",
    displayName: "Directional",
    fontFamily: "var(--font-oswald), sans-serif",
    fontWeight: 600,
    fontStyle: "italic",
    letterSpacingPx: null,
  },
  {
    id: "literature",
    displayName: "Literature",
    fontFamily: "var(--font-lora), serif",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: null,
  },
  {
    id: "signature",
    displayName: "Signature",
    fontFamily: "var(--font-dancing-script), cursive",
    fontWeight: 600,
    fontStyle: "normal",
    letterSpacingPx: null,
  },
  {
    id: "editor",
    displayName: "Editor",
    fontFamily: "var(--font-dm-serif), serif",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: null,
  },
  {
    id: "bubble",
    displayName: "Bubble",
    fontFamily: "var(--font-fredoka), sans-serif",
    fontWeight: 500,
    fontStyle: "normal",
    letterSpacingPx: null,
  },
  {
    id: "squeeze",
    displayName: "Squeeze",
    fontFamily: "var(--font-bebas), sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: 0.5,
  },
  {
    id: "poster",
    displayName: "Poster",
    fontFamily: "var(--font-anton), sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: null,
    v2: { uppercase: true },
  },
  {
    id: "deco",
    displayName: "Deco",
    fontFamily: "var(--font-poiret), sans-serif",
    fontWeight: 400,
    fontStyle: "normal",
    letterSpacingPx: 1,
  },
];
