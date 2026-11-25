# Hireloom UI revamp

Visual only. No routes, data, copy meaning, or interactions change. Resume and cover-letter themes stay as they are: those fonts and colours are the printed document, not the app chrome.

## What the research actually supports

Award write-ups (Awwwards, CSSDA, FWA, iF) keep landing on the same two things: one brand system used everywhere, and small motions that confirm an action. Scroll theatre, custom cursors, and 3D show up on campaign sites. They do not belong inside a tool someone uses to track a job search.

Product designers talking about dashboards in 2026 (Linear’s own refresh notes, r/productdesign, SaaS UI roundups) describe a different bar:

- Chrome should sit back. The work surface is what you see.
- Colour is a system, not a single neon accent and not a purple mesh.
- Motion is a signature easing used in a few places, and it respects reduced motion.
- Editorial type carries the brand. Controls and tables stay a plain sans.

What to leave out, because it is the current default “AI made this” look: gradient blobs, glass panels, Inter-everywhere, bounce on every element, three floating orbs, emoji headings, and a masonry layout pasted onto a tracker.

Pinterest’s useful lesson here is not the grid. It is that a card should feel like an object: a quiet resting shadow, and a response when it is actually clickable.

## Direction

**Gallery wall, ink rail, one thread colour.**

Hireloom’s marketing site already uses a clay accent (`#7a3b2e`). The app was near-black on warm beige, so the product and the site did not feel like the same object. The app now uses that clay as the action colour. The sidebar is an ink rail in both schemes, a step darker than the page, so navigation recedes the way Linear’s 2025 refresh describes. The page is a warm white sheet on a stone wall.

Type: Fraunces for titles (already shipped for resume themes, now the UI display face, with a little softness). Geist stays for UI text, because 13px controls need a neutral sans. Newsreader stays on printed resumes and on the marketing site, which does not ship Fraunces.

Motion: one ease, `cubic-bezier(0.22, 1, 0.36, 1)`. Screens fade in. Buttons press in. Clickable cards lift. Menus and dialogs fade. The sign-in panel has a slow thread drift. Nothing loops inside the working app.

## Module plan

| Module | What changes | What stays |
| --- | --- | --- |
| Tokens (`globals.css`) | Gallery and ink surfaces, clay primary, richer status hues, softer shadows, rounder panels, Fraunces titles, shared motion | Contrast targets already documented in the file (AA for text, 3:1 for field borders and focus) |
| Shell | Ink sidebar via local token overrides, active item marked with a thread bar, page fade between screens | Collapse, theme cookie, skip link, badges |
| Sign-in and OAuth | Split sign-in: form on the sheet, tagline on the ink panel with the thread field. OAuth picks up the new type and colour | Form fields, errors, session behaviour |
| Buttons, fields, chips, tabs | Press and colour transitions. Focus ring stays ink | Variants, sizes, labels |
| Cards, menus, dialogs, toasts | Resting shadow on panels. Hover lift only on cards that are links or buttons. Menus keep their own shadow. Dialogs fade | Focus trap, keyboard behaviour |
| Dashboard | Inherits the sheet, serif figures, and status colour. No new charts | Funnel math, period filter, calendar |
| Applications board and table | Board cards deepen their shadow on hover, without moving, so drag is unchanged | Drag, menus, status rules |
| Application, profile, resume workspace, jobs, startups, inbox, agent, settings, new application | Inherit tokens, type, and shared components | Every action, including theme builder output and PDF rendering |
| Marketing site (`site/style.css`) | Same clay, stone, and ink tokens, same ease | Newsreader, because that folder does not include Fraunces |

## Second pass

The first pass stayed too close to the old dark UI: a small colour shift and a fade you can miss. This pass is meant to be obvious on every screen.

- The margin around the page is darker than the sheet and carries a clay wash that drifts.
- Page titles are 52px. A clay rule sits under every page bar.
- Primary buttons are the same saturated clay in light and dark.
- Panels have a clay rail on the left. Dashboard, calendar, and clickable cards lift on hover.
- Changing screens slides the content up under a bar that stays put.

## Out of scope

- Document themes, PDF layout, and theme-builder output
- Any change to what a control does
- Mobile layout (the product is desktop-only)
