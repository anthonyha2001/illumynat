"use client";

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
  createdAt: string;
}

interface Thread {
  id: string;
  subject: string;
  topic: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function CustomerMessagesClient({ threads }: { threads: Thread[] }) {
  if (threads.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-4 text-center">
        <svg className="w-10 h-10 mx-auto mb-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} style={{ color: "var(--color-border)" }}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>No messages yet</h1>
        <p style={{ color: "var(--color-muted)" }}>
          Have a question?{" "}
          <Link href="/contact" className="underline" style={{ color: "var(--color-accent)" }}>
            Contact us
          </Link>{" "}
          and we&apos;ll reply right here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold mb-8" style={{ color: "var(--color-text)" }}>My Messages</h1>
      <div className="flex flex-col gap-3">
        {threads.map((thread) => {
          const lastMsg = thread.messages[0];
          return (
            <Link
              key={thread.id}
              href={`/account/messages/${thread.id}`}
              className="block rounded-xl border p-4 hover:shadow-sm transition-shadow"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate" style={{ color: "var(--color-text)" }}>
                      {thread.subject}
                    </span>
                    {thread.status === "CLOSED" && (
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: "var(--color-border)", color: "var(--color-muted)" }}>
                        Closed
                      </span>
                    )}
                  </div>
                  {lastMsg && (
                    <p className="text-sm truncate" style={{ color: "var(--color-muted)" }}>
                      {lastMsg.fromAdmin ? "Support: " : "You: "}{lastMsg.body}
                    </p>
                  )}
                </div>
                <span className="text-xs shrink-0 mt-0.5" style={{ color: "var(--color-muted)" }}>
                  {timeAgo(thread.updatedAt)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
