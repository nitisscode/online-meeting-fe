import { logout } from "@/app/actions/auth";
import { Brand } from "@/components/layout/brand";
import { displayName } from "@/lib/format";
import { getCurrentUser } from "@/lib/meetings/api";
import { ROUTES } from "@/constants/routes";
import Link from "next/link";

export async function WorkspaceHeader() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-line bg-sand/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Brand href={ROUTES.dashboard} />
        <div className="flex items-center gap-4">
          <p className="hidden text-sm text-ink-soft sm:block">{displayName(user)}</p>
          <Link href={ROUTES.newMeeting} className="text-sm font-semibold text-pine">
            New meeting
          </Link>
          <form action={logout}>
            <button type="submit" className="text-sm font-medium text-ink">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
