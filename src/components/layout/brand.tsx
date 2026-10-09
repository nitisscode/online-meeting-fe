import Link from "next/link";

import { ROUTES } from "@/constants/routes";

export function Brand({ href = ROUTES.home }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-ink">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-pine text-sm font-semibold text-sand">
        Om
      </span>
      <span className="font-display text-lg tracking-tight">Online Meeting</span>
    </Link>
  );
}
