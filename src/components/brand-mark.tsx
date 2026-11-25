import { cn } from "@/lib/cn";

/** Hireloom's "H" mark, as in src/app/icon.svg, in the primary colours, so it turns light in the dark scheme. Decorative: put the name next to it. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <rect width="64" height="64" rx="14.08" className="fill-primary" />
      <path
        className="fill-on-primary"
        d="M18 14h9v13.5h10V14h9v36h-9V35.5H27V50h-9V14z"
      />
    </svg>
  );
}
