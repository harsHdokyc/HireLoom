import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandMark } from "@/components/brand-mark";
import { getSession } from "@/lib/auth/session";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

/** Password-only sign-in, outside the app shell (PRD AUTH-1, AUTH-8). */
export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) redirect("/");
  const { next } = await searchParams;

  return (
    <main className="grid min-h-dvh bg-paper min-[960px]:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <div className="flex items-center justify-center bg-surface px-8 py-12">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          <div className="flex flex-col items-start gap-3">
            <BrandMark className="size-10" />
            <div className="flex flex-col gap-1">
              <div className="font-serif text-[34px] leading-none font-medium tracking-[-0.03em]">Hireloom</div>
              <div className="text-sm text-muted">Your job search, on your server</div>
            </div>
          </div>
          <LoginForm next={typeof next === "string" ? next : undefined} />
          <p className="text-meta leading-[1.6] text-pretty text-muted">
            Your password is set on the server, as a hash in{" "}
            <code className="font-mono text-label">HIRELOOM_PASSWORD</code>. Forgot it? Make a new hash with{" "}
            <code className="font-mono text-label">hash-password</code> and restart.
          </p>
        </div>
      </div>
      <div aria-hidden="true" className="scheme-ink thread-field relative hidden min-[960px]:flex min-[960px]:items-end bg-sidebar p-14">
        <p className="relative z-10 max-w-[440px] font-serif text-[56px] leading-[0.96] font-medium tracking-[-0.03em] text-pretty text-ink">
          Your job search,
          <span className="mt-2 block font-normal">on your server.</span>
        </p>
      </div>
    </main>
  );
}
