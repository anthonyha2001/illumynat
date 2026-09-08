import { Container } from "@/components/ui/Container";
import { GiftCardClient } from "./GiftCardClient";

export const metadata = { title: "Gift Cards — ILLUMYNAT" };

export default function GiftCardPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Container className="py-12 md:py-20 max-w-2xl">
        <div className="mb-10">
          <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-3">
            Gifting
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-light italic text-text mb-3">
            Send a gift card.
          </h1>
          <p className="font-body text-sm text-text-muted leading-relaxed max-w-sm">
            Delivered instantly by email. The recipient chooses their own scent.
            Redeemable on any order, no expiry.
          </p>
        </div>
        <GiftCardClient />
      </Container>
    </div>
  );
}
