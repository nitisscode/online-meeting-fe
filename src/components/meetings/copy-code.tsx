"use client";

import { useState } from "react";

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <code className="rounded-lg bg-paper px-3 py-1 font-mono text-sm tracking-widest text-ink">{code}</code>
      <button type="button" onClick={onCopy} className="text-sm font-medium text-pine">
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
