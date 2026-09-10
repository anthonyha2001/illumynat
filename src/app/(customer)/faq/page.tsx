"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { AnimateIn } from "@/components/ui/AnimateIn";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import { cn } from "@/utils/cn";

const CATEGORIES = [
  {
    label: "Orders & Shipping",
    questions: [
      {
        q: "How long does it take to process my order?",
        a: "All orders are processed within 72 hours of purchase. Because we make in small batches, some items may require an additional 24 hours. You will receive an email confirmation when your order ships.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes — standard shipping is free on all orders over $75. Express and overnight options are available at a flat rate. See our Shipping & Returns page for full details.",
      },
      {
        q: "Can I change or cancel my order after placing it?",
        a: "You can modify or cancel an order within 2 hours of placing it by contacting us at orders@lumynat.com. After that window, the order may already be in production and we cannot guarantee changes.",
      },
      {
        q: "Do you ship internationally?",
        a: "We currently ship to the United States, Canada, the United Kingdom, Australia, and most of Western Europe. International orders may be subject to customs duties, which are the responsibility of the recipient.",
      },
      {
        q: "How do I track my order?",
        a: "Once your order ships, you will receive a tracking number via email. You can also check your order status under My Account → Orders.",
      },
    ],
  },
  {
    label: "Products & Scents",
    questions: [
      {
        q: "How long do LUMYNAT candles burn?",
        a: "Burn time depends on the vessel size. Our standard 8oz candles burn for approximately 50–55 hours with proper care. The 12oz burns for 70–80 hours. Always follow the care guide for maximum burn time.",
      },
      {
        q: "Are your candles safe for people with allergies or sensitivities?",
        a: "All of our fragrances are phthalate-free and formulated without common allergens where possible. However, if you have a known fragrance sensitivity, we recommend checking the full ingredient list on each product page before purchasing. Contact us if you need information about a specific ingredient.",
      },
      {
        q: "Why does my candle look slightly different from the product photo?",
        a: "Because we hand-pour in small batches, minor variations in surface texture and colour between pours are normal and expected. These are not defects — they are a characteristic of handmade production. Scent and burn performance are never affected.",
      },
      {
        q: "Can I buy fragrance oils or refills separately?",
        a: "We do not currently sell fragrance oils or refills separately. If this is something you would like to see, let us know via the contact form — your feedback shapes what we develop next.",
      },
      {
        q: "Do you make custom scents or private label candles?",
        a: "Yes, for orders of 50 units or more. We work with select brands, hotels, and events on bespoke fragrance development. Reach out via the contact form to start a conversation.",
      },
    ],
  },
  {
    label: "Returns & Refunds",
    questions: [
      {
        q: "What is your return policy?",
        a: "We accept returns within 30 days of delivery for unused items in their original packaging. Contact us at returns@lumynat.com with your order number and we will send a prepaid return label within 24 hours.",
      },
      {
        q: "My candle arrived damaged. What do I do?",
        a: "Please take a photo of the damage and email it to us within 48 hours of delivery. We will send a replacement at no charge, usually within 3–5 business days. We do not require you to return the damaged item.",
      },
      {
        q: "Can I exchange a candle for a different scent?",
        a: "Yes — unused candles can be exchanged within 30 days. Follow the same process as a return, and note in your email which scent you would like instead. The price difference, if any, will be charged or refunded accordingly.",
      },
      {
        q: "When will I receive my refund?",
        a: "Once we receive and inspect the return, your refund is processed within 3–5 business days. Depending on your bank, it may take an additional 2–5 days to appear on your statement.",
      },
    ],
  },
  {
    label: "Gifting",
    questions: [
      {
        q: "Can I add a gift message to my order?",
        a: "Yes. At checkout there is a gift message field. We write every note by hand on heavy card stock. The message is included inside the box.",
      },
      {
        q: "Will the recipient see the price?",
        a: "No. Gift orders are packed without any pricing information. The packing slip includes the gift message only.",
      },
      {
        q: "Can I ship directly to the recipient?",
        a: "Absolutely. Just enter their address as the shipping address at checkout. You can also schedule delivery up to 30 days in advance if you want it to arrive on a specific date.",
      },
      {
        q: "Do you offer gift cards?",
        a: "Yes — digital gift cards are available in any amount starting from $25. They are delivered by email and have no expiry date. See our Gift Card page for details.",
      },
    ],
  },
  {
    label: "Account & Loyalty",
    questions: [
      {
        q: "Do I need an account to place an order?",
        a: "No — you can check out as a guest. However, creating an account lets you track orders, save addresses, and build a wishlist.",
      },
      {
        q: "How do I reset my password?",
        a: "Go to the Account page and click 'Forgot password'. We will send a reset link to the email address on file. Check your spam folder if you do not see it within a few minutes.",
      },
      {
        q: "Do you have a loyalty or rewards programme?",
        a: "We are working on one. If you would like to be notified when it launches, sign up for our newsletter and you will be the first to know.",
      },
    ],
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("w-4 h-4 shrink-0 transition-transform duration-300", open && "rotate-180")}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-subtle">
      <button
        className="w-full flex items-start justify-between gap-4 py-5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-body text-sm font-medium text-text leading-snug">{q}</span>
        <span className={cn("mt-0.5 transition-colors duration-200", open ? "text-accent" : "text-text-muted")}>
          <ChevronIcon open={open} />
        </span>
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="font-body text-sm text-text-subtle leading-relaxed pb-5">{a}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-bg">

      {/* Header */}
      <div className="border-b border-border-subtle">
        <Container className="py-14 md:py-20">
          <FadeIn>
            <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">Help</p>
            <h1 className="font-display text-4xl md:text-6xl font-light italic text-text mb-4">
              Frequently asked<br />questions.
            </h1>
            <p className="font-body text-sm text-text-muted max-w-md leading-relaxed">
              Everything you need to know about ordering, products, returns, and gifting.
              Can&apos;t find what you&apos;re looking for? <Link href="/contact" className="text-accent hover:underline underline-offset-2">Contact us</Link>.
            </p>
          </FadeIn>
        </Container>
      </div>

      <Container className="py-10 md:py-16">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">

          {/* Category tabs */}
          <aside className="md:w-56 shrink-0">
            <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveTab(i)}
                  className={cn(
                    "whitespace-nowrap md:whitespace-normal text-left font-body text-[11px] tracking-[0.12em] uppercase px-4 py-2.5 transition-colors duration-200",
                    i === activeTab
                      ? "bg-accent text-text-on-gold"
                      : "text-text-muted hover:text-accent"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Questions */}
          <div className="flex-1">
            <AnimateIn key={activeTab}>
              <h2 className="font-display text-2xl font-light italic text-text mb-6">
                {CATEGORIES[activeTab].label}
              </h2>
              <div>
                {CATEGORIES[activeTab].questions.map((item) => (
                  <AccordionItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </Container>

      {/* Contact CTA */}
      <AnimateIn>
        <div className="border-t border-border-subtle bg-bg-subtle">
          <Container className="py-12 text-center">
            <p className="font-display text-2xl font-light italic text-text mb-2">Still have questions?</p>
            <p className="font-body text-sm text-text-muted mb-6">Our team responds within 24 hours on business days.</p>
            <Link
              href="/contact"
              className="inline-block font-body text-[11px] tracking-[0.2em] uppercase bg-accent text-text-on-gold px-8 py-4 hover:bg-accent-dark transition-colors duration-200"
            >
              Contact Us
            </Link>
          </Container>
        </div>
      </AnimateIn>
    </div>
  );
}
