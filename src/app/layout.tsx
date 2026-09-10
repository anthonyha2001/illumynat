import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { getPalette, paletteToCSS } from "@/lib/data/siteContent";

// Display font — luxury serif for headings, product names, hero text
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

// Body font — clean, readable sans-serif for all UI text
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LUMYNAT — Artisanal Candles",
    template: "%s | LUMYNAT",
  },
  description:
    "Handcrafted luxury candles made in small batches. Each fragrance tells a story.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const palette = await getPalette();
  const paletteCSS = paletteToCSS(palette);

  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletteCSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
