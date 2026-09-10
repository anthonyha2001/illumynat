import { Container } from "@/components/ui/Container";

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  /** Extra content rendered below the description */
  children?: React.ReactNode;
  centered?: boolean;
}

export function PageHero({ eyebrow, title, description, children, centered = false }: PageHeroProps) {
  return (
    <div className="bg-bg-dark border-b border-white/[0.06]">
      <Container className={`py-20 md:py-28 ${centered ? "text-center flex flex-col items-center" : ""}`}>
        <div className={`space-y-4 ${centered ? "max-w-2xl" : "max-w-2xl"}`}>
          {eyebrow && (
            <p className="font-body text-[10px] tracking-[0.28em] uppercase text-accent">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light italic text-text-inverse leading-tight">
            {title}
          </h1>
          {description && (
            <p className="font-body text-sm text-text-inverse/55 leading-relaxed max-w-sm">
              {description}
            </p>
          )}
          {children}
        </div>
      </Container>
    </div>
  );
}
