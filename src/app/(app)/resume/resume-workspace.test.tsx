import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { toast } from "@/components/toast";
import type { ActionResult } from "@/lib/action";
import { demoProfile } from "@/lib/demo-profile";
import { themeFile } from "@/lib/theme-file";
import { BUILT_IN_THEMES } from "@/lib/themes";

import { deleteTheme, duplicateTheme, importTheme, saveTheme, setBaseTheme } from "./actions";
import { ResumeWorkspace, type ResumeWorkspaceProps } from "./resume-workspace";

vi.mock("./actions", () => ({ setBaseTheme: vi.fn(), saveTheme: vi.fn(), duplicateTheme: vi.fn(), deleteTheme: vi.fn(), importTheme: vi.fn() }));
vi.mock("@/components/toast", () => {
  const toast = vi.fn();
  return {
    toast,
    toastResult: <T,>(result: ActionResult<T>) => {
      if (!result.ok) toast(result.error);
      else if (result.toast) toast(result.toast);
      return result;
    },
  };
});

const props: ResumeWorkspaceProps = {
  profile: demoProfile(),
  themes: BUILT_IN_THEMES,
  usage: {},
  baseThemeId: "editorial",
  paper: "LETTER",
  includeReferences: false,
  maxPages: 1,
  language: null,
};

/** The theme name above the preview, next to "LETTER · 1 page". */
const previewLabel = () => screen.getByText(/ · \d+ pages?$/).previousElementSibling?.textContent;

describe("ResumeWorkspace", () => {
  beforeEach(() => {
    vi.mocked(setBaseTheme).mockReset().mockResolvedValue({ ok: true, data: null });
    vi.mocked(toast).mockReset();
    vi.mocked(saveTheme).mockReset();
    vi.mocked(duplicateTheme).mockReset();
    vi.mocked(deleteTheme).mockReset();
    vi.mocked(importTheme).mockReset();
  });

  it("shows the Full Stack theme", () => {
    render(<ResumeWorkspace {...props} />);
    expect(previewLabel()).toBe("Full Stack");
    expect(screen.getByRole("button", { name: "Full Stack theme, in use" })).toBeInTheDocument();
  });

  it("falls back to the first theme when the base theme is missing", () => {
    render(<ResumeWorkspace {...props} baseThemeId="deleted" />);
    expect(previewLabel()).toBe("Full Stack");
  });

  it("previews the draft while you customise, and discards it on Cancel (RES-3)", async () => {
    render(<ResumeWorkspace {...props} />);
    await userEvent.click(screen.getByRole("tab", { name: "Customize" }));
    expect(previewLabel()).toBe("My theme");
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "Accent" })).getByRole("radio", { name: "Plum" }));
    const page = screen.getByRole("article", { name: "Resume" });
    expect(page.style.getPropertyValue("--accent")).toBe("#6b4f8a");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("tab", { name: "Themes", selected: true })).toBeInTheDocument();
    expect(previewLabel()).toBe("Full Stack");
    expect(page.style.getPropertyValue("--accent")).toBe("#444444");
  });

  it("saves the draft as your base theme (RES-4)", async () => {
    vi.mocked(saveTheme).mockImplementation(async ({ id, ...draft }) => ({
      ok: true,
      data: { ...draft, id: id ?? "c1", builtIn: false },
      toast: `Saved “${draft.name}”. It's now your base resume theme.`,
    }));
    render(<ResumeWorkspace {...props} />);
    await userEvent.click(screen.getByRole("button", { name: /Make your own theme/ }));
    await userEvent.clear(screen.getByLabelText("Theme name"));
    await userEvent.type(screen.getByLabelText("Theme name"), "Blue airy");
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "Spacing" })).getByRole("radio", { name: "Airy" }));
    await userEvent.click(screen.getByRole("button", { name: "Save theme" }));

    expect(saveTheme).toHaveBeenCalledWith(
      expect.objectContaining({ id: null, name: "Blue airy", headFont: "GEIST", density: "AIRY" }),
    );
    expect(toast).toHaveBeenCalledWith("Saved “Blue airy”. It's now your base resume theme.");
    expect(await screen.findByRole("button", { name: "Blue airy theme, in use" })).toBeInTheDocument();
    expect(previewLabel()).toBe("Blue airy");
  });

  it("keeps the draft when saving fails", async () => {
    vi.mocked(saveTheme).mockResolvedValue({ ok: false, error: "Something went wrong." });
    render(<ResumeWorkspace {...props} />);
    await userEvent.click(screen.getByRole("tab", { name: "Customize" }));
    await userEvent.click(screen.getByRole("button", { name: "Save theme" }));
    expect(toast).toHaveBeenCalledWith("Something went wrong.");
    expect(screen.getByLabelText("Theme name")).toHaveValue("My theme");
  });
});

describe("managing themes (E5-7)", () => {
  const custom = { ...BUILT_IN_THEMES[0], id: "c1", name: "Quiet green", builtIn: false };

  beforeEach(() => vi.mocked(toast).mockReset());

  it("duplicates the theme in use, which becomes the one in use", async () => {
    const user = userEvent.setup();
    vi.mocked(duplicateTheme).mockResolvedValueOnce({
      ok: true,
      data: { ...BUILT_IN_THEMES[0], id: "c2", name: "Full Stack copy", builtIn: false },
    });
    render(<ResumeWorkspace {...props} />);
    expect(screen.getByText("In use:")).toHaveTextContent("In use: Full Stack");
    expect(screen.queryByRole("button", { name: /^Delete/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Duplicate Full Stack" }));
    expect(duplicateTheme).toHaveBeenCalledWith({ id: "editorial" });
    expect(screen.getByRole("button", { name: "Full Stack copy theme, in use" })).toBeInTheDocument();
  });

  it("asks before deleting, says how many applications use the theme, then falls back", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTheme).mockResolvedValueOnce({ ok: true, data: { baseThemeId: "editorial" } });
    render(<ResumeWorkspace {...props} themes={[...BUILT_IN_THEMES, custom]} baseThemeId="c1" usage={{ c1: 2 }} />);
    await user.click(screen.getByRole("button", { name: "Delete Quiet green…" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete “Quiet green”?" });
    expect(dialog).toHaveTextContent(
      "2 applications use it; their documents will use your base theme instead. Full Stack becomes your base theme.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Delete theme" }));
    expect(deleteTheme).toHaveBeenCalledWith({ id: "c1" });
    expect(screen.queryByRole("button", { name: /Quiet green theme/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Full Stack theme, in use" })).toBeInTheDocument();
  });

  it("exports the theme in use as a file", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:theme");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    render(<ResumeWorkspace {...props} />);
    await user.click(screen.getByRole("button", { name: "Export Full Stack" }));
    expect(createObjectURL).toHaveBeenCalled();
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual(themeFile(BUILT_IN_THEMES[0]));
    vi.unstubAllGlobals();
  });

  it("imports a theme file", async () => {
    const file = themeFile({ ...BUILT_IN_THEMES[0], name: "Shared" });
    vi.mocked(importTheme).mockResolvedValueOnce({
      ok: true,
      data: { ...BUILT_IN_THEMES[0], id: "c3", name: "Shared", builtIn: false },
    });
    render(<ResumeWorkspace {...props} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File([JSON.stringify(file)], "Shared.Hireloom-theme.json", { type: "application/json" }));
    expect(importTheme).toHaveBeenCalled();
  });
});
