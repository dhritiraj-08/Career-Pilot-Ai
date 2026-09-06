import Link from "next/link";
import { AtSign, Briefcase, Code2, Rocket } from "lucide-react";

const FOOTER_LINKS = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Contact", href: "#" },
];

// lucide-react dropped brand/logo icons — generic stand-ins rather than
// mislabeling an unrelated glyph as a specific platform's actual logo.
const SOCIALS = [
  { label: "Twitter", icon: AtSign, href: "#" },
  { label: "LinkedIn", icon: Briefcase, href: "#" },
  { label: "GitHub", icon: Code2, href: "#" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-10 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="text-center sm:text-left">
          <Link href="/" className="flex items-center justify-center gap-2 sm:justify-start">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
              <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
            </span>
            <span className="font-heading text-base font-bold text-foreground">CareerPilot AI</span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Built with ❤️ for Indian job seekers</p>
        </div>

        <nav className="flex gap-6">
          {FOOTER_LINKS.map((link) => (
            <a key={link.label} href={link.href} className="text-sm text-muted-foreground transition-colors duration-fast hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex gap-3">
          {SOCIALS.map((social) => (
            <a
              key={social.label}
              href={social.href}
              aria-label={social.label}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-fast hover:border-border-strong hover:text-foreground"
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
