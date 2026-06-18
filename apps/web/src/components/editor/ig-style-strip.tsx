"use client";
// IG-style preset strip — horizontal scrollable row of preview chips rendered
// above the text properties tab. Each chip applies fontFamily / fontWeight /
// fontStyle / letterSpacing to the selected text element in one click via the
// canonical editor.timeline.updateElements API.
//
// Treatments that v1 doesn't ship (uppercase / text-stroke / text-shadow) are
// metadata-only in the config — wiring those needs the editor's TEXT_PARAM_KEYS
// extended with textTransform / textStroke / textShadow at the registry level,
// follow-up scope per the 2026-06-12 push.
import { useEffect } from "react";
import { useEditor } from "@/editor/use-editor";
import type { TimelineElement } from "@/timeline";
import { IG_STYLE_PRESETS, type IgStylePreset } from "@/fonts/ig-styles";
import { resolveCssVarFontFamily } from "@/fonts/resolve-var";
import { cn } from "@/utils/ui";

export function IgStyleStrip({
  element,
  trackId,
}: {
  element: TimelineElement;
  trackId: string;
}) {
  const editor = useEditor();

  // Preload every preset font into the document FontFace registry on mount.
  // next/font bundles + serves the woff2 files but does NOT preload them into
  // `document.fonts` — the font binary only downloads the first time a CSS
  // rule actually matches. The canvas 2D context is synchronous: if we call
  // ctx.font on a name that isn't yet loaded, canvas silently falls back to
  // sans-serif. (Smitho diagnosed this on 2026-06-17.) document.fonts.load()
  // forces the FontFaceSet to fetch and register the font; subsequent
  // renders + preset clicks find the font already present and use it.
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) return;
    const probeSize = "16px";
    for (const preset of IG_STYLE_PRESETS) {
      const family = resolveCssVarFontFamily(preset.fontFamily);
      if (!family) continue;
      // Quote the family for the spec parser; .load() rejects on bad spec
      // (e.g. an unloaded family is fine, but a missing quote is a parse
      // error that throws synchronously). Wrap in try as a safety net.
      try {
        void document.fonts.load(`${probeSize} "${family}"`);
      } catch {}
    }
  }, []);

  const apply = async (preset: IgStylePreset) => {
    if (!("params" in element)) return;
    // Resolve `var(--font-xxx)` to the actual next/font family name — the
    // canvas text renderer can't read CSS vars. See fonts/resolve-var.ts.
    const resolvedFamily = resolveCssVarFontFamily(preset.fontFamily);
    // Ensure the font is loaded into the FontFace registry BEFORE we tell the
    // timeline to update. Without this the renderer can re-draw on the click
    // tick before the font finishes downloading, get a fallback for one
    // frame, and the user sees "nothing changed" until the next re-render.
    if (typeof document !== "undefined" && document.fonts && resolvedFamily) {
      try {
        await document.fonts.load(`16px "${resolvedFamily}"`);
      } catch {}
    }
    const nextParams: Record<string, unknown> = {
      ...element.params,
      fontFamily: resolvedFamily,
      fontWeight: preset.fontWeight,
      fontStyle: preset.fontStyle,
    };
    if (preset.letterSpacingPx !== null) {
      nextParams.letterSpacing = preset.letterSpacingPx;
    }
    editor.timeline.updateElements({
      updates: [
        {
          trackId,
          elementId: element.id,
          patch: { params: nextParams },
        },
      ],
    });
  };

  // Highlight the currently-applied preset (if any) by matching on fontFamily.
  // Lightweight visual feedback — operator sees which style is live without
  // hunting through the params below.
  const currentFontFamily =
    "params" in element && typeof element.params?.fontFamily === "string"
      ? (element.params.fontFamily as string)
      : "";

  return (
    <div className="ig-style-strip border-border/40 border-b px-3 py-3">
      <div className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">
        Styles
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {IG_STYLE_PRESETS.map((preset) => {
          // Match on the RESOLVED value because apply() stores the resolved
          // font name (not the raw var() expression) in params.fontFamily.
          const isActive =
            currentFontFamily === resolveCssVarFontFamily(preset.fontFamily);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                void apply(preset);
              }}
              className={cn(
                "shrink-0 rounded-md border px-3 py-2 text-xs transition-colors",
                isActive
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border/50 hover:border-border bg-background/60 text-foreground",
              )}
              style={{
                fontFamily: preset.fontFamily,
                fontWeight: preset.fontWeight,
                fontStyle: preset.fontStyle,
                letterSpacing:
                  preset.letterSpacingPx !== null
                    ? `${preset.letterSpacingPx}px`
                    : undefined,
              }}
              title={preset.displayName}
            >
              {preset.displayName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
