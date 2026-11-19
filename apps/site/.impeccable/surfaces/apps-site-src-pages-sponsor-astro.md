---
version: 1
slug: "apps-site-src-pages-sponsor-astro"
primary_target: "apps/site/src/pages/sponsor.astro"
related_targets: []
---

# /sponsor

Mode: Persuade. A company decides to sponsor an event and leaves its details.

- Audience: AI and dev-tool companies (want developers and founders on their product), companies hiring and talent agencies (want to meet engineers and founders). Investors second.
- Action: the form (name, email, company); it reaches the organizers' bot by webhook through the branding app's endpoint (docs/adr/0027). No prices, no package list.
- Proof: the organizers' figures from Luma registrations, a real event photo, where the community works.
- Constraints: name Lisbon, and "events", not only meetups ("Lisbon and other European cities"). No Kode Mono anywhere on the page. Site copy rules; brand parts only.

## Direction contract

THESIS: The community is shown before anything is asked: pitch and form share the first viewport over a full Lisbon event, and the numbers say who comes and what they come for. Refuses the category default: tier cards, a logo wall, a generic split-screen SaaS form.

OWN-WORLD: agnteng.com as it stands. Electric-blue hero block; an event photo in the blue tone breaking up into blue cells; a deep-navy section with the dim live dither, as on the sponsor deck; Manrope only, extra-bold for headings and numbers; a white form card with the brand's fields and pill buttons; dark panels with hairlines on navy.

STORY: A company learns Agentic Engineering hosts events in Lisbon and other European cities for founders and developers building with AI, sees how many come and who they are, believes it reaches the people it wants, and leaves its details.

FIRST VIEWPORT: Desktop: nav on blue; H1 (the hook) and one line in the left half, centred vertically against the white form card in the right five columns; below, a full-bleed blue-toned crowd band whose top dissolves into the blue. Phone: H1, line, card, band.

FORM: Code-led, no image generation. A precisely specified surface inside the established world, so no concept roll and no seed key. Community section: the company-logo strip (white) before it; no heading on screen (sr-only), then three equal square blocks in the brand's three meetup colours (electric blue, violet, magenta), each breaking up at its top-right corner into the navy in cells, a big number on the colour with a caption under it: 1,000 community members, 80% founders and developers, 70 attendees on average. No bar and no photos, nothing below. Motion: the hero's rise-in, the live cells on the hero band and the dim dither behind the community.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open

- Developers (this page) or Engineers (the sponsor deck).
