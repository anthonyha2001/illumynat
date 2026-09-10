"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface CustomerNotif {
  id: string;
  title: string;
  body: string;
  metadata: { href?: string; orderId?: string; orderNumber?: string; status?: string } | null;
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

export function CustomerNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<CustomerNotif[]>([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/customer/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch { /* not logged in or network error */ }
  }

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/customer/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifs(); }}
        aria-label="Notifications"
        className={cn(
          "relative hover:text-text transition-colors duration-200",
          open ? "text-accent" : "text-text-subtle"
        )}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent flex items-center justify-center font-body text-[9px] font-medium text-text-on-gold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-bg border border-border-subtle shadow-2xl z-50 animate-slide-down">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
            <p className="font-body text-[11px] font-medium tracking-[0.1em] uppercase text-text">Notifications</p>
            <Link href="/account/notifications" onClick={() => setOpen(false)} className="font-body text-[10px] tracking-widest uppercase text-accent hover:underline underline-offset-2">
              View all
            </Link>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="font-body text-sm text-text-muted">No notifications yet.</p>
              </div>
            ) : (
              notifs.slice(0, 8).map((n) => {
                const href = n.metadata?.href ?? (n.metadata?.orderId ? `/account/orders/${n.metadata.orderId}` : null);
                const itemClass = cn(
                  "flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 hover:bg-bg-subtle",
                  !n.isRead && "bg-accent/[0.03]"
                );
                const handleClick = () => { if (!n.isRead) markRead(n.id); setOpen(false); };
                return href ? (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={handleClick}
                    className={itemClass}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-body text-[12px] font-medium leading-snug", n.isRead ? "text-text-muted" : "text-text")}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />}
                      </div>
                      <p className="font-body text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="font-body text-[10px] text-text-faint mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    onClick={handleClick}
                    className={itemClass}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("font-body text-[12px] font-medium leading-snug", n.isRead ? "text-text-muted" : "text-text")}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1" />}
                      </div>
                      <p className="font-body text-[11px] text-text-muted leading-snug mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="font-body text-[10px] text-text-faint mt-1">{timeAgo(n.createdAt)}</p>
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
