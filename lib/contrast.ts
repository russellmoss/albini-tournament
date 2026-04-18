export type Rgb = { r: number; g: number; b: number };

export const TEXT_COLOR: Rgb = { r: 0xf5, g: 0xf3, b: 0xee };
export const OVERLAY_COLOR: Rgb = { r: 0, g: 0, b: 0 };
export const OVERLAY_ALPHA = 0.55;
export const MIN_CONTRAST = 4.5;

function channelToLinear(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(color: Rgb): number {
  const r = channelToLinear(color.r);
  const g = channelToLinear(color.g);
  const b = channelToLinear(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

export function compositeOverOverlay(
  source: Rgb,
  overlayColor: Rgb = OVERLAY_COLOR,
  overlayAlpha: number = OVERLAY_ALPHA,
): Rgb {
  if (overlayAlpha < 0 || overlayAlpha > 1) {
    throw new Error("overlayAlpha must be in [0,1]");
  }
  const blend = (s: number, o: number) =>
    Math.round(s * (1 - overlayAlpha) + o * overlayAlpha);
  return {
    r: blend(source.r, overlayColor.r),
    g: blend(source.g, overlayColor.g),
    b: blend(source.b, overlayColor.b),
  };
}

export function contrastOverOverlay(source: Rgb, text: Rgb = TEXT_COLOR): number {
  return contrastRatio(text, compositeOverOverlay(source));
}
