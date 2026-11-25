// Where Hireloom's releases are published, for the update check and its
// notice (update-check.ts, the sidebar). Safe to use in the browser.

/** Empty while this install has no public release feed. */
export const RELEASES_REPOSITORY = "";
/** The repository's page, for credits and support (the sidebar). */
export const REPOSITORY_URL = "";
/** How to update. */
export const UPGRADE_GUIDE_URL = "./README.md";

/** A published release: its version, without the "v", and its page on GitHub. */
export type Release = { version: string; url: string };
