import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { fontHeading, fontBody, fontMono } from "@/styles/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareerPilot AI",
  description:
    "AI-powered career copilot for Indian college students and early career professionals — resumes, job hunting, interview prep, and outreach, run by autonomous agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontHeading.variable} ${fontBody.variable} ${fontMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        {/*
          The design system currently defines a single dark theme (see
          docs/design-system.md). next-themes is wired up now per the
          tech stack, forced to dark, so a light palette can be added
          later without touching this file again.
        */}
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          {children}
          <Toaster theme="dark" richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
