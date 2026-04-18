import { describe, it, expect } from "vitest";
import {
  compositeOverOverlay,
  contrastOverOverlay,
  contrastRatio,
  OVERLAY_ALPHA,
  relativeLuminance,
  TEXT_COLOR,
  type Rgb,
} from "./contrast";

describe("relativeLuminance", () => {
  it("returns 0 for pure black", () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
  });

  it("returns 1 for pure white", () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });

  it("uses the sRGB piecewise formula for low channel values", () => {
    const low = relativeLuminance({ r: 5, g: 5, b: 5 });
    const manual = (5 / 255 / 12.92) * (0.2126 + 0.7152 + 0.0722);
    expect(low).toBeCloseTo(manual, 6);
  });
});

describe("contrastRatio", () => {
  it("is 21:1 for black on white", () => {
    const r = contrastRatio({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 });
    expect(r).toBeCloseTo(21, 1);
  });

  it("is symmetric", () => {
    const a: Rgb = { r: 10, g: 20, b: 30 };
    const b: Rgb = { r: 200, g: 210, b: 220 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 6);
  });

  it("is >= 1 always", () => {
    expect(contrastRatio(TEXT_COLOR, TEXT_COLOR)).toBeGreaterThanOrEqual(1);
  });
});

describe("compositeOverOverlay", () => {
  it("returns the overlay color when alpha=1", () => {
    expect(
      compositeOverOverlay({ r: 200, g: 100, b: 50 }, { r: 0, g: 0, b: 0 }, 1),
    ).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("returns the source color when alpha=0", () => {
    expect(
      compositeOverOverlay({ r: 200, g: 100, b: 50 }, { r: 0, g: 0, b: 0 }, 0),
    ).toEqual({ r: 200, g: 100, b: 50 });
  });

  it("blends linearly for intermediate alpha", () => {
    const out = compositeOverOverlay(
      { r: 200, g: 100, b: 50 },
      { r: 0, g: 0, b: 0 },
      0.5,
    );
    expect(out).toEqual({ r: 100, g: 50, b: 25 });
  });

  it("rejects alpha outside [0,1]", () => {
    expect(() =>
      compositeOverOverlay({ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }, -0.1),
    ).toThrow();
    expect(() =>
      compositeOverOverlay({ r: 0, g: 0, b: 0 }, { r: 0, g: 0, b: 0 }, 1.5),
    ).toThrow();
  });

  it("uses the design's default overlay at alpha 0.55 when not specified", () => {
    const out = compositeOverOverlay({ r: 255, g: 255, b: 255 });
    expect(OVERLAY_ALPHA).toBe(0.55);
    const expected = Math.round(255 * (1 - 0.55));
    expect(out.r).toBe(expected);
  });
});

describe("contrastOverOverlay", () => {
  it("--fg over a dark source + 0.55 black overlay clears WCAG AA", () => {
    const c = contrastOverOverlay({ r: 64, g: 64, b: 64 });
    expect(c).toBeGreaterThanOrEqual(4.5);
  });

  it("pure white is the pathological case — overlay at 0.55 fails WCAG AA", () => {
    const c = contrastOverOverlay({ r: 255, g: 255, b: 255 });
    expect(c).toBeLessThan(4.5);
  });

  it("uses TEXT_COLOR as the default foreground", () => {
    const c1 = contrastOverOverlay({ r: 32, g: 32, b: 32 });
    const c2 = contrastOverOverlay({ r: 32, g: 32, b: 32 }, TEXT_COLOR);
    expect(c1).toBeCloseTo(c2, 10);
  });
});
