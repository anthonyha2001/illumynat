"use client";

import { useState } from "react";

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="font-body text-[10px] tracking-widest uppercase text-text-muted border border-border px-3 py-1.5 hover:border-accent hover:text-accent transition-colors duration-150"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
