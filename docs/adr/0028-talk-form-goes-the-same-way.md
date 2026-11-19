# 0028. The talk form goes to the organizers' bot like the sponsor form

- Status: Accepted
- Date: 2026-11-19
- Refines: 0027

## Context
The nav's "Apply to speak" pointed at the home page, which told people to
describe their talk in the registration form's talk field. An application
needs more: who they are, a GitHub or LinkedIn link, and the talk itself.

## Decision
agnteng.com/speak has a form (name, email, company, role, GitHub or LinkedIn,
the talk) that posts to the branding app's `api/speak`, which passes it to the
same Grok Bot routine as the sponsor form. Every post names its form,
`form: "speaker"` or `form: "sponsor"`, and the sponsor form now asks for a
role too. Both pages draw the form with one component (`EnquiryForm`), and
both endpoints go through one module (`apps/branding/src/lib/forms.ts`).

Two things in 0027 change. `api/sponsor` is no longer the app's only `POST`
endpoint: Astro's origin check stays off for both, and each checks the origin
itself. One address can send ten posts in fifteen minutes across both forms,
not five: people at an event share its network.

## Consequences
The routine tells the forms apart by `form`. Another form is a page, its
fields, and an endpoint of a dozen lines.
