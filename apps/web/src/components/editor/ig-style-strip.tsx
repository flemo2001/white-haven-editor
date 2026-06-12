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
import { useEditor } from "@/editor/use-editor";
import type { TimelineElement } from "@/timeline";
import { IG_STYLE_PRESETS, type IgStylePreset } from "@/fonts/ig-styles";
import { cn } from "@/utils/ui";

export function IgStyleStrip({
  element,
  trackId,
}: {
  element: TimelineElement;
  trackId: string;
}) {
  const editor = useEditor();

  const apply = (preset: IgStylePreset) => {
    if (!("params" in element)) return;
    const nextParams: Record<string, unknown> = {
      ...element.params,
      fontFamily: preset.fontFamily,
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
          const isActive = currentFontFamily === preset.fontFamily;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => apply(preset)}
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
