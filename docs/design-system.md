# CareerPilot AI — Design System

A futuristic, minimalist dark theme. Deep neutral backgrounds, one violet-blue
primary and one cyan secondary, generous negative space, and motion used
sparingly to signal "AI is working" rather than for decoration.

> **Revamp note:** the palette below was retuned in the full visual revamp
> (agent rebrand — Nexus/Radar/Mentor/Hermes/Atlas/Aria — plus glass
> morphism, dot-grid backgrounds, gradient borders, and animated counters).
> Backend/API behavior was untouched; this section documents the *current*
> color values, which shifted slightly bluer/deeper than the originals.

---

## 1. Colors

### Background layers (dark, 3 levels of depth)

| Token | Hex | HSL | Use |
|---|---|---|---|
| `--background` | `#080B14` | `225 43% 5%` | App shell / page background — near-black, blue cast |
| `--card` | `#0F1320` | `226 36% 9%` | Cards, panels, sidebar |
| `--elevated` | `#141825` | `226 30% 11%` | Modals, dropdowns, popovers, raised/hover cards |

### Accents

| Token | Hex | HSL | Use |
|---|---|---|---|
| `--primary` | `#7C5CFC` | `252 96% 67%` | Primary actions, active nav item, focus rings, key stats |
| `--secondary` | `#00D4FF` | `190 100% 50%` | Secondary CTAs, AI/agent indicators, links, highlights |

Gradient (`violet → cyan`) is used liberally per the revamp: CTA buttons,
agent icon backgrounds, the active sidebar item, hero headline text.

### Status

| Token | Hex | HSL | Use |
|---|---|---|---|
| `--success` | `#10B981` | `160 84% 39%` | Completed, applied, passed, sent |
| `--warning` | `#F59E0B` | `38 92% 50%` | Pending, needs attention, awaiting approval |
| `--destructive` | `#EF4444` | `0 84% 60%` | Failed, rejected, blocking error |

### Text

| Token | Hex | HSL | Use |
|---|---|---|---|
| `--foreground` | `#F5F7FA` | `216 33% 97%` | Headings, primary body text |
| `--muted-foreground` | `#6B7280` | `220 9% 46%` | Secondary copy, timestamps, placeholders |

### Borders

| Token | Hex | HSL | Use |
|---|---|---|---|
| `--border` | `#1E2433` | `223 26% 16%` | Default card/input borders |
| `--border-strong` | — | `223 24% 26%` | Hover/focus borders, dividers that need to read clearly |

### Gradients

```css
--gradient-primary: linear-gradient(135deg, #7C5CFC 0%, #00D4FF 100%);
--gradient-glow: radial-gradient(circle at 50% 0%, rgba(124, 92, 252, 0.25) 0%, transparent 70%);
--gradient-surface: linear-gradient(180deg, #0C1016 0%, #05070A 100%);
```

`--gradient-primary` is used sparingly: primary CTA buttons, the active
progress ring on ATS scores, the orchestrator "agent active" pulse, and
key headline text (as a background-clip gradient) on the landing page.
`--gradient-glow` sits behind hero sections and empty-state illustrations
for depth without adding visual noise.

---

## 2. Typography

- **Headings:** `Space Grotesk` — geometric, slightly technical, reads as
  "futuristic" without being a display/novelty face. Loaded via
  `next/font/google`.
- **Body / UI:** `Inter` — neutral, highly legible at small sizes, the
  practical default for dense dashboard UI.
- **Monospace** (scores, code, timestamps in logs): `JetBrains Mono`.

```css
--font-heading: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
--font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
```

### Size scale

| Token | rem / px | Typical use |
|---|---|---|
| `text-xs` | 0.75rem / 12px | Badges, timestamps |
| `text-sm` | 0.875rem / 14px | Secondary UI text, form labels |
| `text-base` | 1rem / 16px | Body copy |
| `text-lg` | 1.125rem / 18px | Card titles |
| `text-xl` | 1.25rem / 20px | Section headers |
| `text-2xl` | 1.5rem / 24px | Page titles |
| `text-3xl` | 1.875rem / 30px | Dashboard hero numbers |
| `text-4xl` | 2.25rem / 36px | Landing section headings |
| `text-5xl` | 3rem / 48px | Landing hero (mobile) |
| `text-6xl` | 3.75rem / 60px | Landing hero (desktop) |

### Weights

`400` regular (body), `500` medium (UI labels, nav items), `600` semibold
(card titles, buttons), `700` bold (page titles, hero headlines).

### Line heights

`leading-tight` 1.2 (headings), `leading-normal` 1.5 (body/UI default),
`leading-relaxed` 1.75 (long-form: job descriptions, feedback summaries).

---

## 3. Spacing & Radius

4px base unit, Tailwind's default scale used as-is: `1` = 4px, `2` = 8px,
`3` = 12px, `4` = 16px, `5` = 20px, `6` = 24px, `8` = 32px, `10` = 40px,
`12` = 48px, `16` = 64px, `20` = 80px, `24` = 96px.

| Token | px | Use |
|---|---|---|
| `radius-sm` | 6px | Badges, small buttons, inputs |
| `radius-md` | 10px | Buttons, form controls |
| `radius-lg` | 16px | Cards, panels |
| `radius-xl` | 24px | Modals, hero sections |
| `radius-full` | 9999px | Avatars, pills, icon buttons |

---

## 4. Animation Tokens

### Durations

```css
--duration-fast: 150ms;    /* micro-interactions: hover, toggle */
--duration-base: 250ms;    /* default transitions: card hover, tab switch */
--duration-slow: 400ms;    /* panel/modal enter-exit */
--duration-slower: 600ms;  /* page-level transitions, staggered lists */
```

### Easing

```css
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);   /* default, symmetric */
--ease-emphasized: cubic-bezier(0.2, 0, 0, 1);   /* entrances, feels snappy */
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1);   /* exits */
```

### Framer Motion variants (common, reused across features)

```ts
// lib/animations.ts
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } },
};

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

// Used for the agent "thinking" / live indicator (pulsing glow)
export const pulseGlow = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
  },
};

// Card hover lift
export const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } },
};
```

### Revamp utility classes (globals.css)

Added in the visual revamp, available anywhere as plain Tailwind-adjacent
utility classes (no import needed):

| Class | What it does |
|---|---|
| `.bg-dot-grid` | Faint dot-grid background texture |
| `.glass` | Glass morphism surface (blurred, translucent) |
| `.card-hover` | Standard lift + shadow + border-brighten on hover |
| `.gradient-border-top` | 2px violet→cyan hairline along a card's top edge |
| `.skeleton` | Shimmering skeleton-loading gradient |
| `.glow-ambient` | Soft radial glow behind hero/empty-state content |
| `.bg-gradient-animated` | Slow-drifting gradient background (hero/login) |
| `.text-gradient` | Violet→cyan gradient text-fill |
| `.animate-blob` | Slow floating drift, for background blob shapes |

`lib/use-count-up.ts` animates a number counting up on mount/change —
used by every dashboard stat tile.

---

## 5. Dashboard Color Preview (described)

Opening the dashboard: the page sits on `--bg-base`, a near-black with a
faint blue undertone — not pure `#000`, so it doesn't feel flat under a
bright monitor. A thin left sidebar (`--bg-surface`) holds the nav —
Dashboard, Profile, Resumes, Jobs, Interviews, Emails, Roadmap, Agents —
each icon in `--text-secondary`, the active item lit up in
`--accent-primary` with a soft violet glow behind its icon.

The top bar is transparent against `--bg-base`, showing the user's avatar,
a notification bell (a small `--accent-secondary` dot when unread), and a
theme toggle.

The main content area is a grid of `--bg-surface` cards with 16–24px
radius and a hair-thin `--border-subtle` outline — they look like they're
floating just slightly above the background, not boxed in. The hero stat
row up top uses large `text-3xl` numbers in `--text-primary` ("72% ATS
Score", "14 Applications", "3 Interviews Scheduled"), each with a small
label underneath in `--text-muted`. The ATS score card has a circular
progress ring rendered in `--gradient-primary` (violet fading to cyan)
against a `--bg-elevated` track.

Below, an "Agent Activity" panel shows the Master Orchestrator's live feed:
each row a small `--accent-secondary` dot that pulses softly
(`pulseGlow`) next to entries like "Job Hunter found 4 new matches" in
`--text-secondary`, timestamps in `--text-muted` monospace. A "Continue
your roadmap" card sits alongside with a horizontal step tracker — completed
steps filled solid in `--success`, the current step outlined in
`--accent-primary`, future steps a muted outline in `--border-strong`.

Primary buttons ("Apply Now", "Start Interview") use `--gradient-primary`
with white text and a subtle lift + brighten on hover (`hoverLift`).
Secondary/ghost buttons are transparent with a `--border-subtle` outline
that brightens to `--border-strong` on hover. Destructive actions
(withdraw application, delete resume) use `--error` text on a transparent
background, only filling solid on confirm.

Overall impression: dark, quiet, and precise — color is used as signal
(status, AI activity, primary action) rather than decoration, which is
what should read as "futuristic minimalist" rather than "generic dark
mode."
