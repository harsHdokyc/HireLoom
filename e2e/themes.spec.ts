import { readFile } from "node:fs/promises";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { resetData, sql } from "./support";

// Managing themes (E5-7): duplicate, export, delete and import again.
test.beforeAll(resetData);

test("duplicates, exports, deletes and imports a theme", async ({ page }) => {
  await page.goto("/resume");
  const inUse = page.getByText(/^In use:/);
  const original = (await inUse.textContent())!.replace("In use: ", "");

  await page.getByRole("button", { name: `Duplicate ${original}` }).click();
  await expect(inUse).toHaveText(`In use: ${original} copy`);

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: `Export ${original} copy` }).click()]);
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported).toMatchObject({
    format: "Hireloom-theme",
    version: 3,
    theme: {
      name: `${original} copy`,
      headerStyle: expect.any(String),
      sidebarStyle: expect.any(String),
      dateStyle: expect.any(String),
      photoShape: expect.any(String),
      photoPosition: expect.any(String),
    },
  });

  await page.getByRole("button", { name: `Delete ${original} copy…` }).click();
  const dialog = page.getByRole("alertdialog", { name: `Delete “${original} copy”?` });
  await expect(dialog).toContainText("No application uses it.");
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical")).toEqual([]);
  await dialog.getByRole("button", { name: "Delete theme" }).click();
  await expect(inUse).toHaveText("In use: Full Stack");
  await expect(page.getByRole("button", { name: `${original} copy theme` })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Full Stack theme, in use" })).toBeFocused();

  await page.locator("input[type=file][accept*=json]").setInputFiles({
    name: "theme.Hireloom-theme.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(exported)),
  });
  await expect(inUse).toHaveText(`In use: ${original} copy`);
  await page.reload();
  await expect(page.getByRole("button", { name: `${original} copy theme, in use` })).toBeVisible();
});

// A theme for one application (#226, public issue 10): its resume and cover
// letter change together, in the preview and the PDF.
test("changes an application's theme from its Resume tab", async ({ page }) => {
  const [ledgerly] = await sql<{ id: string }>(`SELECT id FROM "Application" WHERE company = 'Ledgerly' LIMIT 1`);

  // Make a custom sidebar theme from the built-in so the application can switch to it.
  await page.goto("/resume");
  await page.getByRole("button", { name: "Duplicate Full Stack" }).click();
  await page.getByRole("tab", { name: "Customize" }).click();
  await page.getByRole("radio", { name: "Sidebar left" }).click();
  await page.getByLabel("Theme name").fill("App Sidebar");
  await page.getByRole("button", { name: "Save theme" }).click();
  await expect(page.getByRole("button", { name: "App Sidebar theme, in use" })).toBeVisible();
  const [custom] = await sql<{ id: string }>(`SELECT id FROM "Theme" WHERE name = 'App Sidebar' LIMIT 1`);

  await page.goto(`/applications/${ledgerly.id}`);
  await page.getByRole("button", { name: "Theme: Full Stack" }).click();
  await page.getByRole("menuitemradio", { name: "App Sidebar" }).click();
  await expect(page.getByRole("button", { name: "Theme: App Sidebar" })).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Cover letter" }).click();
  await expect(page.getByRole("button", { name: "Theme: App Sidebar" })).toBeVisible();
  const documents = await sql(`SELECT kind, "themeId" FROM "Document" WHERE "applicationId" = $1 AND kind <> 'EMAIL' ORDER BY kind`, [ledgerly.id]);
  expect(documents).toEqual([
    { kind: "RESUME", themeId: custom.id },
    { kind: "COVER_LETTER", themeId: custom.id },
  ]);
});
