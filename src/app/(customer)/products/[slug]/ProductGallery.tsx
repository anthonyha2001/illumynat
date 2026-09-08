"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/utils/cn";

interface GalleryImage {
  url: string;
  altText: string | null;
  isPrimary: boolean;
  position: number;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square bg-bg-subtle flex items-center justify-center">
        <span className="font-display text-8xl text-text-faint italic">I</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 md:sticky md:top-24">
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-[600px] shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative shrink-0 w-16 h-16 md:w-20 md:h-20 overflow-hidden",
                "border transition-colors duration-200",
                active === i ? "border-accent" : "border-border hover:border-text-muted"
              )}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? productName}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 aspect-square md:aspect-[3/4] overflow-hidden bg-bg-subtle">
        <div key={active} className="absolute inset-0">
          <Image
            src={images[active].url}
            alt={images[active].altText ?? productName}
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-bg-dark/60 backdrop-blur-sm px-2.5 py-1">
            <span className="font-body text-[10px] text-white/70 tracking-wider">
              {active + 1} / {images.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
