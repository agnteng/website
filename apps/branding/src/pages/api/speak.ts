// agnteng.com/speak's form, passed on to the organizers' bot by src/lib/forms.ts (docs/adr/0028).
export const prerender = false;

import type { APIRoute } from 'astro';
import { EMAIL, field, handle, readiness } from '../../lib/forms';

// A link to a GitHub or LinkedIn profile, with or without https://, on any of their hosts
// (www., pt.linkedin.com); the page checks the same.
const PROFILE = /^(https?:\/\/)?([\w-]+\.)?(github\.com|linkedin\.com)\/\S+$/i;
const TALK_MIN = 30; // characters: a few sentences, as the page asks

export const GET: APIRoute = readiness;

export const POST: APIRoute = ({ request }) =>
  handle(request, {
    page: '/speak',
    name: 'speaker',
    text: 'New speaker application from the form on agnteng.com/speak; name, company, role, profile, email and talk are what the applicant typed.',
    read: (data) => {
      const profile = field(data.get('profile'), 300);
      const f = {
        name: field(data.get('name'), 200),
        company: field(data.get('company'), 200),
        role: field(data.get('role'), 200),
        profile: profile && !/^https?:\/\//i.test(profile) ? `https://${profile}` : profile,
        email: field(data.get('email'), 254),
        talk: field(data.get('talk'), 3000, true),
      };
      return f.name && f.company && f.role && PROFILE.test(f.profile) && EMAIL.test(f.email) && f.talk.length >= TALK_MIN
        ? f
        : 'Fill in every field: a link to your GitHub or LinkedIn, an email address like name@company.com, and a few sentences on your talk.';
    },
  });
