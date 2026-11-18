# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Attendees and viewers:** founders and engineers building with AI agents, mostly in
  Lisbon. They come to the monthly meetup, then watch the talks and read the transcripts
  here.
- **Sponsors** (`/sponsor`): AI and dev-tool companies that want developers and founders
  using their product, and companies hiring (talent agencies too) that want to meet
  engineers and founders. Investors come second.

## Product Purpose

agnteng.com is the archive and front door of Agentic Engineering, a monthly meetup in
Lisbon where people show what they've shipped with agents: ten-minute talks, then open
questions. The site holds every talk with its video and transcript, the speakers, and each
meetup with its photos and Q&A. Substack stays the newsletter; the site shows its latest
posts and doesn't mirror them.

## Positioning

Talks are real work, technical, never pitches, and sponsorship never buys stage time.
Every registration says who the person is (role, company, socials) and what they're
looking for (a job, a co-founder, people to hire, money to raise), so a sponsor knows
who they'll meet.

## Operating Context

Registration is on Luma, videos on YouTube, the newsletter on Substack. The site is
static and rebuilt on every deploy.

## Capabilities and Constraints

- Static pages: a form needs an outside endpoint to send anything.
- Event pages never name the venue. Lisbon-targeted pages show Lisbon only.
- Undecided: where the sponsor form's messages go.

## Brand Commitments

- Built from `packages/brand` (components, tokens, icons, the cell animation), never
  look-alikes, and no other fonts. Manrope throughout; Kode Mono only in small doses
  (pills, dates, small uppercase labels).
- Every page opens on the electric-blue hero; meetup photos take the brand blues and
  break up into it cell by cell. The animation is always live, never static or stock.
- Copy is plain and says the fact. Never "the room", "so far" or "the night"; section
  titles are plain nouns.

## Evidence on Hand

- Meetup photos (`content/<date>/photos/`), every published talk with video and
  transcript, speaker headshots, and the sponsor deck's figures.
- Community numbers come from Luma registrations. On `/sponsor` they are samples until
  the real ones are supplied; never invent others.

## Product Principles

1. Content first: talks and transcripts lead.
2. The brand's own parts, used as designed.
3. Plain facts over marketing phrasing.
4. Real people in real photos.
