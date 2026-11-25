import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BUILT_IN_THEMES, type ThemeData } from "@/lib/themes";

import { ThemePicker } from "./theme-picker";

const mine: ThemeData = { ...BUILT_IN_THEMES[0], id: "c1", name: "My theme", builtIn: false, accent: "#6b4f8a" };

function renderPicker(activeId = "editorial") {
  const onSelect = vi.fn();
  const onCustomize = vi.fn();
  render(
    <ThemePicker
      themes={[...BUILT_IN_THEMES, mine]}
      activeId={activeId}
      userName="Jane Doe"
      onSelect={onSelect}
      onCustomize={onCustomize}
    />,
  );
  return { onSelect, onCustomize };
}

describe("ThemePicker", () => {
  it("shows the Full Stack built-in theme as a button, the active one in use (RES-2)", () => {
    renderPicker();
    expect(screen.getByRole("button", { name: "Full Stack theme, in use" })).toBeInTheDocument();
    expect(screen.getAllByText("Jane Doe")).toHaveLength(1);
  });

  it("lists your own themes (RES-4)", () => {
    renderPicker("c1");
    expect(screen.getByRole("button", { name: "My theme theme, in use" })).toHaveTextContent("My themeIn use");
    expect(screen.getByRole("button", { name: "Full Stack theme" })).toBeInTheDocument();
  });

  it("selects a theme", async () => {
    const { onSelect } = renderPicker("c1");
    await userEvent.click(screen.getByRole("button", { name: "Full Stack theme" }));
    expect(onSelect).toHaveBeenCalledWith("editorial");
  });

  it("offers to make your own theme", async () => {
    const { onCustomize } = renderPicker();
    await userEvent.click(screen.getByRole("button", { name: /Make your own theme/ }));
    expect(onCustomize).toHaveBeenCalled();
  });
});
