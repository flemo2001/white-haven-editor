import type { TextCanvasContext, TextBlockMeasurement } from "@/text/layout";
import { DEFAULTS } from "@/timeline/defaults";
import { resolveCssVarFontFamily } from "@/fonts/resolve-var";
import { clamp } from "@/utils/math";
import { CORNER_RADIUS_MAX, CORNER_RADIUS_MIN } from "./background";
import {
	drawTextDecoration,
	getTextBackgroundRect,
	measureTextBlock,
	setCanvasLetterSpacing,
} from "./layout";
import { FONT_SIZE_SCALE_REFERENCE } from "./typography";

export type TextAlign = "left" | "center" | "right";
export type TextFontWeight = "normal" | "bold";
export type TextFontStyle = "normal" | "italic";
export type TextDecoration = "none" | "underline" | "line-through";

export interface TextLayoutParams {
	content: string;
	fontSize: number;
	fontFamily: string;
	fontWeight: TextFontWeight;
	fontStyle: TextFontStyle;
	textAlign: TextAlign;
	textDecoration?: TextDecoration;
	letterSpacing?: number;
	lineHeight?: number;
}

export interface ResolvedTextLayout {
	scaledFontSize: number;
	fontString: string;
	letterSpacing: number;
	lineHeightPx: number;
	fontSizeRatio: number;
	textAlign: TextAlign;
	textDecoration: TextDecoration;
}

export interface MeasuredTextLayout extends ResolvedTextLayout {
	lines: string[];
	lineMetrics: TextMetrics[];
	block: TextBlockMeasurement;
}

export interface ResolvedTextBackgroundLike {
	enabled: boolean;
	color: string;
	paddingX: number;
	paddingY: number;
	offsetX: number;
	offsetY: number;
	cornerRadius: number;
	/** Optional. Defaults to "block" for back-compat. */
	mode?: "block" | "per-letter";
}

export function quoteFontFamily({ fontFamily }: { fontFamily: string }): string {
	return `"${fontFamily.replace(/"/g, '\\"')}"`;
}

export function buildTextFontString({
	fontFamily,
	fontWeight,
	fontStyle,
	scaledFontSize,
}: {
	fontFamily: string;
	fontWeight: TextFontWeight;
	fontStyle: TextFontStyle;
	scaledFontSize: number;
}): string {
	// Resolve CSS-var families to the underlying font name. New presets store
	// the resolved name at apply time; this covers legacy elements that were
	// saved with a raw `var(--font-xxx), <generic>` value before the apply-time
	// fix shipped — they would otherwise render in the canvas fallback font.
	const resolved = resolveCssVarFontFamily(fontFamily);
	return `${fontStyle} ${fontWeight} ${scaledFontSize}px ${quoteFontFamily({ fontFamily: resolved })}, sans-serif`;
}

export function resolveTextLayout({
	text,
	canvasHeight,
}: {
	text: TextLayoutParams;
	canvasHeight: number;
}): ResolvedTextLayout {
	const scaledFontSize =
		text.fontSize * (canvasHeight / FONT_SIZE_SCALE_REFERENCE);
	const fontWeight = text.fontWeight === "bold" ? "bold" : "normal";
	const fontStyle = text.fontStyle === "italic" ? "italic" : "normal";
	const letterSpacing = text.letterSpacing ?? DEFAULTS.text.letterSpacing;
	const lineHeightPx =
		scaledFontSize * (text.lineHeight ?? DEFAULTS.text.lineHeight);
	const fontSizeRatio = text.fontSize / 15;

	return {
		scaledFontSize,
		fontString: buildTextFontString({
			fontFamily: text.fontFamily,
			fontWeight,
			fontStyle,
			scaledFontSize,
		}),
		letterSpacing,
		lineHeightPx,
		fontSizeRatio,
		textAlign: text.textAlign,
		textDecoration: text.textDecoration ?? "none",
	};
}

export function measureTextLayout({
	text,
	canvasHeight,
	ctx,
}: {
	text: TextLayoutParams;
	canvasHeight: number;
	ctx: TextCanvasContext;
}): MeasuredTextLayout {
	const resolvedLayout = resolveTextLayout({ text, canvasHeight });
	const lines = text.content.split("\n");

	ctx.save();
	ctx.font = resolvedLayout.fontString;
	ctx.textBaseline = "middle";
	setCanvasLetterSpacing({
		ctx,
		letterSpacingPx: resolvedLayout.letterSpacing,
	});
	const lineMetrics = lines.map((line) => ctx.measureText(line));
	ctx.restore();

	const block = measureTextBlock({
		lineMetrics,
		lineHeightPx: resolvedLayout.lineHeightPx,
	});

	return {
		...resolvedLayout,
		lines,
		lineMetrics,
		block,
	};
}

export function drawMeasuredTextLayout({
	ctx,
	layout,
	textColor,
	background,
	backgroundColor,
	textBaseline = "middle",
}: {
	ctx: TextCanvasContext;
	layout: MeasuredTextLayout;
	textColor: string;
	background?: ResolvedTextBackgroundLike | null;
	backgroundColor?: string;
	textBaseline?: CanvasTextBaseline;
}): void {
	ctx.font = layout.fontString;
	ctx.textAlign = layout.textAlign;
	ctx.textBaseline = textBaseline;
	ctx.fillStyle = textColor;
	setCanvasLetterSpacing({ ctx, letterSpacingPx: layout.letterSpacing });

	if (
		background?.enabled &&
		backgroundColor &&
		backgroundColor !== "transparent" &&
		layout.lines.length > 0
	) {
		if (background.mode === "per-letter") {
			drawPerLetterPills({
				ctx,
				layout,
				background,
				backgroundColor,
			});
			ctx.fillStyle = textColor;
		} else {
			const backgroundRect = getTextBackgroundRect({
				textAlign: layout.textAlign,
				block: layout.block,
				background: {
					...background,
					color: backgroundColor,
				},
				fontSizeRatio: layout.fontSizeRatio,
			});
			if (backgroundRect) {
				const p =
					clamp({
						value: background.cornerRadius,
						min: CORNER_RADIUS_MIN,
						max: CORNER_RADIUS_MAX,
					}) / 100;
				const radius =
					(Math.min(backgroundRect.width, backgroundRect.height) / 2) * p;
				ctx.fillStyle = backgroundColor;
				ctx.beginPath();
				ctx.roundRect(
					backgroundRect.left,
					backgroundRect.top,
					backgroundRect.width,
					backgroundRect.height,
					radius,
				);
				ctx.fill();
				ctx.fillStyle = textColor;
			}
		}
	}

	for (let index = 0; index < layout.lines.length; index++) {
		const lineY = index * layout.lineHeightPx - layout.block.visualCenterOffset;
		ctx.fillText(layout.lines[index], 0, lineY);
		drawTextDecoration({
			ctx,
			textDecoration: layout.textDecoration,
			lineWidth: layout.lineMetrics[index].width,
			lineY,
			metrics: layout.lineMetrics[index],
			scaledFontSize: layout.scaledFontSize,
			textAlign: layout.textAlign,
		});
	}
}

export function strokeMeasuredTextLayout({
	ctx,
	layout,
	strokeColor,
	strokeWidth,
	textBaseline = "middle",
}: {
	ctx: TextCanvasContext;
	layout: MeasuredTextLayout;
	strokeColor: string;
	strokeWidth: number;
	textBaseline?: CanvasTextBaseline;
}): void {
	ctx.font = layout.fontString;
	ctx.textAlign = layout.textAlign;
	ctx.textBaseline = textBaseline;
	ctx.strokeStyle = strokeColor;
	ctx.lineWidth = strokeWidth;
	ctx.lineJoin = "round";
	ctx.lineCap = "round";
	setCanvasLetterSpacing({ ctx, letterSpacingPx: layout.letterSpacing });

	for (let index = 0; index < layout.lines.length; index++) {
		const lineY = index * layout.lineHeightPx - layout.block.visualCenterOffset;
		ctx.strokeText(layout.lines[index], 0, lineY);
	}
}

/** IG-caption look — draws a tight rounded pill behind each non-whitespace
 *  glyph instead of one rect around the whole block. Per Flemo 2026-06-18:
 *  per-letter, not per-word ("a bunch of blocks around each word thats
 *  stupid"). Padding scales with the resolved font size so the pills stay
 *  proportional across sizes. */
function drawPerLetterPills({
	ctx,
	layout,
	background,
	backgroundColor,
}: {
	ctx: TextCanvasContext;
	layout: MeasuredTextLayout;
	background: ResolvedTextBackgroundLike;
	backgroundColor: string;
}): void {
	// Tight defaults — the IG look has the pill hugging the glyph closely.
	// Operators can still tune via background.paddingX/Y if they want a
	// roomier feel; we read those + clamp them down for the per-letter
	// case (the existing defaults of 30/42 are built for the block mode
	// and would balloon each pill).
	const fontSizeRatio = layout.fontSizeRatio;
	const tightPadX = Math.max(2, Math.min(background.paddingX, 12)) * fontSizeRatio;
	const tightPadY = Math.max(2, Math.min(background.paddingY, 10)) * fontSizeRatio;
	const pillHeight = layout.scaledFontSize + tightPadY * 2;

	// Corner radius: clamp() returns 0..100 (%) — for per-letter, default to
	// a "fully rounded pill" feel by using the smaller half-height when the
	// operator hasn't dialled cornerRadius.
	const radiusPct =
		clamp({
			value: background.cornerRadius || 100,
			min: CORNER_RADIUS_MIN,
			max: CORNER_RADIUS_MAX,
		}) / 100;
	const pillRadius = (pillHeight / 2) * radiusPct;

	const letterSpacingPx = layout.letterSpacing || 0;
	const align = layout.textAlign;
	ctx.fillStyle = backgroundColor;

	for (let lineIdx = 0; lineIdx < layout.lines.length; lineIdx++) {
		const line = layout.lines[lineIdx];
		const lineMetrics = layout.lineMetrics[lineIdx];
		const lineY = lineIdx * layout.lineHeightPx - layout.block.visualCenterOffset;
		const lineWidth = lineMetrics.width;

		// Where does the line START on the X axis? ctx.textAlign translates
		// the (x=0) reference so:
		//   left:   line starts at x = 0
		//   center: line starts at x = -lineWidth / 2
		//   right:  line starts at x = -lineWidth
		let cursorX =
			align === "left" ? 0 : align === "right" ? -lineWidth : -lineWidth / 2;
		const top = lineY - pillHeight / 2 + background.offsetY;

		for (const char of line) {
			const charWidth = ctx.measureText(char).width;
			// Skip pure-whitespace glyphs — leaving the gap reads as the
			// natural inter-word spacing IG uses.
			if (char.trim().length > 0) {
				ctx.beginPath();
				ctx.roundRect(
					cursorX - tightPadX + background.offsetX,
					top,
					charWidth + tightPadX * 2,
					pillHeight,
					pillRadius,
				);
				ctx.fill();
			}
			cursorX += charWidth + letterSpacingPx;
		}
	}
}
