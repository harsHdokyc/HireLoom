import type { Unit } from "@/lib/application-data";
import { ageLabel, ENGLISH_LABELS, languagesLine, type DocumentLabels } from "@/lib/document-labels";
import { publicationHref, publicationLink } from "@/lib/citation";
import { ageOn, factTexts, formatDateRange, resumePublications, type Basics, type ProfileData } from "@/lib/profile";

// What a resume shows, worked out from the profile (the base resume) or from
// a tailored document's units, so the renderer only has to lay it out.

/** A contact or project link as the resume shows and opens it. */
export type ResumeLink = {
  /** What appears on the page ("LinkedIn", "GitHub", "example.com"). */
  label: string;
  /** http(s) / mailto / tel to open, or null when it isn't a real link. */
  href: string | null;
};

export type ResumeContent = {
  name: string;
  headline: string;
  /** The profile photo's data URL, or null when the resume has none (#224). */
  photo: string | null;
  /** Email, phone, LinkedIn, website, "City, Country" and "Age N", whichever are filled in. */
  contacts: ResumeLink[];
  summary: string;
  experience: {
    id: string;
    role: string;
    company: string;
    /** City / remote line under the role. */
    location: string;
    dates: string;
    bullets: string[];
    /** The skills used in the role (RES-6). */
    skills: string[];
  }[];
  /** Projects (PRO-13), laid out like roles. */
  projects: {
    id: string;
    name: string;
    /** Links on the title line (GitHub, Live, …). */
    links: ResumeLink[];
    dates: string;
    bullets: string[];
    skills: string[];
  }[];
  education: { id: string; degree: string; school: string; dates: string; notes: string }[];
  /** Publications (#218), word for word, in the profile's order. */
  publications: {
    id: string;
    /** As written, with **bold** and *italic*. */
    citation: string;
    /** "doi.org/10.1038/…", without "https://". */
    link: string;
    /** What the link opens, or null when it isn't a web address. */
    href: string | null;
  }[];
  /** Profile "Facts about me", as Achievements bullets on the Full Stack one-pager. */
  achievements: string[];
  /** "Figma · User research · …" */
  skills: string;
  /** "Dutch: Native · English: Fluent (C2)" */
  languages: string;
  references: { id: string; name: string; role: string; contact: string }[];
};

export type ResumeOptions = {
  /** A tailored document's units; they replace the profile's text (APP-4). */
  units?: Unit[];
  /** Settings → "Include references" (SET-9). */
  includeReferences?: boolean;
  /** An application's Photo switch (#224); null or left out follows the profile's "Show on resumes". */
  showPhoto?: boolean | null;
  /** For "Age N"; defaults to now. */
  today?: Date;
};

/** The separator between contact details on one line. */
export const CONTACT_SEPARATOR = " | ";

/** A link as a resume shows it: "https://www.example.com/x/" is "example.com/x". */
export const displayLink = (link: string) =>
  link
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");

/** mailto: / tel: / http(s) for a contact detail, or null when it isn't openable. */
export function contactHref(kind: "phone" | "email" | "web", value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (kind === "email") return trimmed.includes("@") ? `mailto:${trimmed}` : null;
  if (kind === "phone") {
    const digits = trimmed.replace(/[^\d+]/g, "");
    return digits.length >= 7 ? `tel:${digits}` : null;
  }
  return publicationHref(trimmed);
}

/** Short label for LinkedIn / GitHub / a personal site. */
export function webContactLabel(kind: "linkedin" | "website", value: string): string {
  if (kind === "linkedin") return "LinkedIn";
  const host = displayLink(value).split("/")[0]?.toLowerCase() ?? "";
  if (host.includes("github.com")) return "GitHub";
  if (host.includes("gitlab.com")) return "GitLab";
  if (host.includes("bitbucket.org")) return "Bitbucket";
  return displayLink(value) || value.trim();
}

/** Contact details in the order the resume header lists them. */
export function contactItems(basics: Basics, today = new Date(), labels = ENGLISH_LABELS): ResumeLink[] {
  const age = basics.showAge ? ageOn(basics.dob, today) : null;
  const items: ResumeLink[] = [
    { label: basics.phone.trim(), href: contactHref("phone", basics.phone) },
    { label: basics.email.trim(), href: contactHref("email", basics.email) },
    {
      label: basics.linkedin.trim() ? webContactLabel("linkedin", basics.linkedin) : "",
      href: contactHref("web", basics.linkedin),
    },
    {
      label: basics.website.trim() ? webContactLabel("website", basics.website) : "",
      href: contactHref("web", basics.website),
    },
    {
      label: [basics.city, basics.country].map((part) => part.trim()).filter(Boolean).join(", "),
      href: null,
    },
    { label: age === null ? "" : ageLabel(age, labels), href: null },
  ];
  return items.filter((item) => item.label);
}

/** True when the text looks like a web address (not a bare label such as "GitHub"). */
export function looksLikeWebAddress(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  // host.tld… — rejects single words like "GitHub" that publicationHref would still open.
  return /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(?:[/:?#].*)?$/i.test(trimmed);
}

/**
 * One or more project links from the profile field. Each line may be a bare
 * URL, or `Label: url` / `Label | url` (e.g. GitHub + Live on one project).
 */
export function parseResumeLinks(raw: string): ResumeLink[] {
  return raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((part) => {
      const labeled = /^([^:|]+)\s*[:|]\s*(.+)$/.exec(part);
      if (labeled) {
        const label = labeled[1].trim();
        const target = labeled[2].trim();
        // Don't treat "https://…" as Label: url (the scheme has a colon).
        if (!/^https?$/i.test(label) && looksLikeWebAddress(target)) {
          return { label: label || webContactLabel("website", target) || target, href: publicationHref(target) };
        }
      }
      if (!looksLikeWebAddress(part)) return { label: part, href: null };
      return { label: webContactLabel("website", part), href: publicationHref(part) };
    })
    .filter((link) => link.label);
}

/**
 * Profile facts as Achievements bullets. A line that starts with "- " (or •/*)
 * begins a bullet; other lines continue the previous one (soft wraps in the
 * facts field).
 */
export function achievementBullets(facts: { text: string }[]): string[] {
  const bullets: string[] = [];
  for (const text of factTexts(facts)) {
    let startOfFact = true;
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (startOfFact || /^[-•*]\s+/.test(trimmed)) {
        bullets.push(trimmed.replace(/^[-•*]\s+/, ""));
        startOfFact = false;
      } else {
        bullets[bullets.length - 1] += ` ${trimmed}`;
      }
    }
  }
  return bullets;
}

const lines = (text: string) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** What the resume shows, with its dates and levels in the words of `labels`. */
export function resumeContent(
  profile: ProfileData,
  { units, includeReferences = false, showPhoto, today = new Date() }: ResumeOptions = {},
  labels: DocumentLabels = ENGLISH_LABELS,
): ResumeContent {
  const { basics } = profile;
  const skillNames = new Map(profile.skills.map((skill) => [skill.id, skill.name]));
  const dates = { locale: labels.locale, present: labels.present };

  const experience = (entry: ProfileData["experience"][number], bullets: string) => ({
    id: entry.id,
    role: entry.role.trim(),
    company: entry.company.trim(),
    location: entry.location.trim(),
    dates: formatDateRange(entry, dates),
    bullets: lines(bullets),
    skills: entry.skillIds.flatMap((id) => skillNames.get(id) ?? []),
  });
  const project = (entry: ProfileData["projects"][number], bullets: string) => ({
    id: entry.id,
    name: entry.name.trim(),
    links: parseResumeLinks(entry.link),
    dates: formatDateRange(entry, dates),
    bullets: lines(bullets),
    // Tech stack on the title line for the one-page Full Stack layout.
    skills: entry.skillIds.flatMap((id) => skillNames.get(id) ?? []),
  });
  const publication = (entry: ProfileData["publications"][number], citation: string) => ({
    id: entry.id,
    citation: citation.trim(),
    link: displayLink(publicationLink(entry.link)),
    href: publicationHref(entry.link),
  });
  const education = (entry: ProfileData["education"][number], notes: string) => ({
    id: entry.id,
    degree: entry.degree.trim(),
    school: entry.school.trim(),
    dates: formatDateRange(entry, dates),
    notes: notes.trim(),
  });

  const content: ResumeContent = {
    name: basics.name.trim() || "Your name",
    headline: basics.headline.trim(),
    photo: profile.photo && (showPhoto ?? profile.photo.onResumes) ? profile.photo.src : null,
    contacts: contactItems(basics, today, labels),
    summary: basics.summary.trim(),
    experience: profile.experience.map((entry) => experience(entry, entry.bullets)),
    projects: profile.projects.map((entry) => project(entry, entry.bullets)),
    education: profile.education.map((entry) => education(entry, entry.notes)),
    publications: resumePublications(profile.publications).map((entry) => publication(entry, entry.citation)),
    achievements: achievementBullets(profile.facts),
    skills: profile.skills.map((skill) => skill.name).join(" · "),
    languages: languagesLine(profile.languages, labels),
    references: includeReferences
      ? profile.references.map((reference) => ({
          id: reference.id,
          name: reference.name.trim(),
          role: [reference.relation, reference.company].map((part) => part.trim()).filter(Boolean).join(", "),
          contact: [reference.email, reference.phone].map((part) => part.trim()).filter(Boolean).join(" · "),
        }))
      : [],
  };

  if (units) {
    // A tailored resume holds exactly what its units hold, in their order:
    // a role, project, degree or publication without a unit was left out on purpose.
    const text = (id: string) => units.find((unit) => unit.id === id)?.text ?? "";
    const withUnit = <T extends { id: string }>(prefix: string, entries: T[]) =>
      units.flatMap((unit) => {
        if (!unit.id.startsWith(prefix)) return [];
        const entry = entries.find(({ id }) => `${prefix}${id}` === unit.id);
        return entry ? [{ entry, text: unit.text }] : [];
      });

    content.summary = text("summary").trim();
    content.skills = text("skills").trim();
    content.languages = text("languages").trim();
    content.experience = withUnit("experience:", profile.experience).map(({ entry, text }) =>
      experience(entry, text),
    );
    content.projects = withUnit("project:", profile.projects).map(({ entry, text }) => project(entry, text));
    content.education = withUnit("education:", profile.education).map(({ entry, text }) =>
      education(entry, text),
    );
    content.publications = withUnit("publication:", profile.publications).flatMap(({ entry, text }) =>
      text.trim() ? [publication(entry, text)] : [],
    );
    // Achievements stay from the profile (facts aren't tailored as units).
  }

  return content;
}
