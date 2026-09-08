import Link from "next/link";

export const metadata = { title: "Content — Admin" };

const SECTIONS = [
  {
    href:        "/admin/content/hero",
    label:       "Hero Section",
    description: "Edit the opening headline, sub-copy, CTAs, and background image for your homepage hero.",
    icon:        "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    href:        "/admin/content/promo-zone",
    label:       "Promo Zone",
    description: "Control the announcement banner at the top of your storefront — activate, theme, and schedule it.",
    icon:        "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  },
  {
    href:        "/admin/content/palette",
    label:       "Color Palette",
    description: "Repaint the entire storefront — change brand colors, accent, backgrounds, and status colors.",
    icon:        "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  },
  {
    href:        "/admin/content/scent-families",
    label:       "Scent Families",
    description: "Manage the scent family options available when creating or editing products.",
    icon:        "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
];

export default function ContentPage() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted mb-1">Admin</p>
        <h1 className="font-display text-3xl font-light text-text">Content</h1>
        <p className="font-body text-sm text-text-muted mt-2">
          Manage your storefront content without touching code.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group bg-surface border border-border-subtle p-6 hover:border-accent transition-colors duration-150"
          >
            <svg className="w-5 h-5 text-text-muted mb-4 group-hover:text-accent transition-colors duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d={s.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-body text-sm font-medium text-text group-hover:text-accent transition-colors duration-150">{s.label}</p>
            <p className="font-body text-xs text-text-muted mt-1 leading-relaxed">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
