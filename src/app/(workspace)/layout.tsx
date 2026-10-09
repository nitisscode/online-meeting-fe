import { Suspense } from "react";

import { WorkspaceHeader } from "@/components/layout/workspace-header";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Suspense fallback={<div className="h-16 border-b border-line bg-sand" />}>
        <WorkspaceHeader />
      </Suspense>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
