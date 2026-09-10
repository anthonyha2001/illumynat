import { Container } from "@/components/ui/Container";
import { FadeIn } from "@/components/ui/FadeIn";
import { Button } from "@/components/ui/Button";
import { ScrollCandle } from "@/components/customer/ScrollCandle";

export function GiftingBanner() {
  return (
    <section className="py-0 overflow-hidden">
      <FadeIn from="none">
        <div className="bg-bg-dark relative overflow-hidden">

          {/* Warm radial glow */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 80% at 80% 50%, #c9a96e33 0%, transparent 70%)",
            }}
          />

          {/* Scattered sparkles — kept, they're subtle */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none select-none">
            <svg viewBox="0 0 24 24" className="absolute top-12 left-10 w-5 h-5 text-gold/[0.22] animate-sparkle" style={{ animationDelay: "0.5s" }}>
              <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 24 24" className="absolute top-8 left-[38%] w-3 h-3 text-gold/[0.16] animate-sparkle-slow" style={{ animationDelay: "2.0s" }}>
              <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 24 24" className="absolute top-[42%] left-6 w-3.5 h-3.5 text-gold/[0.14] animate-sparkle-slow" style={{ animationDelay: "1.2s" }}>
              <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor" />
            </svg>
            <svg viewBox="0 0 24 24" className="absolute bottom-12 left-[50%] w-2.5 h-2.5 text-gold/[0.12] animate-sparkle" style={{ animationDelay: "3.5s" }}>
              <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor" />
            </svg>
          </div>

          <Container className="relative z-10">
            <div className="py-24 md:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Left — copy */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3 h-3 text-gold/50 flex-shrink-0 animate-sparkle" style={{ animationDelay: "1.8s" }}>
                    <path d="M12 0 L13.4 10.6 L24 12 L13.4 13.4 L12 24 L10.6 13.4 L0 12 L10.6 10.6 Z" fill="currentColor" />
                  </svg>
                  <span className="font-body text-[10px] tracking-[0.28em] uppercase text-gold">
                    For someone you love
                  </span>
                </div>
                <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light italic text-text-inverse leading-[1.05]">
                  The gift they&apos;ll<br />
                  remember you by.
                </h2>
                <p className="font-body text-sm text-text-inverse/55 leading-relaxed max-w-sm">
                  Personalised labels. Hand-tied ribbon. A gift message in your
                  own words. We take care of everything — you take the credit.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <Button href="/gifting" variant="primary" size="lg">Build a Gift Set</Button>
                  <Button
                    href="/shop?filter=limited"
                    variant="ghost"
                    size="lg"
                    className="text-text-inverse/70 border-text-inverse/20 hover:border-text-inverse/50 hover:text-text-inverse hover:bg-text-inverse/5"
                  >
                    Limited Editions
                  </Button>
                </div>
              </div>

              {/* Right — editorial list + candle accent */}
              <div className="hidden lg:flex items-center gap-10">

                {/* Decorative candle */}
                <div aria-hidden="true" className="flex-shrink-0 self-center">
                  <ScrollCandle className="w-12 h-36 text-white/[0.18]" variant="watermark" />
                </div>

                {/* Feature list */}
                <div className="flex flex-col gap-6 flex-1">
                  {[
                    { label: "Personalised label engraving", detail: "Up to 40 characters" },
                    { label: "Hand-tied satin ribbon",       detail: "Four colours available" },
                    { label: "Gift message card",            detail: "Handwritten on ivory stock" },
                    { label: "Luxury matte gift box",        detail: "Signature LUMYNAT packaging" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-5 group">
                      <div className="relative w-px h-8 shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-accent/30" />
                        <div className="absolute inset-0 bg-gold scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-400" />
                      </div>
                      <div>
                        <p className="font-body text-sm text-text-inverse/80 leading-none mb-1">
                          {item.label}
                        </p>
                        <p className="font-body text-[11px] text-text-inverse/35">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </Container>
        </div>
      </FadeIn>
    </section>
  );
}
