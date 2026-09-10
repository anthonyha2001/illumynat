"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Message {
  id: string;
  body: string;
  fromAdmin: boolean;
  readAt: string | null;
  createdAt: string;
}

interface Thread {
  id: string;
  subject: string;
  topic: string | null;
  status: "OPEN" | "CLOSED";
  guestName: string | null;
  guestEmail: string | null;
  profile?: { firstName: string; lastName: string; email: string } | null;
  messages: Message[];
}

interface Props {
  thread: Thread;
  currentUserId: string;
  isAdmin: boolean;
}

function Avatar({ initials, filled }: { initials: string; filled?: boolean }) {
  return (
    <div
      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tracking-wide uppercase"
      style={filled
        ? { background: "var(--color-accent)", color: "#fff" }
        : { background: "var(--color-border)", color: "var(--color-muted)" }
      }
    >
      {initials}
    </div>
  );
}

export default function ChatClient({ thread: initialThread, isAdmin }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialThread.messages);
  const [status, setStatus] = useState<"OPEN" | "CLOSED">(initialThread.status);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const apiBase = `/api/contact/${initialThread.id}`;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(apiBase);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.thread.messages);
      setStatus(data.thread.status);
    } catch {}
  }, [apiBase]);

  useEffect(() => {
    const interval = setInterval(fetchMessages, 8000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!body.trim() || sending || status === "CLOSED") return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to send");
        return;
      }
      setBody("");
      await fetchMessages();
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    const newStatus = status === "OPEN" ? "CLOSED" : "OPEN";
    await fetch(apiBase, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
  }

  const customerName = initialThread.profile
    ? `${initialThread.profile.firstName} ${initialThread.profile.lastName}`
    : initialThread.guestName || initialThread.guestEmail || "Guest";

  const customerInitials = customerName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto" style={{ background: "var(--color-bg)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-6 py-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={isAdmin ? "/admin/messages" : "/account/messages"}
              className="shrink-0 p-1 -ml-1 rounded transition-opacity hover:opacity-60"
              style={{ color: "var(--color-muted)" }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5m7-7-7 7 7 7" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm truncate" style={{ color: "var(--color-text)" }}>
                {initialThread.subject}
              </h1>
              {initialThread.topic && (
                <p className="text-xs mt-0.5" style={{ color: "var(--color-muted)" }}>{initialThread.topic}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-xs px-2 py-0.5 rounded border"
              style={status === "OPEN"
                ? { borderColor: "var(--color-border)", color: "var(--color-muted)" }
                : { borderColor: "var(--color-accent)", color: "var(--color-accent)" }
              }
            >
              {status === "OPEN" ? "Open" : "Closed"}
            </span>
            {isAdmin && (
              <button
                onClick={toggleStatus}
                className="text-xs px-3 py-1 rounded border transition-colors"
                style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
              >
                {status === "OPEN" ? "Close" : "Reopen"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-6 py-6 flex flex-col gap-4">
        {messages.length === 0 && (
          <p className="text-sm text-center py-12" style={{ color: "var(--color-muted)" }}>No messages yet.</p>
        )}
        {messages.map((msg) => {
          const sentByAdmin = msg.fromAdmin;
          const isOwn = isAdmin ? sentByAdmin : !sentByAdmin;

          const senderLabel = sentByAdmin ? "Support" : customerName;
          const avatarInitials = sentByAdmin ? "S" : customerInitials;

          return (
            <div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
              <Avatar initials={avatarInitials} filled={sentByAdmin} />
              <div className={`flex flex-col gap-1 max-w-[72%] ${isOwn ? "items-end" : "items-start"}`}>
                <div className="flex items-baseline gap-2">
                  {!isOwn && (
                    <span className="text-[11px] font-medium" style={{ color: "var(--color-muted)" }}>
                      {senderLabel}
                    </span>
                  )}
                  <span className="text-[10px]" style={{ color: "var(--color-muted)", opacity: 0.6 }}>
                    {timeAgo(msg.createdAt)}
                  </span>
                  {isOwn && (
                    <span className="text-[11px] font-medium" style={{ color: "var(--color-muted)" }}>
                      You
                    </span>
                  )}
                </div>
                <div
                  className="px-4 py-2.5 text-sm leading-relaxed rounded-2xl"
                  style={isOwn
                    ? { background: "var(--color-accent)", color: "var(--color-text-on-gold)" }
                    : { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }
                  }
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t px-6 py-4" style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}>
        {status === "CLOSED" ? (
          <div className="text-center text-sm py-2" style={{ color: "var(--color-muted)" }}>
            This conversation is closed.
            {isAdmin && (
              <button onClick={toggleStatus} className="ml-2 underline underline-offset-2" style={{ color: "var(--color-accent)" }}>
                Reopen
              </button>
            )}
          </div>
        ) : (
          <div
            className="flex gap-3 items-end rounded-xl border overflow-hidden"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
          >
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Type a message — Enter to send, Shift+Enter for new line"
              rows={2}
              className="flex-1 px-4 py-3 text-sm resize-none outline-none bg-transparent"
              style={{ color: "var(--color-text)" }}
            />
            <div className="pr-3 pb-3">
              <button
                onClick={sendMessage}
                disabled={!body.trim() || sending}
                className="flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-30 transition-opacity"
                style={{ background: "var(--color-accent)" }}
                aria-label="Send"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{error}</p>}
      </div>
    </div>
  );
}
