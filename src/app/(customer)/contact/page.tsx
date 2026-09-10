import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import ContactForm from "./ContactForm";

export const metadata = { title: "Contact Us — LUMYNAT" };

export default async function ContactPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { firstName: string; lastName: string; email: string } | null = null;
  if (user) {
    profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true, email: true },
    });
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="border-b border-border-subtle">
        <Container className="py-14 md:py-20">
          <p className="font-body text-[11px] tracking-[0.25em] uppercase text-accent mb-4">Get in Touch</p>
          <h1 className="font-display text-4xl md:text-6xl font-light italic text-text mb-4">
            Contact us.
          </h1>
          <p className="font-body text-sm text-text-muted max-w-md leading-relaxed">
            We respond to every message within 24 hours on business days.
            For urgent matters, reach us directly at{" "}
            <a href="mailto:hello@lumynat.com" className="text-accent hover:underline underline-offset-2">
              hello@lumynat.com
            </a>.
          </p>
        </Container>
      </div>

      <Container className="py-14 md:py-20">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">
          <ContactForm profile={profile} />

          {/* Info sidebar */}
          <div className="space-y-10">
            <div>
              <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-4">Response Time</p>
              <p className="font-display text-2xl font-light text-text mb-2">Within 24 hours</p>
              <p className="font-body text-sm text-text-muted leading-relaxed">
                Monday – Friday, 9am – 5pm EST. Messages received on weekends are answered first thing Monday.
              </p>
            </div>

            <div className="border-t border-border-subtle pt-8">
              <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-4">Email Directly</p>
              <div className="space-y-3">
                {[
                  { label: "General",           email: "hello@lumynat.com" },
                  { label: "Orders & Returns",  email: "orders@lumynat.com" },
                  { label: "Press",             email: "press@lumynat.com" },
                ].map(({ label, email }) => (
                  <div key={email}>
                    <p className="font-body text-[11px] text-text-muted uppercase tracking-widest mb-1">{label}</p>
                    <a href={`mailto:${email}`} className="font-body text-sm text-text hover:text-accent transition-colors duration-200">
                      {email}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border-subtle pt-8">
              <p className="font-body text-[11px] tracking-[0.2em] uppercase text-accent mb-4">Quick Links</p>
              <div className="space-y-2">
                {[
                  { label: "Check order status",      href: "/account/orders" },
                  { label: "Shipping & Returns policy", href: "/shipping" },
                  { label: "Candle care guide",        href: "/care" },
                  { label: "FAQ",                      href: "/faq" },
                ].map((l) => (
                  <a key={l.href} href={l.href}
                    className="block font-body text-sm text-text-subtle hover:text-accent transition-colors duration-200">
                    {l.label} →
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
