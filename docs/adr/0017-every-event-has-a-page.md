# 0017. Every event has a page; registration stays on Luma

- Status: Accepted
- Date: 2026-11-16

## Context
An event had a page only once one of its talks was published. The next meetup,
the thing people search for, was a line in the home page's hero that linked to
Luma, and `/events` did not exist. Sign-ups, approvals and reminders are
Luma's, and the site is static.

## Decision
Every event in `content/` has a page at `/events/<city>-<n>`. Before the
meetup it shows the date, the city, the speakers and a Register link to the
event's Luma page; afterwards its talks, photos and Q&A; in between it says
the talks aren't published yet. `/events` lists every event as a calendar,
upcoming first. The site never takes a registration itself, and these pages
never name the venue: where to go is Luma's to tell a guest.

## Consequences
An upcoming event's page has little on it until speakers are announced. The
site is rebuilt only on deploy, so a page can still say "upcoming" for a while
after the meetup; the script that points register links at the Luma calendar
once the next event has started covers that.
