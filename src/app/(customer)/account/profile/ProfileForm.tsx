"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";

interface Profile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

// ── Success banner ────────────────────────────────────────
function SuccessBanner({ message }: { message: string }) {
  return (
    <div className="bg-success/10 border border-success/20 px-4 py-3">
      <p className="font-body text-sm text-success">{message}</p>
    </div>
  );
}

// ── Profile details section ───────────────────────────────
function ProfileDetails({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    firstName: profile.firstName,
    lastName:  profile.lastName,
    phone:     profile.phone ?? "",
  });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle">
        Personal Information
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" required value={form.firstName} onChange={set("firstName")} />
        <Input label="Last Name"  required value={form.lastName}  onChange={set("lastName")} />
      </div>

      <Input
        label="Email"
        type="email"
        value={profile.email}
        disabled
        hint="Email cannot be changed here. Contact support if needed."
      />

      <Input
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={set("phone")}
        placeholder="+961 1 000 000"
      />

      {success && <SuccessBanner message="Profile updated successfully." />}
      {error   && <p className="font-body text-sm text-error">{error}</p>}

      <Button type="submit" variant="primary" size="md" loading={loading}>
        Save Changes
      </Button>
    </form>
  );
}

// ── Change password section ───────────────────────────────
function ChangePassword() {
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSuccess(true);
      setForm({ password: "", confirm: "" });
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="font-body text-[11px] font-medium tracking-[0.12em] uppercase text-text-subtle">
        Change Password
      </p>

      <Input
        label="New Password"
        type="password"
        required
        value={form.password}
        onChange={set("password")}
        hint="Minimum 8 characters."
      />
      <Input
        label="Confirm Password"
        type="password"
        required
        value={form.confirm}
        onChange={set("confirm")}
      />

      {success && <SuccessBanner message="Password updated successfully." />}
      {error   && <p className="font-body text-sm text-error">{error}</p>}

      <Button type="submit" variant="secondary" size="md" loading={loading}>
        Update Password
      </Button>
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────
export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  return (
    <div className="space-y-10">
      <ProfileDetails profile={{ ...profile, email }} />
      <Divider />
      <ChangePassword />
    </div>
  );
}
