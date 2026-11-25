import { describe, expect, it } from "vitest";

import { demoProfile, demoResumeUnits } from "@/lib/demo-profile";
import type { ProfileData } from "@/lib/profile";

import { achievementBullets, contactItems, displayLink, parseResumeLinks, resumeContent } from "./resume-content";

const today = new Date(2026, 8, 28);

describe("contactItems", () => {
  const { basics } = demoProfile();

  it("lists phone, email, LinkedIn, website, then city and country, with openable links", () => {
    expect(contactItems(basics, today)).toEqual([
      { label: "+31 6 1234 5678", href: "tel:+31612345678" },
      { label: "jane.doe@example.com", href: "mailto:jane.doe@example.com" },
      { label: "LinkedIn", href: "https://linkedin.com/in/janedoe-example" },
      { label: "example.com", href: "https://example.com/" },
      { label: "Rotterdam, Netherlands", href: null },
    ]);
  });

  it("adds the age only when show-age is on", () => {
    expect(contactItems({ ...basics, showAge: true }, today).at(-1)).toEqual({ label: "Age 34", href: null });
    expect(contactItems({ ...basics, showAge: true, dob: "" }, today)).toHaveLength(5);
  });

  it("skips what's empty", () => {
    expect(contactItems({ ...basics, phone: " ", city: "", website: "" }, today)).toEqual([
      { label: "jane.doe@example.com", href: "mailto:jane.doe@example.com" },
      { label: "LinkedIn", href: "https://linkedin.com/in/janedoe-example" },
      { label: "Netherlands", href: null },
    ]);
  });
});

describe("parseResumeLinks", () => {
  it("reads labeled lines and bare URLs", () => {
    expect(
      parseResumeLinks("GitHub: https://github.com/you/repo\nLive | https://app.example.com\nhttps://docs.example.com/x/"),
    ).toEqual([
      { label: "GitHub", href: "https://github.com/you/repo" },
      { label: "Live", href: "https://app.example.com/" },
      { label: "docs.example.com/x", href: "https://docs.example.com/x/" }, // bare URL keeps a short label
    ]);
  });

  it("keeps a plain label when there is no URL yet", () => {
    expect(parseResumeLinks("GitHub")).toEqual([{ label: "GitHub", href: null }]);
  });
});

describe("achievementBullets", () => {
  it("splits facts into bullets, strips leading dashes, and joins soft wraps", () => {
    expect(
      achievementBullets([
        {
          text: "- Solved 150+ DSA problems.\n- Won hackathons; self-financed college\neducation.\n- Solo travel across 18 states.",
        },
        { text: "  Climbed four peaks.  " },
      ]),
    ).toEqual([
      "Solved 150+ DSA problems.",
      "Won hackathons; self-financed college education.",
      "Solo travel across 18 states.",
      "Climbed four peaks.",
    ]);
  });
});

describe("resumeContent", () => {
  const profile = demoProfile();

  it("builds the base resume from the profile", () => {
    const content = resumeContent(profile, { today });
    expect(content.name).toBe("Jane Doe");
    expect(content.experience.map((role) => [role.company, role.dates])).toEqual([
      ["Northwind Logistics", "Mar 2021 – Present"],
      ["Fieldnote", "Jun 2018 – Feb 2021"],
      ["Studio Brik", "Sep 2015 – May 2018"],
    ]);
    expect(content.experience[0].bullets).toHaveLength(3);
    expect(content.experience[2].skills).toEqual(["HTML & CSS", "Interaction design"]);
    expect(content.education[0]).toMatchObject({ dates: "2013 – 2015", notes: "Thesis on trust in automated scheduling tools" });
    expect(content.skills).toBe(
      "Interaction design · Design systems · Prototyping · User research · Figma · HTML & CSS · Workshop facilitation",
    );
    expect(content.languages).toBe("Dutch: Native · English: Fluent (C2) · German: Intermediate (B1)");
  });

  it("includes references only when asked", () => {
    expect(resumeContent(profile).references).toEqual([]);
    expect(resumeContent(profile, { includeReferences: true }).references[0]).toEqual({
      id: "r1",
      name: "John Doe",
      role: "Former manager, Northwind Logistics",
      contact: "john.doe@example.com",
    });
  });

  it("leaves an empty profile empty, apart from a placeholder name", () => {
    const empty: ProfileData = {
      basics: { ...profile.basics, ...Object.fromEntries(Object.keys(profile.basics).map((key) => [key, ""])), showAge: false },
      skills: [],
      languages: [],
      experience: [],
      projects: [],
      education: [],
      publications: [],
      references: [],
      facts: [],
      photo: null,
    };
    expect(resumeContent(empty)).toEqual({
      name: "Your name",
      headline: "",
      photo: null,
      contacts: [],
      summary: "",
      experience: [],
      projects: [],
      education: [],
      publications: [],
      achievements: [],
      skills: "",
      languages: "",
      references: [],
    });
  });

  it("takes a tailored resume's text from its units", () => {
    const content = resumeContent(profile, { units: demoResumeUnits() });
    expect(content.summary).toMatch(/^Senior product designer with nine years of making complex/);
    expect(content.experience[0].bullets[0]).toBe(
      "Led the redesign of the carrier portal used daily by 4,000+ dispatchers: a dense, high-stakes workflow",
    );
    // Role skills still come from the profile (RES-6).
    expect(content.experience[0].skills).toContain("Design systems");
    expect(content.skills).toMatch(/^Design systems · User research · Figma · /);
    expect(content.languages).toBe("Dutch: Native · English: Fluent (C2) · German: Intermediate (B1)");
  });

  it("lays out projects like roles, with their link as a resume shows it (PRO-13)", () => {
    expect(resumeContent(profile).projects[0]).toMatchObject({
      id: "p1",
      name: "Tidewater design tokens",
      links: [{ label: "GitHub", href: "https://github.com/janedoe/tidewater" }],
      dates: "Jan 2023 – Present",
      skills: ["Design systems", "Figma", "HTML & CSS"],
    });
    expect(resumeContent(profile).experience[0]).toMatchObject({
      company: "Northwind Logistics",
      location: expect.any(String),
    });
    expect(displayLink("https://www.example.com/work/")).toBe("example.com/work");
    expect(displayLink(" http://github.com/jane ")).toBe("github.com/jane");
    // A tailored resume takes a project's bullets from its unit, and leaves out one without a unit.
    const tailored = resumeContent(profile, { units: [{ id: "project:p1", label: "Tidewater project", text: "Shipped a token pipeline" }] });
    expect(tailored.projects.map((project) => project.bullets)).toEqual([["Shipped a token pipeline"]]);
    expect(resumeContent(profile, { units: [] }).projects).toEqual([]);
  });

  it("shows publications word for word, with their link, and not the ones kept off resumes (#218)", () => {
    expect(resumeContent(profile).publications).toEqual([
      {
        id: "u1",
        citation: profile.publications[0].citation,
        link: "doi.org/10.5555/12345678",
        href: "https://doi.org/10.5555/12345678",
      },
    ]);
    const hidden = { ...profile, publications: [{ ...profile.publications[0], onResumes: false }, { id: "u2", citation: " ", link: "", onResumes: true }] };
    expect(resumeContent(hidden).publications).toEqual([]);
    // A tailored resume takes the citation from its unit, and a DOI on its own opens at doi.org.
    const doi = { ...profile, publications: [{ ...profile.publications[0], link: "10.1038/s41388-024-03270-3" }] };
    expect(resumeContent(doi, { units: [{ id: "publication:u1", label: "Publication", text: "Doe, J. (2016). *Edited.*" }] }).publications).toEqual([
      { id: "u1", citation: "Doe, J. (2016). *Edited.*", link: "doi.org/10.1038/s41388-024-03270-3", href: "https://doi.org/10.1038/s41388-024-03270-3" },
    ]);
    expect(resumeContent(profile, { units: [] }).publications).toEqual([]);
  });

  it("includes only the parts a tailored resume has units for, in their order", () => {
    const units = [
      { id: "experience:e2", label: "Fieldnote role", text: "Ran research" },
      { id: "experience:e1", label: "Northwind Logistics role", text: "Led the portal redesign" },
      { id: "experience:gone", label: "Deleted role", text: "Ignored" },
      { id: "education:d1", label: "MSc", text: "" },
    ];
    const content = resumeContent(profile, { units });
    expect(content.summary).toBe("");
    expect(content.experience.map((role) => [role.company, role.bullets])).toEqual([
      ["Fieldnote", ["Ran research"]],
      ["Northwind Logistics", ["Led the portal redesign"]],
    ]);
    expect(content.education.map((entry) => entry.school)).toEqual(["TU Delft"]);
    expect(content.skills).toBe("");
    expect(content.languages).toBe("");
  });
});
