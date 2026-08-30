import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

// Headings — geometric, technical, reads as "futuristic" without
// tipping into a novelty display face.
export const fontHeading = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// Body / UI — neutral and highly legible at small dashboard sizes.
export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

// Scores, timestamps, agent logs.
export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
