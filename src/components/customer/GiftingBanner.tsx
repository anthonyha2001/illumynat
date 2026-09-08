import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { Button } from "@/components/ui/Button";

// ── GiftingBanner ──────────────────────────────────────────
// Full-width dark editorial banner driving the gifting experience.
// Uses psychological principle: social gifting identity ("I give beautiful things")

export function GiftingBanner() {
  return (
    <section className="py-0 overflow-hidden">
      <FadeIn from="none">
        <div className="bg-bg-dark relative overflow-hidden">

          {/* Background texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 80% at 80% 50%, #c9a96e33 0%, transparent 70%)",
            }}
          />

          <Container className="relative z-10">
            <div className="py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Left — copy */}
              <div className="space-y-6">
                <span className="font-body text-[10px] tracking-[0.25em] uppercase text-accent">
                  For someone you love
                </span>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light italic text-text-inverse leading-[1.05]">
                  The gift they&apos;ll<br />
                  remember you by.
                </h2>
                <p className="font-body text-sm text-white/55 leading-relaxed max-w-sm">
                  Personalised labels. Hand-tied ribbon. A gift message in your
                  own words. We take care of everything — you take the credit.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <Button href="/gifting" variant="primary" size="lg">Build a Gift Set</Button>
                  <Button href="/shop?filter=limited" variant="ghost" size="lg"
                    className="text-white/70 border-white/20 hover:border-white/50 hover:text-white hover:bg-white/5">
                    Limited Editions
                  </Button>
                </div>
              </div>

              {/* Right — decorative editorial list */}
              <div className="hidden lg:flex flex-col gap-6">
                {[
                  { label: "Personalised label engraving", detail: "Up to 40 characters" },
                  { label: "Hand-tied satin ribbon", detail: "Four colours available" },
                  { label: "Gift message card", detail: "Handwritten on ivory stock" },
                  { label: "Luxury matte gift box", detail: "Signature ILLUMYNAT packaging" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-5 group">
                    <div className="w-px h-8 bg-accent/40 group-hover:bg-accent transition-colors duration-300 shrink-0" />
                    <div>
                      <p className="font-body text-sm text-white/80 leading-none mb-1">
                        {item.label}
                      </p>
                      <p className="font-body text-[11px] text-white/35">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </Container>

        </div>
      </FadeIn>
    </section>
  );
}
