import type { Metadata } from "next";
import Link from "next/link";

import { JoinForm } from "@/components/meetings/join-form";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Join meeting",
};

export default function JoinPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl tracking-tight text-ink">Join a meeting</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Enter the meeting code. Add the passcode only when the host set one. The meeting has to be live.
        </p>
        <Link href={ROUTES.dashboard} className="mt-3 inline-flex text-sm font-semibold text-pine">
          See all meetings
        </Link>
      </div>
      <JoinForm />
    </section>
  );
}
