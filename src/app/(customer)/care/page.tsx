import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import Link from "next/link";
import { PageHero } from "@/components/customer/PageHero";

export const metadata = {
  title: "Care Guide — LUMYNAT",
  description: "How to get the most from your LUMYNAT candle. First burn, wick trimming, safe burning, and more.",
};

const STEPS = [
  {
    step: "01",
    title: "The first burn is everything",
    body: "Allow your candle to burn until the entire surface has melted to the edges on the first use. This is called the melt pool, and it sets the memory of the wax. If you extinguish it early, the wax will tunnel down the centre and never burn evenly again.",
    time: "~2–3 hours for most of our vessels",
  },
  {
    step: "02",
    title: "Trim the wick before every burn",
    body: "Before relighting, trim the wick to approximately 5mm (¼ inch). A long or untrimmed wick produces a large, flickering flame, excess soot, and uneven burning. A small pair of nail scissors works perfectly — or invest in a dedicated wick trimmer.",
    time: "Takes 10 seconds",
  },
  {
    step: "03",
    title: "Burn in sessions of 3–4 hours",
    body: "Do not burn your candle for more than 4 hours at a time. After 4 hours, the wick base can overheat, which may cause the wick to move or the glass to become too hot to handle safely. Extinguish, let it cool, trim the wick, and relight when ready.",
    time: "4-hour maximum per session",
  },
  {
    step: "04",
    title: "Keep it still while burning",
    body: "Always burn on a heat-resistant surface, away from drafts, curtains, and anything flammable. A draft will cause your flame to flicker and the candle to burn unevenly on one side. Place it somewhere stable where it will not be knocked.",
    time: "Safety always",
  },
  {
    step: "05",
    title: "Stop at 10mm of wax",
    body: "Once approximately 10mm (½ inch) of wax remains, discontinue use. Burning below this level can cause the glass to overheat. The good news: your vessel is fully reusable once you have cleaned it out.",
    time: "Know when to stop",
  },
  {
    step: "06",
    title: "Repurpose the vessel",
    body: "Fill the vessel with boiling water and leave for 20 minutes. The remaining wax will float to the surface. Pour it out once solid, then wipe the inside clean with a cloth. Run it through the dishwasher if needed. Your vessel is now ready for a second life.",
    time: "20-minute clean",
  },
];

const DONT_DO = [
  "Burn near open windows or air vents",
  "Leave a burning candle unattended",
  "Burn on an unstable surface",
  "Move the candle while the wax is liquid",
  "Use water to extinguish the flame",
  "Burn for more than 4 hours at a time",
  "Light if the wax is less than 10mm",
  "Burn if the glass is cracked or chipped",
];

export default function CareGuidePage() {
  return (
    <div className="min-h-screen bg-bg">

      <PageHero
        eyebrow="Care Guide"
        title="Get the most from your candle."
        description="A well-cared-for candle burns cleaner, smells stronger, and lasts significantly longer."
      />

      {/* Steps */}
      <Container className="py-16 md:py-24">
        <div className="space-y-0 divide-y divide-border-subtle">
          {STEPS.map((s, i) => (
            <AnimateIn key={s.step} delay={i * 60}>
              <div className="py-10 md:py-12 grid md:grid-cols-[100px_1fr_auto] gap-6 md:gap-12 items-start">
                <p className="font-display text-4xl font-light italic text-accent/25">{s.step}</p>
                <div>
                  <h2 className="font-display text-2xl font-light text-text mb-3 leading-snug">{s.title}</h2>
                  <p className="font-body text-sm text-text-subtle leading-relaxed">{s.body}</p>
                </div>
                <div className="shrink-0">
                  <span className="font-body text-[10px] tracking-[0.15em] uppercase text-accent bg-accent-pale px-3 py-1.5 whitespace-nowrap">{s.time}</span>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </Container>

      {/* Do not */}
      <AnimateIn>
        <div className="bg-bg-dark">
          <Container className="py-14 md:py-18">
            <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-6">Safety First</p>
            <h2 className="font-display text-3xl font-light italic text-text-inverse mb-8">What not to do.</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              {DONT_DO.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-error text-sm mt-0.5 shrink-0">✕</span>
                  <p className="font-body text-sm text-text-inverse/60 leading-snug">{item}</p>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </AnimateIn>

      <AnimateIn>
        <Container className="py-14 text-center">
          <p className="font-body text-sm text-text-muted mb-6">Still have questions about your candle?</p>
          <div className="flex items-center justify-center gap-6">
            <Link href="/faq" className="inline-block font-body text-[11px] tracking-[0.2em] uppercase text-accent border border-accent px-7 py-3.5 hover:bg-accent hover:text-text-on-gold transition-colors duration-200">
              Read the FAQ
            </Link>
            <Link href="/contact" className="font-body text-[11px] tracking-[0.2em] uppercase text-text-muted hover:text-accent transition-colors duration-200">
              Contact Us →
            </Link>
          </div>
        </Container>
      </AnimateIn>
    </div>
  );
}
