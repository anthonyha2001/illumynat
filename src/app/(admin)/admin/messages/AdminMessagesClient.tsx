"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

function timeAgo(date: string) {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initials(t: Thread) {
  const name = t.profile ? `${t.profile.firstName} ${t.profile.lastName}` : t.guestName || t.guestEmail || "?";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function Avatar({ letters, size = "md" }: { letters: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${dim} rounded-full shrink-0 flex items-center justify-center font-semibold tracking-wide uppercase`}
      style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
    >
      {letters}
    </div>
  );
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
  updatedAt: string;
  profile: { firstName: string; lastName: string; email: string } | null;
  messages: Message[];
}

interface Props {
  threads: Thread[];
  unreadMap: Record<string, number>;
  initialThread: (Thread & { messages: Message[] }) | null;
  currentUserId: string;
}

function displayName(t: Thread) {
  return t.profile ? `${t.profile.firstName} ${t.profile.lastName}` : t.guestName || t.guestEmail || "Guest";
}

export default function AdminMessagesClient({ threads: initialThreads, unreadMap: initialUnreadMap, initialThread }: Props) {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>(initialThreads);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>(initialUnreadMap);
  const [activeThread, setActiveThread] = useState<(Thread & { messages: Message[] }) | null>(initialThread);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectThread = useCallback(async (thread: Thread) => {
    const res = await fetch(`/api/contact/${thread.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveThread(data.thread);
    setUnreadMap((prev) => ({ ...prev, [thread.id]: 0 }));
    router.replace(`/admin/messages?threadId=${thread.id}`, { scroll: false });
  }, [router]);

  const refreshActiveThread = useCallback(async () => {
    if (!activeThread) return;
    const res = await fetch(`/api/contact/${activeThread.id}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveThread(data.thread);
  }, [activeThread]);

  const refreshThreadList = useCallback(async () => {
    const res = await fetch(`/api/admin/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads);
    setUnreadMap(data.unreadMap);
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshThreadList();
      if (activeThread) await refreshActiveThread();
    }, 8000);
    return () => clearInterval(interval);
  }, [refreshThreadList, refreshActiveThread, activeThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread?.messages]);

  async function sendMessage() {
    if (!body.trim() || sending || !activeThread || activeThread.status === "CLOSED") return;
    setSending(true);
    try {
      const res = await fetch(`/api/contact/${activeThread.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setBody("");
        await refreshActiveThread();
      }
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    if (!activeThread) return;
    const newStatus = activeThread.status === "OPEN" ? "CLOSED" : "OPEN";
    await fetch(`/api/contact/${activeThread.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setActiveThread((t) => t ? { ...t, status: newStatus } : null);
    setThreads((prev) => prev.map((t) => t.id === activeThread.id ? { ...t, status: newStatus } : t));
  }

  const filtered = threads.filter((t) => filter === "ALL" ? true : t.status === filter);

  const customerInitials = activeThread ? initials(activeThread) : "";
  const customerName = activeThread ? displayName(activeThread) : "";

  return (
    <div className="flex h-[calc(100vh-48px)]" style={{ background: "var(--color-bg)" }}>

      {/* ── Thread list ── */}
      <div className="w-72 shrink-0 border-r flex flex-col" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "var(--color-muted)" }}>Messages</p>
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--color-border)" }}>
            {(["ALL", "OPEN", "CLOSED"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-1 text-[10px] tracking-widest uppercase py-1.5 transition-colors"
                style={filter === f
                  ? { background: "var(--color-accent)", color: "#fff" }
                  : { background: "transparent", color: "var(--color-muted)" }
                }
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="text-xs text-center py-10" style={{ color: "var(--color-muted)" }}>No threads</p>
          )}
          {filtered.map((thread) => {
            const unread = unreadMap[thread.id] || 0;
            const lastMsg = thread.messages[0];
            const isActive = activeThread?.id === thread.id;
            return (
              <button
                key={thread.id}
                onClick={() => selectThread(thread)}
                className="w-full text-left px-4 py-3 border-b transition-colors"
                style={{
                  borderColor: "var(--color-border)",
                  background: isActive
                    ? "color-mix(in srgb, var(--color-accent) 8%, transparent)"
                    : "transparent",
                }}
              >
                <div className="flex items-start gap-3">
                  <Avatar letters={initials(thread)} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-xs font-semibold truncate" style={{ color: "var(--color-text)" }}>
                        {displayName(thread)}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {unread > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                            style={{ background: "var(--color-accent)", color: "#fff" }}>
                            {unread}
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: "var(--color-muted)" }}>
                          {timeAgo(thread.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: "var(--color-muted)" }}>
                      {thread.subject}
                    </p>
                    {lastMsg && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: "var(--color-muted)", opacity: 0.65 }}>
                        {lastMsg.fromAdmin ? "You: " : ""}{lastMsg.body}
                      </p>
                    )}
                  </div>
                </div>
                {thread.status === "CLOSED" && (
                  <span className="mt-1.5 inline-block text-[10px] tracking-widest uppercase px-1.5 py-0.5"
                    style={{ background: "var(--color-border)", color: "var(--color-muted)" }}>
                    Closed
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat panel ── */}
      {!activeThread ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} style={{ color: "var(--color-border)" }}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm" style={{ color: "var(--color-muted)" }}>Select a conversation</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">

          {/* Thread header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b shrink-0"
            style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <Avatar letters={customerInitials} />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight" style={{ color: "var(--color-text)" }}>
                  {customerName}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--color-muted)" }}>
                  {activeThread.subject}
                  {activeThread.profile?.email && ` · ${activeThread.profile.email}`}
                  {activeThread.guestEmail && ` · ${activeThread.guestEmail}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[10px] tracking-widest uppercase px-2 py-0.5 border"
                style={activeThread.status === "OPEN"
                  ? { borderColor: "var(--color-border)", color: "var(--color-muted)" }
                  : { borderColor: "var(--color-accent)", color: "var(--color-accent)" }
                }
              >
                {activeThread.status}
              </span>
              <button
                onClick={toggleStatus}
                className="text-[11px] tracking-widest uppercase px-3 py-1.5 border transition-colors"
                style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
              >
                {activeThread.status === "OPEN" ? "Close" : "Reopen"}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {activeThread.messages.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: "var(--color-muted)" }}>No messages yet.</p>
            )}
            {activeThread.messages.map((msg) => {
              const isAdmin = msg.fromAdmin;
              const senderLabel = isAdmin ? "You (Support)" : customerName;
              const avatarLetters = isAdmin ? "S" : customerInitials;

              return (
                <div key={msg.id} className={`flex gap-3 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold tracking-wide uppercase"
                    style={isAdmin
                      ? { background: "var(--color-accent)", color: "#fff" }
                      : { background: "var(--color-border)", color: "var(--color-muted)" }
                    }
                  >
                    {avatarLetters}
                  </div>
                  <div className={`flex flex-col gap-1 max-w-[68%] ${isAdmin ? "items-end" : "items-start"}`}>
                    <div className={`flex items-baseline gap-2 ${isAdmin ? "flex-row-reverse" : "flex-row"}`}>
                      <span className="text-[11px] font-medium" style={{ color: "var(--color-muted)" }}>
                        {senderLabel}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--color-muted)", opacity: 0.55 }}>
                        {timeAgo(msg.createdAt)}
                      </span>
                    </div>
                    <div
                      className="px-4 py-2.5 text-sm leading-relaxed rounded-2xl"
                      style={isAdmin
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
          {activeThread.status === "CLOSED" ? (
            <div className="px-6 py-4 border-t text-sm text-center" style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}>
              This conversation is closed.{" "}
              <button onClick={toggleStatus} className="underline underline-offset-2" style={{ color: "var(--color-accent)" }}>Reopen</button>
            </div>
          ) : (
            <div className="px-6 py-4 border-t shrink-0" style={{ borderColor: "var(--color-border)" }}>
              <div
                className="flex items-end gap-3 rounded-xl border overflow-hidden"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
              >
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder="Reply… (Enter to send)"
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
