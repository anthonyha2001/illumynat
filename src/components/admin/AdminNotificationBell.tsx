"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface AdminNotif {
  id: string;
  type: "NEW_ORDER" | "NEW_CUSTOMER" | "NEWSLETTER_SIGNUP" | "NEW_MESSAGE";
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// icon paths for each notification type
const TYPE_CONFIG = {
  NEW_ORDER:         { icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", color: "text-accent border-accent/30 bg-accent/8", label: "Order" },
  NEW_CUSTOMER:      { icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",  color: "text-info border-info/30 bg-info/8",   label: "Customer" },
  NEWSLETTER_SIGNUP: { icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", color: "text-success border-success/30 bg-success/8", label: "Newsletter" },
  NEW_MESSAGE:       { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "text-info border-info/30 bg-info/8",   label: "Message" },
};

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<AdminNotif[]>([]);
  const [unread, setUnread] = useState(0);
  const [prevUnread, setPrevUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/admin/notifications?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      const newUnread = data.unreadCount ?? 0;
      // If new unread notifications arrived, flash
      if (newUnread > prevUnread && prevUnread !== 0) {
        // Could play a sound or flash here
      }
      setPrevUnread(newUnread);
      setUnread(newUnread);
    } catch { /* network error, ignore */ }
  }

  // Initial fetch + poll every 15s
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function markRead(id: string) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((u) => Math.max(0, u - 1));
  }

  const hasNewOrder = notifs.some((n) => !n.isRead && n.type === "NEW_ORDER");

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifs(); }}
        className={cn(
          "relative flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200",
          open ? "bg-accent/15 text-accent" : "text-text-inverse/50 hover:text-text-inverse hover:bg-text-inverse/10"
        )}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className={cn(
            "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center font-body text-[9px] font-medium rounded-full",
            hasNewOrder ? "bg-accent text-text-on-gold animate-pulse" : "bg-info text-text-inverse"
          )}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-bg border border-border-subtle shadow-2xl z-50 animate-slide-down">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <p className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text">Notifications</p>
              {unread > 0 && (
                <span className="font-body text-[10px] bg-accent text-text-on-gold px-1.5 py-0.5">{unread} new</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button onClick={markAllRead} className="font-body text-[10px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150">
                  Mark all read
                </button>
              )}
              <Link href="/admin/notifications" onClick={() => setOpen(false)} className="font-body text-[10px] tracking-widest uppercase text-accent hover:underline underline-offset-2">
                View all
              </Link>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border-subtle">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-body text-sm text-text-muted">No notifications yet.</p>
              </div>
            ) : (
              notifs.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.NEW_MESSAGE;
                const meta = n.metadata as { orderId?: string; threadId?: string } | null;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.isRead && markRead(n.id)}
                    className={cn(
                      "flex gap-3 px-4 py-3 cursor-default transition-colors duration-150",
                      !n.isRead && "bg-accent/[0.03]",
                    )}
                  >
                    <span className={cn("shrink-0 w-8 h-8 flex items-center justify-center border rounded-full", cfg.color)}>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d={cfg.icon} />
                      </svg>
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-body text-[12px] font-medium leading-snug", n.isRead ? "text-text-muted" : "text-text")}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />}
                      </div>
                      <p className="font-body text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="font-body text-[10px] text-text-faint">{timeAgo(n.createdAt)}</span>
                        {n.type === "NEW_ORDER" && meta?.orderId && (
                          <Link
                            href={`/admin/orders/${meta.orderId}`}
                            onClick={() => setOpen(false)}
                            className="font-body text-[10px] uppercase tracking-wider text-accent hover:underline underline-offset-2"
                          >
                            View order →
                          </Link>
                        )}
                        {n.type === "NEW_MESSAGE" && meta?.threadId && (
                          <Link
                            href={`/admin/messages?threadId=${meta.threadId}`}
                            onClick={() => setOpen(false)}
                            className="font-body text-[10px] uppercase tracking-wider text-accent hover:underline underline-offset-2"
                          >
                            Open chat →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
