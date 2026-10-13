import Link from "next/link";

import { ROUTES } from "@/constants/routes";

export function Brand({ href = ROUTES.home }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-ink">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/meetly.svg" alt="" className="h-8 w-auto" />
      <span className="text-lg font-semibold tracking-tight">Meetly</span>
    </Link>
  );
}
