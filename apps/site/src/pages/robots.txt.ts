export const GET = ({ site }: { site: URL }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: /cdn-cgi/\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
