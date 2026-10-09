"use client";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-sand px-6 py-8">
      <h1 className="font-display text-3xl text-ink">This page could not be loaded</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The meeting service may be offline, or the session may have ended. Try again, or sign in once more.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-full bg-pine px-4 py-2 text-sm font-semibold text-sand"
      >
        Try again
      </button>
    </div>
  );
}
