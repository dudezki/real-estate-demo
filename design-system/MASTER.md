# CONNECT. design system

Generated with the UI/UX Pro Max skill (`--design-system`), then deliberately overridden: the generated
"light SaaS / red primary / Inter-only" result did not fit a cinematic editorial contact center.
Kept from the skill: contrast ≥ 4.5:1, 44px touch targets, SVG icons only (Lucide), visible focus,
`prefers-reduced-motion` respected, motion 300–450ms+ with purpose, responsive 375/768/1024/1440.

| Token | Value | Use |
|---|---|---|
| ink / ink-2 / ink-3 | #0b0a09 / #141210 / #1d1a17 | surfaces |
| paper / paper-dim / mute | #f1ece3 / #b9b1a4 / #8f877b | text (8.9:1 / 5.4:1 on ink worst case) |
| signal | #e8a24a | the single accent: CTAs, live audio, emphasis |
| danger / ok | #ef6b5b / #7fc8a0 | end call / connected |
| Display | Instrument Serif (self-hosted) | headlines, large numerals |
| Text | Inter Variable (self-hosted) | UI and body |

Principles: one accent colour; editorial lists and rules instead of repeated cards; no glassmorphism
beyond the call dock; motion = hero line reveal, parallax, scroll-drawn connector, audio waveform.
Tokens live in `web/src/style.css` (`@theme`).
