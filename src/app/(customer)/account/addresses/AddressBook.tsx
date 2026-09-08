"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

interface Address {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// ── Address form ──────────────────────────────────────────
interface FormState {
  label: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const EMPTY_FORM: FormState = {
  label: "", firstName: "", lastName: "",
  addressLine1: "", addressLine2: "",
  city: "", state: "", zipCode: "", country: "LB",
  isDefault: false,
};

function AddressForm({
  initial,
  onSave,
  onCancel,
  isFirst,
}: {
  initial?: Partial<FormState>;
  onSave: (data: FormState) => Promise<void>;
  onCancel: () => void;
  isFirst?: boolean;
}) {
  const [form, setForm]     = useState<FormState>({ ...EMPTY_FORM, ...initial });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-surface border border-border-subtle p-6">
      <Input
        label="Label (optional)"
        value={form.label}
        onChange={set("label")}
        placeholder="Home, Work, Parents…"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" required value={form.firstName} onChange={set("firstName")} />
        <Input label="Last Name"  required value={form.lastName}  onChange={set("lastName")} />
      </div>
      <Input label="Address"          required value={form.addressLine1} onChange={set("addressLine1")} placeholder="Street address" />
      <Input label="Apt, suite, etc." value={form.addressLine2} onChange={set("addressLine2")} placeholder="Optional" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="City"    required value={form.city}  onChange={set("city")} />
        <Input label="State / Region" required value={form.state} onChange={set("state")} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="ZIP Code" required value={form.zipCode} onChange={set("zipCode")} />
        <Input label="Country"  required value={form.country} onChange={set("country")} />
      </div>

      {!isFirst && (
        <label className="flex items-center gap-3 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
          <span className="font-body text-sm text-text-subtle">Set as default address</span>
        </label>
      )}

      {error && (
        <p className="font-body text-sm text-error">{error}</p>
      )}

      <div className="flex items-center gap-4 pt-2">
        <Button type="submit" variant="primary" size="md" loading={loading}>
          Save Address
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="font-body text-[11px] tracking-[0.12em] uppercase text-text-muted hover:text-text transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Address card ──────────────────────────────────────────
function AddressCard({
  address,
  onSetDefault,
  onDelete,
  onEdit,
}: {
  address: Address;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (address: Address) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    onDelete(address.id);
  }

  return (
    <div className={cn(
      "bg-surface border p-5 flex flex-col gap-3 transition-opacity duration-300",
      address.isDefault ? "border-accent" : "border-border-subtle",
      deleting && "opacity-40 pointer-events-none"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {address.label && (
            <p className="font-body text-[10px] tracking-widest uppercase text-accent mb-1">
              {address.label}
            </p>
          )}
          {address.isDefault && (
            <span className="inline-block font-body text-[10px] tracking-widest uppercase bg-accent/10 text-accent px-2 py-0.5 mb-2">
              Default
            </span>
          )}
        </div>
      </div>

      <address className="font-body text-sm text-text not-italic leading-relaxed">
        {address.firstName} {address.lastName}<br />
        {address.addressLine1}
        {address.addressLine2 && <>, {address.addressLine2}</>}<br />
        {address.city}, {address.state} {address.zipCode}<br />
        {address.country}
      </address>

      <div className="flex items-center gap-4 pt-1 border-t border-border-subtle">
        <button
          onClick={() => onEdit(address)}
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-text transition-colors duration-200"
        >
          Edit
        </button>
        {!address.isDefault && (
          <button
            onClick={() => onSetDefault(address.id)}
            className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-200"
          >
            Set Default
          </button>
        )}
        <button
          onClick={handleDelete}
          className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-error transition-colors duration-200 ml-auto"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export function AddressBook({ addresses: initial }: { addresses: Address[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>(initial);
  const [mode, setMode]           = useState<"list" | "add" | "edit">("list");
  const [editing, setEditing]     = useState<Address | null>(null);

  function refresh() { router.refresh(); }

  async function handleAdd(form: FormState) {
    const res  = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setAddresses((prev) => {
      const updated = form.isDefault || prev.length === 0
        ? prev.map((a) => ({ ...a, isDefault: false }))
        : prev;
      return [...updated, data.address];
    });
    setMode("list");
  }

  async function handleEdit(form: FormState) {
    if (!editing) return;
    const res  = await fetch(`/api/addresses/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setAddresses((prev) => {
      let updated = prev;
      if (form.isDefault) updated = updated.map((a) => ({ ...a, isDefault: false }));
      return updated.map((a) => (a.id === editing.id ? data.address : a));
    });
    setMode("list");
    setEditing(null);
  }

  async function handleSetDefault(id: string) {
    await fetch(`/api/addresses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, isDefault: a.id === id }))
    );
  }

  async function handleDelete(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    refresh();
  }

  if (mode === "add") {
    return (
      <div className="space-y-4">
        <p className="font-display text-xl font-light text-text">New Address</p>
        <AddressForm
          isFirst={addresses.length === 0}
          onSave={handleAdd}
          onCancel={() => setMode("list")}
        />
      </div>
    );
  }

  if (mode === "edit" && editing) {
    return (
      <div className="space-y-4">
        <p className="font-display text-xl font-light text-text">Edit Address</p>
        <AddressForm
          initial={{
            label:        editing.label ?? "",
            firstName:    editing.firstName,
            lastName:     editing.lastName,
            addressLine1: editing.addressLine1,
            addressLine2: editing.addressLine2 ?? "",
            city:         editing.city,
            state:        editing.state,
            zipCode:      editing.zipCode,
            country:      editing.country,
            isDefault:    editing.isDefault,
          }}
          isFirst={addresses.length === 1}
          onSave={handleEdit}
          onCancel={() => { setMode("list"); setEditing(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <p className="font-display text-2xl font-light text-text">No addresses saved</p>
          <p className="font-body text-sm text-text-muted">
            Save an address to speed up checkout.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
              onEdit={(a) => { setEditing(a); setMode("edit"); }}
            />
          ))}
        </div>
      )}

      <button
        onClick={() => setMode("add")}
        className="flex items-center gap-3 w-full border border-dashed border-border hover:border-accent text-text-muted hover:text-accent transition-colors duration-200 p-5 font-body text-sm"
      >
        <span className="text-xl leading-none">+</span>
        Add New Address
      </button>
    </div>
  );
}
