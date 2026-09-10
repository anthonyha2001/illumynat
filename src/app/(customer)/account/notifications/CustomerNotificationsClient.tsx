"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";

interface CustomerNotif {
  id: string;
  title: string;
  body: string;
  metadata: { href?: string; orderId?: string; orderNumber?: string; status?: string } | null;
  isRead: boolean;
  createdAt: Date;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CustomerNotificationsClient({ notifications: initial }: { notifications: CustomerNotif[] }) {
  const [notifs, setNotifs] = useState(initial);

  const unread = notifs.filter((n) => !n.isRead).length;

  async function markRead(id: string) {
    await fetch("/api/customer/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  }

  async function markAllRead() {
    await fetch("/api/customer/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-light italic text-text">Notifications</h1>
          {unread > 0 && (
            <p className="font-body text-sm text-text-muted mt-1">{unread} unread</p>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="font-body text-[11px] tracking-widest uppercase text-text-muted hover:text-accent transition-colors duration-150"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <span className="text-5xl">🔔</span>
          <p className="font-display text-2xl font-light text-text-muted">No notifications yet.</p>
          <p className="font-body text-sm text-text-muted">We&apos;ll notify you when something happens with your orders.</p>
          <Link href="/shop" className="mt-2 font-body text-[11px] tracking-[0.2em] uppercase text-accent border border-accent px-6 py-3 hover:bg-accent hover:text-text-on-gold transition-colors duration-200">
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const href = n.metadata?.href ?? (n.metadata?.orderId ? `/account/orders/${n.metadata.orderId}` : null);
            return (
              <div
                key={n.id}
                className={cn(
                  "flex gap-4 p-5 border transition-colors duration-150",
                  n.isRead ? "border-border-subtle bg-bg" : "border-accent/20 bg-accent/[0.03]"
                )}
              >
                <div className="w-2 shrink-0 flex items-start pt-2">
                  {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("font-body text-sm font-medium", n.isRead ? "text-text-muted" : "text-text")}>
                    {n.title}
                  </p>
                  <p className="font-body text-sm text-text-muted leading-relaxed mt-1">{n.body}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="font-body text-[11px] text-text-faint">{formatDate(n.createdAt)}</span>
                    {href && (
                      <Link href={href} onClick={() => !n.isRead && markRead(n.id)} className="font-body text-[11px] uppercase tracking-wider text-accent hover:underline underline-offset-2">
                        View details →
                      </Link>
                    )}
                    {!n.isRead && (
                      <button onClick={() => markRead(n.id)} className="font-body text-[11px] uppercase tracking-wider text-text-muted hover:text-accent transition-colors duration-150">
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
