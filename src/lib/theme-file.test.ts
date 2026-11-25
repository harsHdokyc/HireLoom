import { describe, expect, it } from "vitest";

import { parseThemeFile, themeFile, themeFileName } from "./theme-file";
import { BUILT_IN_THEMES } from "./themes";

const editorial = BUILT_IN_THEMES[0];

describe("theme files (E5-7)", () => {
  it("exports the look without ids, and reads it back", () => {
    const file = themeFile({ ...editorial, name: "Quiet green", accent: "#1F6F5C" });
    expect(file).toEqual({
      format: "Hireloom-theme",
      version: 3,
      theme: expect.not.objectContaining({ id: expect.anything() }),
    });
    const read = parseThemeFile(JSON.parse(JSON.stringify(file)));
    expect(read).toEqual({ ok: true, theme: { ...file.theme, accent: "#1f6f5c" } });
  });

  it("keeps the header, sidebar and date styles", () => {
    expect(parseThemeFile(themeFile({ ...editorial, headerStyle: "BANNER", sidebarStyle: "TINTED", dateStyle: "TIMELINE" }))).toMatchObject({
      ok: true,
      theme: { headFont: "GEIST", headerStyle: "BANNER", sidebarStyle: "TINTED", dateStyle: "TIMELINE" },
    });
  });

  it("reads version 1 files, which have no header, sidebar or date style, with the defaults", () => {
    const { name, headFont, bodyFont, accent, layout, align, headingStyle, density } = editorial;
    const look = { name, headFont, bodyFont, accent, layout, align, headingStyle, density };
    expect(parseThemeFile({ format: "Hireloom-theme", version: 1, theme: look })).toEqual({
      ok: true,
      theme: { ...look, headerStyle: "PLAIN", sidebarStyle: "PLAIN", dateStyle: "INLINE", photoShape: "CIRCLE", photoPosition: "HEADER_END" },
    });
  });

  it("keeps the photo's shape and position, and reads version 2 files without them with the defaults (#224)", () => {
    expect(parseThemeFile(themeFile({ ...editorial, photoShape: "PORTRAIT", photoPosition: "SIDEBAR" }))).toMatchObject({
      ok: true,
      theme: { photoShape: "PORTRAIT", photoPosition: "SIDEBAR" },
    });
    const { photoShape, photoPosition, ...look } = themeFile(editorial).theme;
    expect([photoShape, photoPosition]).toEqual(["CIRCLE", "HEADER_END"]);
    expect(parseThemeFile({ format: "Hireloom-theme", version: 2, theme: look })).toEqual({
      ok: true,
      theme: { ...look, photoShape: "CIRCLE", photoPosition: "HEADER_END" },
    });
  });

  it("refuses other files, newer versions, unknown fonts and bad colors, in plain words", () => {
    const file = themeFile(editorial);
    expect(parseThemeFile({ hello: "world" })).toEqual({ ok: false, error: "That file isn't a Hireloom theme." });
    expect(parseThemeFile(null)).toEqual({ ok: false, error: "That file isn't a Hireloom theme." });
    expect(parseThemeFile({ ...file, version: 4 })).toEqual({ ok: false, error: "That theme comes from a newer version of Hireloom. Update this server first." });
    expect(parseThemeFile({ ...file, theme: { ...file.theme, headFont: "COMIC_SANS" } })).toEqual({
      ok: false,
      error: "That theme uses a font Hireloom doesn't have (COMIC_SANS).",
    });
    expect(parseThemeFile({ ...file, theme: { ...file.theme, accent: "green" } })).toEqual({ ok: false, error: "That theme file is damaged (theme.accent)." });
  });

  it("names the file after the theme, safely", () => {
    expect(themeFileName({ name: "Quiet green" })).toBe("Quiet green.Hireloom-theme.json");
    expect(themeFileName({ name: 'A/B: "best"' })).toBe("A B best.Hireloom-theme.json");
    expect(themeFileName({ name: "   " })).toBe("Theme.Hireloom-theme.json");
  });
});
