"use client";

import { useEffect, useState } from "react";

interface Props {
  expiresAt: string; // ISO string
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ expiresAt }: Props) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ d, h, m, s });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (expired) return (
    <p className="font-body text-sm text-error tracking-widest uppercase">This offer has expired.</p>
  );

  if (!timeLeft) return null;

  const units = timeLeft.d > 0
    ? [{ label: "Days", val: timeLeft.d }, { label: "Hours", val: timeLeft.h }, { label: "Min", val: timeLeft.m }, { label: "Sec", val: timeLeft.s }]
    : [{ label: "Hours", val: timeLeft.h }, { label: "Min", val: timeLeft.m }, { label: "Sec", val: timeLeft.s }];

  return (
    <div className="flex items-end gap-4">
      {units.map(({ label, val }, i) => (
        <div key={label} className="flex items-end gap-4">
          <div className="text-center">
            <p className="font-display text-4xl md:text-5xl font-light text-text-inverse leading-none tabular-nums">
              {pad(val)}
            </p>
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-text-inverse/40 mt-1">{label}</p>
          </div>
          {i < units.length - 1 && (
            <p className="font-display text-3xl text-text-inverse/30 mb-1">:</p>
          )}
        </div>
      ))}
    </div>
  );
}
