---
version: 1
slug: "apps-site-src-pages-sponsor-astro"
primary_target: "apps/site/src/pages/sponsor.astro"
related_targets: []
---

# /sponsor

Mode: Persuade. A company decides to sponsor an event and leaves its details.

- Audience: AI and dev-tool companies (want developers and founders on their product), companies hiring and talent agencies (want to meet engineers and founders). Investors second.
- Action: the form (name, email, company); it emails the organizers through the branding app's endpoint (docs/adr/0027). No prices, no package list.
- Proof: the community's numbers from Luma registrations (samples until supplied), a real event photo.
- Constraints: name Lisbon, and "events", not only meetups ("Lisbon and other European cities"). No Kode Mono anywhere on the page (user, 2026-11-18). Say that we know the audience, never that we collect data. Site copy rules; brand parts only.

## Direction contract

THESIS: The community is shown before anything is asked: pitch and form share the first viewport over a full Lisbon event, and the numbers say who comes and what they come for. Refuses the category default: tier cards, a logo wall, a generic split-screen SaaS form.

OWN-WORLD: agnteng.com as it stands. Electric-blue hero block; an event photo in the blue tone breaking up into blue cells; a deep-navy section with the dim live dither, as on the sponsor deck; Manrope only, extra-bold for headings and numbers; a white form card with the brand's fields and pill buttons; dark panels with hairlines on navy.

STORY: A company learns Agentic Engineering hosts events in Lisbon and other European cities for founders and developers building with AI, sees who comes, believes it reaches the people it wants, and leaves its details.

FIRST VIEWPORT: Desktop: nav on blue; H1 (the user's hook) and one line in the left half, centred vertically against the white form card in the right five columns; below, a full-bleed blue-toned crowd band whose top dissolves into the blue. Phone: H1, line, card, band.

FORM: Code-led, no image generation. A precisely specified surface inside the established world, so no concept roll and no seed key. Community section, per the user's edits: heading and one line; the average monthly event as a tall photo tile down the right, a full event breaking up into electric blue with the number large on the colour (a stat panel read as AI slop and a sentence was not enough, user 2026-11-18); one solid bar of the role shares with big percentages under each part, bottom-aligned with the tile. Nothing below: the user removed "What they're looking for" and "Who they are". Signature interaction: the bar wipes in from the left once in view. Motion: the hero's rise-in, the live cells and dither, that wipe.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Open

- Real numbers: community size, role shares, average attendance.
- Developers (this page) or Engineers (the sponsor deck).
- The email service set up for agnteng.com, and its key on the branding service.
