import { FadeIn } from "@/components/ui/FadeIn";
import { Container } from "@/components/ui/Container";

interface ProductStoryProps {
  story: string | null;
  fragranceNotes: string | null;
  name: string;
}

// ── FragranceNotes ─────────────────────────────────────────
// Parses a comma-separated string into top/heart/base note groups
// if formatted as "top: bergamot, lemon | heart: rose | base: musk"
// Falls back to rendering as a flat tag list.

function FragranceNotes({ raw }: { raw: string }) {
  const hasGroups = raw.includes("|");

  if (hasGroups) {
    const groups = raw.split("|").map((g) => {
      const [label, ...rest] = g.split(":");
      return {
        label: label.trim(),
        notes: rest.join(":").split(",").map((n) => n.trim()).filter(Boolean),
      };
    });

    return (
      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-accent mb-3">
              {g.label} notes
            </p>
            <div className="flex flex-wrap gap-2">
              {g.notes.map((note) => (
                <span
                  key={note}
                  className="font-body text-xs text-text-subtle border border-border px-3 py-1.5"
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Flat list
  const notes = raw.split(",").map((n) => n.trim()).filter(Boolean);
  return (
    <div className="flex flex-wrap gap-2">
      {notes.map((note) => (
        <span
          key={note}
          className="font-body text-xs text-text-subtle border border-border px-3 py-1.5"
        >
          {note}
        </span>
      ))}
    </div>
  );
}

// ── ProductStory ───────────────────────────────────────────

export function ProductStory({ story, fragranceNotes, name }: ProductStoryProps) {
  if (!story && !fragranceNotes) return null;

  return (
    <section className="border-t border-border py-20 md:py-28">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">

          {/* Story */}
          {story && (
            <FadeIn>
              <div className="space-y-5">
                <span className="font-body text-[10px] tracking-[0.22em] uppercase text-accent">
                  The story
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-light italic text-text leading-snug">
                  Behind {name}
                </h2>
                <p className="font-body text-sm text-text-muted leading-relaxed">
                  {story}
                </p>
              </div>
            </FadeIn>
          )}

          {/* Fragrance notes */}
          {fragranceNotes && (
            <FadeIn delay={0.1}>
              <div className="space-y-5">
                <span className="font-body text-[10px] tracking-[0.22em] uppercase text-accent">
                  Fragrance profile
                </span>
                <h2 className="font-display text-2xl md:text-3xl font-light text-text leading-snug">
                  Scent notes
                </h2>
                <FragranceNotes raw={fragranceNotes} />
              </div>
            </FadeIn>
          )}

        </div>
      </Container>
    </section>
  );
}
