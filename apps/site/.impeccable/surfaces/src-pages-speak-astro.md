---
version: 1
slug: "src-pages-speak-astro"
primary_target: "src/pages/speak.astro"
related_targets: []
---

# /speak

Mode: Persuade. Someone building with AI decides to give a talk and applies.

- Audience: founders and engineers who have shipped something with AI and could show it in ten minutes.
- Action: the form (name, email, company, role, GitHub or LinkedIn, the talk); it reaches the organizers' bot through the branding app's endpoint (docs/adr/0028).
- Proof: four recent talks, each with its speaker's tile.
- Constraints: talks are for a technical audience and never a product pitch; name Lisbon and "other European cities". No Kode Mono. Site copy rules; brand parts only.

## Direction contract

THESIS: The bar for a talk is shown, not described: four recent talks, each with its speaker's colour tile, sit under the rules beside the form. Refuses the category default: a bare call-for-papers form or a list of perks.

OWN-WORLD: agnteng.com as it stands. Electric-blue hero block; a white form card with the brand's fields and pill button; speaker tiles with the live dither in the brand's speaker presets; Manrope only, extra-bold headings; small periwinkle square bullets.

STORY: A builder learns that Agentic Engineering hosts events with three ten-minute technical talks each, sees four recent talks and who gave them, believes their own work fits, and applies.

FIRST VIEWPORT: Desktop: nav on blue; H1, one line and three rules in the left half, then "Recent talks" as a two-by-two grid of cells (tile left, title and speaker right), centred vertically against the white form card in the right five columns, its short fields in pairs. Phone: H1, line, rules, a two-by-two grid of tiles with titles under them, then the card.

FORM: Code-led, no image generation. Structure 1 of 7 (talks beside the form), chosen by the user from the three dealt (seed key bb677cc7), with his edits: speaker tiles instead of video covers, four talks two by two.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open

- None.
