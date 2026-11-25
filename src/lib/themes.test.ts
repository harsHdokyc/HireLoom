import { describe, expect, it } from "vitest";

import {
  ACCENTS,
  BUILT_IN_THEMES,
  contrastRatio,
  hasSidebar,
  printCss,
  readableOnWhite,
  resolveTheme,
  unitsToMm,
  withoutSidebar,
} from "./themes";

const editorial = BUILT_IN_THEMES[0];

describe("resolveTheme", () => {
  it("sizes the name for the compact Full Stack theme", () => {
    expect(resolveTheme(editorial).name).toEqual({ size: 21, weight: 600 });
    expect(resolveTheme({ ...editorial, density: "REGULAR" }).name).toEqual({ size: 25, weight: 600 });
  });

  it("centers the Full Stack header and left-aligns sidebar overrides", () => {
    expect(resolveTheme(editorial).centered).toBe(true);
    expect(resolveTheme({ ...editorial, layout: "SPLIT" })).toMatchObject({ split: true, centered: false });
  });

  it("lets a layout override the theme's", () => {
    expect(resolveTheme(editorial, "SPLIT").split).toBe(true);
    expect(resolveTheme({ ...editorial, layout: "SPLIT" }, "SINGLE").split).toBe(false);
  });

  it("resolves banner, timeline, tint and heading markers from the theme fields", () => {
    expect(resolveTheme({ ...editorial, headerStyle: "BANNER", dateStyle: "TIMELINE" })).toMatchObject({
      banner: true,
      timeline: true,
      centered: true,
    });
    expect(resolveTheme({ ...editorial, headingStyle: "BAND" }).heading.marker).toBe("band");
    expect(resolveTheme({ ...editorial, headingStyle: "BAR" }).heading.marker).toBe("bar");
    expect(
      resolveTheme({ ...editorial, layout: "SPLIT_END", sidebarStyle: "TINTED" }, "SINGLE"),
    ).toMatchObject({ split: false, sidebarEnd: false, tintedSidebar: false });
  });

  it("puts white on dark accents and ink on light ones", () => {
    expect(resolveTheme({ ...editorial, accent: "#1f3a5f", headerStyle: "BANNER" }).onAccent).toBe("#ffffff");
    expect(resolveTheme({ ...editorial, accent: "#f2c94c", headerStyle: "BANNER" }).onAccent).toBe("#1d1c1a");
  });

  it("puts the script fallbacks and a Greek face in the style of the font before the theme's fonts", () => {
    expect(resolveTheme(editorial)).toMatchObject({
      headFamily: "var(--script-fonts), var(--typeface-greek-sans), var(--typeface-geist)",
      bodyFamily: "var(--script-fonts), var(--typeface-greek-sans), var(--typeface-geist)",
    });
  });
});

describe("layouts and colours", () => {
  it("folds only sidebars into a single column", () => {
    expect(withoutSidebar("SPLIT")).toBe("SINGLE");
    expect(withoutSidebar("SPLIT_END")).toBe("SINGLE");
    expect(withoutSidebar("SIDE_HEADINGS")).toBe("SIDE_HEADINGS");
    expect(hasSidebar("SIDE_HEADINGS")).toBe(false);
  });

  it("offers swatches that read as text on white, and tells light colours apart", () => {
    for (const accent of ACCENTS) expect(readableOnWhite(accent.value), accent.name).toBe(true);
    for (const theme of BUILT_IN_THEMES) expect(readableOnWhite(theme.accent), theme.name).toBe(true);
    expect(readableOnWhite("#f2c94c")).toBe(false);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
  });

  it("ships a single built-in theme", () => {
    expect(BUILT_IN_THEMES).toHaveLength(1);
    expect(BUILT_IN_THEMES[0]).toMatchObject({ id: "editorial", name: "Full Stack", builtIn: true });
  });
});

describe("printCss", () => {
  it("prints on the configured paper with the theme's padding as page margins", () => {
    // Compact: 28 × 40 units; a unit is 210 / 640 mm on A4.
    expect(printCss(editorial, "A4")).toMatch(
      /^@page \{ size: 210mm 297mm; margin: 9.188mm 13.125mm; \}\n:root \{ --u: 0.328125mm; \}\n/,
    );
    expect(printCss(editorial, "LETTER")).toMatch(/^@page \{ size: 215.9mm 279.4mm; margin: 9.446mm 13.494mm; \}/);
  });

  it("converts page units to millimetres", () => {
    expect(unitsToMm(640, "A4")).toBe(210);
    expect(unitsToMm(640, "LETTER")).toBe(215.9);
  });
});
