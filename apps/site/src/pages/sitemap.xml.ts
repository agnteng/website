// Every page of the site, at the address its canonical link gives. A talk's date is
// its video's; an event's is its latest talk's.
import { events, talks, talksAt, eventSlug, type Talk } from '../lib/data';

const latest = (ts: Talk[]) => ts.map((t) => t.video?.publishedAt?.slice(0, 10)).filter(Boolean).sort().at(-1);

export const GET = ({ site }: { site: URL }) => {
  const pages: [path: string, lastmod?: string][] = [
    ['/'],
    ['/talks'],
    ['/speakers'],
    ['/events'],
    ['/sponsor'],
    ['/speak'],
    ...events.map((e): [string, string?] => [`/events/${eventSlug(e)}`, latest(talksAt(e))]),
    ...talks.map((t): [string, string?] => [`/talks/${t.id}`, latest([t])]),
  ];
  const urls = pages
    .map(([path, lastmod]) => `  <url><loc>${new URL(path, site).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
