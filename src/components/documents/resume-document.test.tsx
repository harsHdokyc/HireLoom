import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { demoProfile, demoResumeUnits } from "@/lib/demo-profile";
import { LANGUAGE_SAMPLES, sampleProfile } from "@/lib/language-samples";
import { BUILT_IN_THEMES, type ThemeData } from "@/lib/themes";

import { ResumeDocument } from "./resume-document";

const editorial = BUILT_IN_THEMES[0];
const theme = (overrides: Partial<ThemeData> = {}): ThemeData => ({ ...editorial, ...overrides });
/** Demo profile without facts, so Achievements only appears when a test adds them. */
const profile = { ...demoProfile(), facts: [] };
const today = new Date(2026, 8, 28);

const sectionTitles = () => screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);

describe("ResumeDocument", () => {
  it("renders the demo profile in Full Stack", () => {
    const { container } = render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" today={today} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("puts contact details in the header with pipe separators, and orders sections for a one-pager", () => {
    render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" today={today} />);
    expect(screen.getByText("jane.doe@example.com").closest("p")?.textContent).toBe(
      "+31 6 1234 5678 | jane.doe@example.com | LinkedIn | example.com | Rotterdam, Netherlands",
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toHaveAttribute("href", "https://linkedin.com/in/janedoe-example");
    expect(screen.getByRole("article", { name: "Resume" }).querySelector("header")).not.toHaveTextContent(profile.basics.headline);
    expect(sectionTitles()).toEqual([
      "Professional Summary",
      "Technical Skills",
      "Languages",
      "Experience",
      "Projects",
      "Education",
      "Publications",
    ]);
  });

  it("lists Achievements from profile facts after education", () => {
    render(
      <ResumeDocument
        theme={editorial}
        profile={{ ...profile, facts: [{ id: "f1", text: "- Won a hackathon.\n- Climbed four peaks." }], publications: [] }}
        paper="LETTER"
        today={today}
      />,
    );
    expect(sectionTitles()).toEqual([
      "Professional Summary",
      "Technical Skills",
      "Languages",
      "Experience",
      "Projects",
      "Education",
      "Achievements",
    ]);
    expect(screen.getByRole("heading", { name: "Achievements" }).closest("section")).toHaveTextContent("Won a hackathon.");
    expect(screen.getByRole("heading", { name: "Achievements" }).closest("section")).toHaveTextContent("Climbed four peaks.");
  });

  it("lists contact details first in the sidebar of sidebar layouts", () => {
    render(<ResumeDocument theme={theme({ layout: "SPLIT" })} profile={profile} paper="LETTER" today={today} />);
    expect(sectionTitles()).toEqual([
      "Contact",
      "Technical Skills",
      "Languages",
      "Professional Summary",
      "Experience",
      "Projects",
      "Education",
      "Publications",
    ]);
    const contact = screen.getByRole("heading", { name: "Contact" }).parentElement!;
    expect(within(contact).getAllByRole("listitem").map((item) => item.textContent)).toContain("example.com");
  });

  it("renders a sidebar theme in a single column when asked", () => {
    render(<ResumeDocument theme={theme({ layout: "SPLIT" })} profile={profile} paper="LETTER" layout="SINGLE" today={today} />);
    expect(sectionTitles()).toEqual([
      "Professional Summary",
      "Technical Skills",
      "Languages",
      "Experience",
      "Projects",
      "Education",
      "Publications",
    ]);
  });

  it("reads a sidebar at the end of the line after the main column, on its tinted panel", () => {
    render(
      <ResumeDocument theme={theme({ layout: "SPLIT_END", sidebarStyle: "TINTED" })} profile={profile} paper="LETTER" today={today} />,
    );
    expect(sectionTitles()).toEqual([
      "Professional Summary",
      "Experience",
      "Projects",
      "Education",
      "Publications",
      "Contact",
      "Technical Skills",
      "Languages",
    ]);
    const panel = screen.getByRole("heading", { name: "Contact" }).closest("section")!.parentElement!;
    expect(panel.className).toMatch(/sidebarPanel/);
    expect(screen.getByRole("heading", { name: "Professional Summary" }).closest("section")!.parentElement!.className).not.toMatch(
      /sidebarPanel/,
    );
  });

  it("leaves out the tinted panel when the sidebar has nothing in it", () => {
    const noContacts = { email: "", phone: "", city: "", country: "", website: "", linkedin: "", showAge: false };
    const empty = { ...profile, basics: { ...profile.basics, ...noContacts }, skills: [], languages: [] };
    const { container } = render(
      <ResumeDocument theme={theme({ layout: "SPLIT_END", sidebarStyle: "TINTED" })} profile={empty} paper="LETTER" today={today} />,
    );
    expect(container.innerHTML).not.toMatch(/sidebarPanel/);
  });

  it("puts each role's dates before its title in a timeline", () => {
    render(<ResumeDocument theme={theme({ dateStyle: "TIMELINE" })} profile={profile} paper="LETTER" today={today} />);
    expect(screen.getByText("UX Designer").closest("[data-unit]")).toHaveTextContent("Sep 2015 – May 2018");
    expect(screen.getByRole("article", { name: "Resume" }).className).toMatch(/timeline/);
  });

  it("marks the page with the theme's structure, and gives a banner its text colour", () => {
    render(<ResumeDocument theme={theme({ headerStyle: "BANNER", accent: "#1f3a5f" })} profile={profile} paper="LETTER" today={today} />);
    const page = screen.getByRole("article", { name: "Resume" });
    expect(page.className).toMatch(/banner/);
    expect(page.className).toMatch(/centered/);
    expect(page.style.getPropertyValue("--on-accent")).toBe("#ffffff");
  });

  it("keeps side headings in a single column", () => {
    render(<ResumeDocument theme={theme({ layout: "SIDE_HEADINGS" })} profile={profile} paper="LETTER" today={today} />);
    expect(sectionTitles()).toEqual([
      "Professional Summary",
      "Technical Skills",
      "Languages",
      "Experience",
      "Projects",
      "Education",
      "Publications",
    ]);
    expect(screen.getByRole("article", { name: "Resume" }).className).toMatch(/sideHeadings/);
  });

  it("shows company then role/location for experience, and education notes", () => {
    render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" today={today} />);
    const role = screen.getByText("UX Designer").closest("[data-unit]")!;
    expect(role).toHaveAttribute("data-unit", "experience:e3");
    expect(role).toHaveTextContent("Studio Brik");
    expect(role).toHaveTextContent("UX Designer");
    expect(role).toHaveTextContent("Sep 2015 – May 2018");
    expect(screen.getByText("Thesis on trust in automated scheduling tools")).toBeInTheDocument();
  });

  it("writes its headings, dates, levels and age in the document's language", () => {
    const withAge = { ...profile, basics: { ...profile.basics, showAge: true } };
    render(
      <ResumeDocument theme={theme({ layout: "SPLIT" })} profile={withAge} paper="LETTER" today={today} language="German" includeReferences />,
    );
    expect(sectionTitles()).toEqual([
      "Kontakt",
      "Kenntnisse",
      "Sprachen",
      "Profil",
      "Berufserfahrung",
      "Projekte",
      "Ausbildung",
      "Publikationen",
      "Referenzen",
    ]);
    expect(screen.getByText("März 2021 – Heute")).toBeInTheDocument();
    expect(screen.getByText(/^Dutch: Muttersprache · English: Fließend \(C2\)/)).toBeInTheDocument();
    expect(screen.getByText("34 Jahre")).toBeInTheDocument();
  });

  it("keeps English headings for a language without its own", () => {
    render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" today={today} language="Hebrew" />);
    expect(sectionTitles()).toEqual([
      "Professional Summary",
      "Technical Skills",
      "Languages",
      "Experience",
      "Projects",
      "Education",
      "Publications",
    ]);
    expect(screen.getByText("Mar 2021 – Present")).toBeInTheDocument();
  });

  it("adds references only when enabled", () => {
    const { rerender } = render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" />);
    expect(screen.queryByRole("heading", { name: "References" })).not.toBeInTheDocument();
    rerender(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" includeReferences />);
    expect(screen.getByRole("heading", { name: "References" })).toBeInTheDocument();
    expect(screen.getByText("Former manager, Northwind Logistics")).toBeInTheDocument();
  });

  it("renders a tailored resume from its units", () => {
    render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" units={demoResumeUnits()} />);
    expect(screen.getByText(/^Senior product designer with nine years of making complex/).closest("[data-unit]")).toHaveAttribute(
      "data-unit",
      "summary",
    );
    expect(screen.getByText(/a dense, high-stakes workflow$/)).toBeInTheDocument();
  });

  it("draws each unit with the renderer it's given (E8-3)", () => {
    const { container } = render(
      <ResumeDocument
        theme={editorial}
        profile={profile}
        paper="LETTER"
        units={demoResumeUnits()}
        renderUnit={({ id, className, head, children }) => (
          <section className={className} data-testid={id}>
            {head}
            {children}
          </section>
        )}
      />,
    );
    const ids = demoResumeUnits().map((unit) => unit.id);
    const drawn = [...container.querySelectorAll("[data-testid]")].map((element) => element.getAttribute("data-testid"));
    // One-pager order: summary, skills, languages, then roles/projects/education/publications.
    expect(drawn[0]).toBe("summary");
    expect(drawn).toContain("skills");
    expect(drawn).toContain("languages");
    expect(drawn).toEqual(expect.arrayContaining(ids));
    expect(screen.getByTestId("experience:e3")).toHaveTextContent(/Studio Brik/);
  });

  it("shows projects with their tech stack and clickable link on the title line (PRO-13)", () => {
    render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" today={today} />);
    const project = screen.getByText("Tidewater design tokens").closest("[data-unit]")!;
    expect(project).toHaveAttribute("data-unit", "project:p1");
    expect(project).toHaveTextContent("Tidewater design tokens");
    expect(project).toHaveTextContent("Design systems");
    expect(within(project).getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/janedoe/tidewater");
    expect(project).toHaveTextContent("Jan 2023 – Present");
    expect(project).toHaveTextContent("Built an open-source Figma plugin that turns design tokens into CSS variables");
  });

  it("shows publications with their bold, italics and a link that opens (#218)", () => {
    render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" today={today} />);
    const publication = screen.getByRole("heading", { name: "Publications" }).closest("section")!;
    expect(publication).toHaveTextContent(
      "Doe, J., & Vermeer, K. (2016). Trust in automated scheduling: A field study with dispatch planners. Proceedings of the Delft Design Conference, 4, 112–121. doi.org/10.5555/12345678",
    );
    expect(within(publication).getByText("Doe, J.").tagName).toBe("STRONG");
    expect(within(publication).getByText("Proceedings of the Delft Design Conference").tagName).toBe("EM");
    expect(within(publication).getByRole("link", { name: "doi.org/10.5555/12345678" })).toHaveAttribute(
      "href",
      "https://doi.org/10.5555/12345678",
    );
  });

  it("leaves out empty sections", () => {
    render(
      <ResumeDocument
        theme={theme({ layout: "SPLIT" })}
        profile={{ ...profile, basics: { ...profile.basics, summary: "" }, skills: [], languages: [], projects: [], education: [], publications: [] }}
        paper="LETTER"
      />,
    );
    expect(sectionTitles()).toEqual(["Contact", "Experience"]);
  });

  it("sizes the page for the paper", () => {
    const { rerender } = render(<ResumeDocument theme={editorial} profile={profile} paper="A4" />);
    const page = screen.getByRole("article", { name: "Resume" });
    expect(page.style.getPropertyValue("--page-height")).toBe("905");
    rerender(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" />);
    expect(page.style.getPropertyValue("--page-height")).toBe("828");
  });

  it.each(LANGUAGE_SAMPLES.map((sample) => [sample.language, sample] as const))(
    "marks the %s sample with its language and direction (E5-8)",
    (language, sample) => {
      render(<ResumeDocument theme={editorial} profile={sampleProfile(sample)} paper="LETTER" language={language} />);
      const page = screen.getByRole("article", { name: "Resume" });
      expect(page).toHaveAttribute("dir", ["Arabic", "Persian"].includes(language) ? "rtl" : "ltr");
      expect(page.getAttribute("lang")).toBeTruthy();
      expect(page).toHaveTextContent(sample.name);
    },
  );

  it("reads the direction of a base resume from the profile", () => {
    const persian = LANGUAGE_SAMPLES.find((sample) => sample.language === "Persian")!;
    render(<ResumeDocument theme={editorial} profile={sampleProfile(persian)} paper="LETTER" />);
    expect(screen.getByRole("article", { name: "Resume" })).toHaveAttribute("dir", "rtl");
  });

  it("keeps emails, phones and web addresses left to right inside a right-to-left document", () => {
    const persian = LANGUAGE_SAMPLES.find((sample) => sample.language === "Persian")!;
    render(<ResumeDocument theme={editorial} profile={sampleProfile(persian)} paper="LETTER" language="Persian" />);
    expect(screen.getByText("sample@example.com")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("+1 555 010 0000")).toHaveAttribute("dir", "ltr");
    expect(screen.getByText("تهران, ایران")).not.toHaveAttribute("dir");
  });

  it("leaves an English resume left to right, in the page's language", () => {
    render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" />);
    const page = screen.getByRole("article", { name: "Resume" });
    expect(page).toHaveAttribute("dir", "ltr");
    expect(page).not.toHaveAttribute("lang");
  });

  describe("the photo (#224)", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const withPhoto = { ...profile, photo: { src: png, onResumes: true } };
    const photo = () => screen.queryByRole("img", { name: profile.basics.name });

    it("sits at the end of the header, beside the name and contacts", () => {
      render(<ResumeDocument theme={editorial} profile={withPhoto} paper="LETTER" today={today} />);
      const header = photo()!.parentElement!;
      expect(header.tagName).toBe("HEADER");
      expect(header.className).toMatch(/headerWithPhoto/);
      expect(header.lastElementChild).toBe(photo());
      expect(header.firstElementChild).toHaveTextContent(profile.basics.name);
      // Full Stack one-pager omits the tagline under the name.
      expect(header.firstElementChild).not.toHaveTextContent(profile.basics.headline);
      expect(photo()).toHaveAttribute("src", png);
      expect(photo()!.className).toMatch(/photoCircle/);
      expect(photo()!.style.getPropertyValue("--photo-width")).toBe("80");
    });

    it("goes where the theme puts it: the start of the header, above the name, or atop the sidebar", () => {
      const { unmount } = render(
        <ResumeDocument theme={theme({ photoPosition: "HEADER_START" })} profile={withPhoto} paper="LETTER" today={today} />,
      );
      expect(photo()!.parentElement!.firstElementChild).toBe(photo());
      unmount();

      const above = render(
        <ResumeDocument theme={theme({ photoPosition: "ABOVE_NAME" })} profile={withPhoto} paper="LETTER" today={today} />,
      );
      const header = photo()!.parentElement!;
      expect(header.firstElementChild).toBe(photo());
      expect(header.className).not.toMatch(/headerWithPhoto/);
      expect(photo()!.className).toMatch(/photoAbove/);
      above.unmount();

      render(
        <ResumeDocument
          theme={theme({ layout: "SPLIT", photoPosition: "SIDEBAR", photoShape: "ROUNDED" })}
          profile={withPhoto}
          paper="LETTER"
          today={today}
        />,
      );
      const column = photo()!.parentElement!;
      expect(column.tagName).not.toBe("HEADER");
      expect(column.firstElementChild).toBe(photo());
      expect(within(column).getByRole("heading", { name: "Contact" })).toBeInTheDocument();
      expect(photo()!.className).toMatch(/photoRounded/);
      expect(photo()!.style.getPropertyValue("--photo-width")).toBe("104");
    });

    it("moves from the sidebar to the end of the header in a single column", () => {
      render(
        <ResumeDocument
          theme={theme({ layout: "SPLIT", photoPosition: "SIDEBAR" })}
          profile={withPhoto}
          paper="LETTER"
          layout="SINGLE"
          today={today}
        />,
      );
      expect(photo()!.parentElement!.tagName).toBe("HEADER");
      expect(photo()!.parentElement!.lastElementChild).toBe(photo());
    });

    it("draws a portrait 3:4, without rounding", () => {
      render(<ResumeDocument theme={theme({ photoShape: "PORTRAIT" })} profile={withPhoto} paper="LETTER" today={today} />);
      expect(photo()!.style.getPropertyValue("--photo-width")).toBe("72");
      expect(photo()!.style.getPropertyValue("--photo-height")).toBe("96");
      expect(photo()!.className).not.toMatch(/photoCircle|photoRounded/);
    });

    it("follows Show on resumes, unless the application's switch says otherwise", () => {
      const hidden = { ...profile, photo: { src: png, onResumes: false } };
      const cases = [
        { profile: withPhoto, showPhoto: undefined, shown: true },
        { profile: withPhoto, showPhoto: null, shown: true },
        { profile: withPhoto, showPhoto: false, shown: false },
        { profile: hidden, showPhoto: undefined, shown: false },
        { profile: hidden, showPhoto: true, shown: true },
        { profile, showPhoto: true, shown: false },
      ];
      for (const { profile: entry, showPhoto, shown } of cases) {
        const { unmount } = render(
          <ResumeDocument theme={editorial} profile={entry} paper="LETTER" showPhoto={showPhoto} today={today} />,
        );
        expect(photo() !== null).toBe(shown);
        unmount();
      }
    });

    it("leaves the header as it was without a photo", () => {
      render(<ResumeDocument theme={editorial} profile={profile} paper="LETTER" today={today} />);
      const header = screen.getByRole("heading", { level: 1 }).parentElement!;
      expect(header.tagName).toBe("HEADER");
      expect(header.className).not.toMatch(/headerWithPhoto/);
    });
  });
});
