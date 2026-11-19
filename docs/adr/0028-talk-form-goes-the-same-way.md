# 0028. The talk form goes to the organizers' bot like the sponsor form

- Status: Accepted
- Date: 2026-11-19
- Refines: 0027

## Context
The nav's "Apply to speak" pointed at the home page, which told people to
describe their talk in the registration form's talk field. An application
needs more: who they are, a GitHub or LinkedIn link, and the talk itself.

## Decision
agnteng.com/speak has a form (name, company, role, GitHub or LinkedIn, email,
the talk) that posts to the branding app's `api/speak` and reaches the same
Grok Bot routine as the sponsor form, marked `kind: "talk"`; the sponsor
form's posts are `kind: "sponsor"`, and it now asks for a role too. Both pages
draw the form with one component (`EnquiryForm`), and both endpoints go
through one module (`apps/branding/src/lib/forms.ts`), so the checks, the
retry and the log are the same. The site says how to speak in one place
(`ToSpeak`), which points at the form.

## Consequences
The routine tells the two kinds apart by `kind`. Another form is a page, its
fields, and an endpoint of a dozen lines.
