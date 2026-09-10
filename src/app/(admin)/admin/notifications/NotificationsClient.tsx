"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

type AdminNotifType = "NEW_ORDER" | "NEW_CUSTOMER" | "NEWSLETTER_SIGNUP" | "NEW_MESSAGE";

interface AdminNotif {
  id: string;
  type: AdminNotifType;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Props {
  notifications: AdminNotif[];
  customers: Customer[];
}

const TYPE_CONFIG: Record<AdminNotifType, { icon: string; label: string; color: string }> = {
  NEW_ORDER:         { icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", label: "Order",      color: "bg-accent/10 text-accent border-accent/20" },
  NEW_CUSTOMER:      { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",  label: "Customer",   color: "bg-info/10 text-info border-info/20" },
  NEWSLETTER_SIGNUP: { icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "Newsletter", color: "bg-success/10 text-success border-success/20" },
  NEW_MESSAGE:       { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Message",    color: "bg-info/10 text-info border-info/20" },
};

function timeAgo(date: Date | string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type Tab = "inbox" | "push" | "broadcast";

export function NotificationsClient({ notifications: initial, customers }: Props) {
  const [tab, setTab] = useState<Tab>("inbox");
  const [notifications, setNotifications] = useState(initial);
  const [filter, setFilter] = useState<AdminNotifType | "ALL">("ALL");

  // Push state
  const [pushTarget, setPushTarget] = useState<string>("");
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushState, setPushState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [pushResult, setPushResult] = useState("");

  // Broadcast state
  const [broadTitle, setBroadTitle] = useState("");
  const [broadBody, setBroadBody] = useState("");
  const [broadState, setBroadState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [broadResult, setBroadResult] = useState("");

  const unread = notifications.filter((n) => !n.isRead).length;
  const filtered = filter === "ALL" ? notifications : notifications.filter((n) => n.type === filter);

  async function markAllRead() {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function markRead(id: string) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  async function handlePush(e: React.FormEvent) {
    e.preventDefault();
    if (!pushTarget || !pushTitle.trim() || !pushBody.trim()) return;
    setPushState("loading");
    try {
      const res = await fetch("/api/admin/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: pushTarget, title: pushTitle.trim(), body: pushBody.trim() }),
      });
      if (res.ok) {
        setPushState("done");
        setPushResult("Notification sent successfully.");
        setPushTitle(""); setPushBody(""); setPushTarget("");
      } else {
        setPushState("error");
        setPushResult("Failed to send. Try again.");
      }
    } catch {
      setPushState("error");
      setPushResult("Network error. Try again.");
    }
  }

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!broadTitle.trim() || !broadBody.trim()) return;
    setBroadState("loading");
    try {
      const res = await fetch("/api/admin/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcast: true, title: broadTitle.trim(), body: broadBody.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setBroadState("done");
        setBroadResult(`Sent to ${data.sent} customer${data.sent !== 1 ? "s" : ""}.`);
        setBroadTitle(""); setBroadBody("");
      } else {
        setBroadState("error");
        setBroadResult("Failed to broadcast. Try again.");
      }
    } catch {
      setBroadState("error");
      setBroadResult("Network error. Try again.");
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: "inbox",     label: unread > 0 ? `Inbox (${unread})` : "Inbox" },
    { id: "push",      label: "Push to Customer" },
    { id: "broadcast", label: "Broadcast to All" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-light italic text-text">Notification Center</h1>
        <p className="font-body text-sm text-text-muted mt-1">
          Incoming alerts and outgoing customer notifications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border-subtle mb-8">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-5 py-3 font-body text-[11px] tracking-[0.1em] uppercase transition-colors duration-150 border-b-2 -mb-px",
              tab === t.id
                ? "border-accent text-accent"
                : "border-transparent text-text-muted hover:text-text"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── INBOX ── */}
      {tab === "inbox" && (
        <div>
          {/* Filters + actions */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              {(["ALL", "NEW_ORDER", "NEW_CUSTOMER", "NEWSLETTER_SIGNUP"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "font-body text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-colors duration-150",
                    filter === f
                      ? "bg-accent text-text-on-gold border-accent"
                      : "border-border text-text-muted hover:border-accent hover:text-accent"
                  )}
                >
                  {f === "ALL" ? "All" : TYPE_CONFIG[f].label}
                </button>
              ))}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="font-body text-[10px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150"
              >
                Mark all read
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-border)" }}>
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="font-display text-xl font-light text-text-muted">No notifications yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((n) => {
                const cfg = TYPE_CONFIG[n.type];
                const meta = n.metadata as { orderId?: string; email?: string } | null;
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex items-start gap-4 p-4 border transition-colors duration-150",
                      n.isRead
                        ? "border-border-subtle bg-bg"
                        : n.type === "NEW_ORDER"
                        ? "border-accent/30 bg-accent/[0.03]"
                        : "border-border-subtle bg-bg-subtle"
                    )}
                  >
                    <span className={cn("shrink-0 w-9 h-9 flex items-center justify-center border rounded-full", cfg.color)}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d={cfg.icon} />
                      </svg>
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 justify-between">
                        <div>
                          <p className={cn("font-body text-sm font-medium", n.isRead ? "text-text-muted" : "text-text")}>
                            {n.title}
                          </p>
                          <p className="font-body text-[12px] text-text-muted mt-0.5">{n.body}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-body text-[10px] text-text-faint">{timeAgo(n.createdAt)}</span>
                          {!n.isRead && (
                            <button onClick={() => markRead(n.id)} className="font-body text-[10px] uppercase tracking-wider text-text-muted hover:text-accent transition-colors duration-150">
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <span className={cn("font-body text-[9px] tracking-widest uppercase px-2 py-0.5 border rounded-full", cfg.color)}>
                          {cfg.label}
                        </span>
                        {n.type === "NEW_ORDER" && meta?.orderId && (
                          <Link
                            href={`/admin/orders/${meta.orderId}`}
                            className="font-body text-[11px] uppercase tracking-wider text-accent hover:underline underline-offset-2"
                          >
                            View order →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PUSH TO CUSTOMER ── */}
      {tab === "push" && (
        <div className="max-w-xl">
          <p className="font-body text-sm text-text-muted mb-6 leading-relaxed">
            Send a notification directly to a specific customer. It will appear in their account notification center.
          </p>
          <form onSubmit={handlePush} className="space-y-5">
            <div className="space-y-1.5">
              <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Customer</label>
              <select
                value={pushTarget}
                onChange={(e) => setPushTarget(e.target.value)}
                required
                className="w-full h-11 border border-border-subtle bg-surface px-3 font-body text-sm text-text focus:outline-none focus:border-accent"
              >
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} — {c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Title</label>
              <input
                type="text"
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g. Your order has been updated"
                className="w-full h-11 border border-border-subtle bg-surface px-3 font-body text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Message</label>
              <textarea
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                required
                rows={4}
                maxLength={500}
                placeholder="Write a message to this customer…"
                className="w-full border border-border-subtle bg-surface px-3 py-3 font-body text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={pushState === "loading"}
                className="font-body text-[11px] tracking-[0.15em] uppercase bg-accent text-text-on-gold px-8 py-3.5 hover:bg-accent-dark transition-colors duration-200 disabled:opacity-50"
              >
                {pushState === "loading" ? "Sending…" : "Send Notification"}
              </button>
              {pushResult && (
                <p className={cn("font-body text-sm", pushState === "done" ? "text-success" : "text-error")}>
                  {pushResult}
                </p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── BROADCAST ── */}
      {tab === "broadcast" && (
        <div className="max-w-xl">
          <div className="p-4 border border-warning/30 bg-warning/5 mb-6">
            <p className="font-body text-sm text-warning leading-relaxed">
              <strong>Broadcast</strong> sends a notification to every customer account. Use this for announcements, promotions, or important updates.
            </p>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-5">
            <div className="space-y-1.5">
              <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Title</label>
              <input
                type="text"
                value={broadTitle}
                onChange={(e) => setBroadTitle(e.target.value)}
                required
                maxLength={100}
                placeholder="e.g. New collection now available"
                className="w-full h-11 border border-border-subtle bg-surface px-3 font-body text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-[11px] tracking-[0.1em] uppercase text-text-muted">Message</label>
              <textarea
                value={broadBody}
                onChange={(e) => setBroadBody(e.target.value)}
                required
                rows={4}
                maxLength={500}
                placeholder="Write a message to all customers…"
                className="w-full border border-border-subtle bg-surface px-3 py-3 font-body text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-accent resize-none"
              />
              <p className="font-body text-[10px] text-text-faint">This will be sent to {customers.length} customer{customers.length !== 1 ? "s" : ""}.</p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={broadState === "loading"}
                className="font-body text-[11px] tracking-[0.15em] uppercase bg-warning text-text-on-gold px-8 py-3.5 hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
              >
                {broadState === "loading" ? "Sending…" : `Broadcast to All (${customers.length})`}
              </button>
              {broadResult && (
                <p className={cn("font-body text-sm", broadState === "done" ? "text-success" : "text-error")}>
                  {broadResult}
                </p>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
