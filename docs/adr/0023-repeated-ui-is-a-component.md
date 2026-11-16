# 0023. What the site repeats is a component; each meetup owns a colour

- Status: Accepted
- Date: 2026-11-16

## Context
A design critique on 2026-11-16 found a meetup's date drawn seven ways in two
typefaces, page titles at three sizes, the Register button in five looks with
four labels, and the same meetup's photo in a different colour on each page.
Each page had written them by hand, and they had drifted apart.

## Decision
On agnteng.com, a thing that appears on more than one page is drawn by one
component in `apps/site/src/components/`, and pages don't restyle it:
`EventDate` for a meetup's date, `PageTitle`, `SectionHeading`, `SubHeading`
and `Label` for headings and labels, `RegisterButton` for registering,
`NextMeetup` and `NextMeetupStrip` for the next meetup, `EventCover` for a
meetup's photo. The pitch line and the line on speaking are written once in
`lib/data.ts`.

Each meetup owns one of the brand's three meetup colours (`eventTint`, by its
number in its city, so a new meetup never changes another's), and its photos take that colour wherever they are shown, except the
blue heroes and the gallery, which is the untinted record of the night.

## Consequences
Changing how a date, a heading or Register looks is one edit. A page that needs
something the component lacks extends the component, not the page. The brand
`Button` gained `inverse`, `inverse-outline` and `size="sm"` so no page
overrides it.
