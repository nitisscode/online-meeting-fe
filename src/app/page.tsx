import Link from "next/link";

import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ROUTES } from "@/constants/routes";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-4 py-5">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Brand />
          <nav className="flex items-center gap-4 text-sm">
            <ThemeToggle />
            <Link href={ROUTES.login} className="font-medium text-ink">
              Sign in
            </Link>
            <Link href={ROUTES.signup} className="rounded-full bg-pine px-4 py-2 font-semibold text-foam">
              Create account
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-16">
        <p className="text-sm font-semibold tracking-wide text-pine uppercase">Meeting workspace</p>
        <h1 className="mt-3 max-w-2xl font-display text-5xl tracking-tight text-ink sm:text-6xl">
          Host the meeting. Keep the record.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          Sign in, schedule a room, and set who can chat, share a screen, or wait to be admitted. This app talks to
          the Django API. Live video and AI notes are not in this app yet.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={ROUTES.signup} className="rounded-full bg-pine px-5 py-3 text-sm font-semibold text-foam">
            Get started
          </Link>
          <Link href={ROUTES.login} className="rounded-full border border-line bg-sand px-5 py-3 text-sm font-semibold text-ink">
            I already have an account
          </Link>
        </div>
      </main>
    </div>
  );
}
