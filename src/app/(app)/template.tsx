import type { ReactNode } from "react";

/** Remounts on navigation. Content under the sticky bar rises in; the bar itself does not move. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="screen flex min-h-0 w-full min-w-0 flex-1 flex-col">{children}</div>;
}
