export const CORNER_RADIUS_MIN = 0;
export const CORNER_RADIUS_MAX = 100;

export type TextBackgroundMode = "block" | "per-letter";

export interface TextBackground {
	enabled: boolean;
	color: string;
	cornerRadius?: number;
	paddingX?: number;
	paddingY?: number;
	offsetX?: number;
	offsetY?: number;
	/** "block" = one rect around the whole text block (default).
	 *  "per-letter" = a tight rounded pill behind each non-whitespace glyph
	 *  (the IG-caption look). */
	mode?: TextBackgroundMode;
}
