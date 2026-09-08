"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function IssueGiftCardForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    code:           randomCode(),
    amount:         "",
    issuedToEmail:  "",
    expiresAt:      "",
    notes:          "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) { setError("Amount must be greater than zero."); return; }
    if (!form.code.trim()) { setError("Code is required."); return; }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code:          form.code.trim().toUpperCase(),
          amount,
          issuedToEmail: form.issuedToEmail.trim() || undefined,
          expiresAt:     form.expiresAt || undefined,
          notes:         form.notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/admin/gift-cards/${data.giftCard.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  const fields: { label: string; key: keyof typeof form; type?: string; placeholder?: string; required?: boolean }[] = [
    { label: "Gift Card Code",  key: "code",          placeholder: "XXXX-XXXX-XXXX-XXXX", required: true },
    { label: "Amount ($)",      key: "amount",        type: "number", placeholder: "50.00", required: true },
    { label: "Recipient Email", key: "issuedToEmail", type: "email",  placeholder: "customer@example.com" },
    { label: "Expires At",      key: "expiresAt",     type: "date" },
    { label: "Internal Notes",  key: "notes",         placeholder: "e.g. issued as compensation" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text-subtle block">
              {f.label}
              {f.required && <span className="text-accent ml-1">*</span>}
            </label>
            {f.key === "code" && (
              <button
                type="button"
                onClick={() => set("code", randomCode())}
                className="font-body text-[10px] tracking-[0.08em] uppercase text-accent hover:text-text-muted transition-colors duration-150"
              >
                Regenerate
              </button>
            )}
          </div>
          <input
            type={f.type ?? "text"}
            value={form[f.key]}
            onChange={(e) => set(f.key, e.target.value)}
            placeholder={f.placeholder}
            step={f.type === "number" ? "0.01" : undefined}
            min={f.type === "number" ? "0.01" : undefined}
            className="w-full bg-bg border border-border px-3 py-3 font-body text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none transition-colors duration-200 font-mono"
          />
        </div>
      ))}

      {error && (
        <p className="font-body text-sm text-error bg-error/5 border border-error/20 px-4 py-3">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-text text-text-inverse font-body text-[11px] tracking-[0.15em] uppercase hover:bg-accent hover:text-text-on-gold transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? "Issuing…" : "Issue Gift Card"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-border text-text-muted font-body text-[11px] tracking-[0.12em] uppercase hover:border-text-muted transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
