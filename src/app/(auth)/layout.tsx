import Link from "next/link";

// ── Auth Layout ────────────────────────────────────────────
// Minimal full-screen layout with a centered card.
// No Navbar/Footer — keeps the user focused on the form.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-bg-subtle flex flex-col">

      {/* Minimal top bar — just the logo */}
      <header className="flex items-center justify-between px-8 py-6">
        <Link
          href="/"
          className="font-display text-xl font-light tracking-[0.25em] uppercase text-text hover:text-accent transition-colors duration-200"
        >
          LUMYNAT
        </Link>
        <Link
          href="/"
          className="font-body text-[11px] tracking-[0.12em] uppercase text-text-muted hover:text-text transition-colors duration-200"
        >
          ← Back to shop
        </Link>
      </header>

      {/* Centered form area */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      {/* Slim footer */}
      <footer className="py-6 text-center">
        <p className="font-body text-[11px] text-text-faint tracking-wide">
          © {new Date().getFullYear()} LUMYNAT. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
