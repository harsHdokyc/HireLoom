import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { RepositoryLink } from "./repository-link";
import { SidebarFrame } from "./sidebar-frame";

afterEach(() => {
  document.cookie = "HIRELOOM_sidebar=; max-age=0; path=/";
});

describe("RepositoryLink", () => {
  it("renders nothing while no public repository is configured", () => {
    render(
      <SidebarFrame initialCollapsed={false} brand={<span>Hireloom</span>}>
        <RepositoryLink />
      </SidebarFrame>,
    );
    expect(screen.queryByRole("link", { name: /Star on GitHub/ })).toBeNull();
  });
});
