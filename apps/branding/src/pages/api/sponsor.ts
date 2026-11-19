// agnteng.com/sponsor's form (docs/adr/0027): name, email, company and role, passed on to
// the organizers' bot by src/lib/forms.ts.
export const prerender = false;

import type { APIRoute } from 'astro';
import { EMAIL, field, handle, readiness } from '../../lib/forms';

export const GET: APIRoute = readiness;

export const POST: APIRoute = ({ request }) =>
  handle(request, {
    page: '/sponsor',
    kind: 'sponsor',
    text: 'New sponsor enquiry from the form on agnteng.com/sponsor; name, email, company and role are what the visitor typed.',
    read: (data) => {
      const f = {
        name: field(data.get('name'), 200),
        email: field(data.get('email'), 254),
        company: field(data.get('company'), 200),
        role: field(data.get('role'), 200),
      };
      return f.name && f.company && f.role && EMAIL.test(f.email)
        ? f
        : 'Enter your name, an email address like name@company.com, your company and your role.';
    },
  });
