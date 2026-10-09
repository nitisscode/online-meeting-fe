import Link from "next/link";

import { ROUTES } from "@/constants/routes";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16">
      <h1 className="font-display text-4xl text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-soft">That meeting or page is not available.</p>
      <Link href={ROUTES.dashboard} className="mt-6 text-sm font-semibold text-pine">
        Back to meetings
      </Link>
    </main>
  );
}
