"use client";
import { useState } from "react";

export function DebugCounter() {
  const [n, setN] = useState(0);
  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20,
      background: "lime", zIndex: 99999,
      padding: "12px 16px", fontSize: 16, fontFamily: "monospace",
      border: "2px solid black", borderRadius: 8
    }}>
      <button
        onClick={() => setN(n + 1)}
        style={{ fontSize: 16, padding: "4px 12px", cursor: "pointer" }}
      >
        CLICK ME: {n}
      </button>
    </div>
  );
}
