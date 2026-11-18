// Companies the community's members work at, in the order the home page's logo
// strip shows them.
//
// Each logo is src/companies/<id>.svg: the company's own artwork reduced to one
// colour, with no fill of its own so it takes the text colour, white parts cut
// out, scaled to a height of 100 and its viewBox fitted to the ink.
// `fill-opacity` is the only colour a logo may carry, for a mark told apart by
// colour alone (Mastercard's circles). `mise run fitness` holds a logo to this
// (docs/adr/0025).
//
// `size` is a logo's height against a square mark's, so every logo looks
// equally big: width/height ^ -0.4 × (ink coverage / 0.34) ^ -0.3, then
// adjusted by eye.
const files = import.meta.glob<string>('../companies/*.svg', { query: '?raw', import: 'default', eager: true });

interface Company {
  id: string;
  name: string;
  size: number;
}

const list: Company[] = [
  { id: 'aws', name: 'AWS', size: 0.79 }, // aws.amazon.com
  { id: 'cloudflare', name: 'Cloudflare', size: 0.54 }, // cloudflare.com/press-kit, single colour
  { id: 'nokia', name: 'Nokia', size: 0.59 }, // nokia.com
  { id: 'apify', name: 'Apify', size: 0.59 }, // apify.com
  { id: 'posthog', name: 'PostHog', size: 0.5 }, // posthog.com/brand, black
  { id: 'coinbase', name: 'Coinbase', size: 0.44 }, // Wikimedia Commons
  { id: 'deliveryhero', name: 'Delivery Hero', size: 0.54 }, // Wikimedia Commons
  { id: 'deepl', name: 'DeepL', size: 0.74 }, // Wikimedia Commons
  { id: 'near', name: 'NEAR', size: 0.54 }, // docs.near.org
  { id: 'ebay', name: 'eBay', size: 0.71 }, // Wikimedia Commons
  { id: 'mastercard', name: 'Mastercard', size: 0.65 }, // Wikimedia Commons
  { id: 'maersk', name: 'Maersk', size: 0.62 }, // Wikimedia Commons
  { id: 'sixt', name: 'Sixt', size: 0.55 }, // Wikimedia Commons, without "SE"
  { id: 'volkswagen', name: 'Volkswagen', size: 0.95 }, // Wikimedia Commons
];

export const companies = list.map((c) => {
  const svg = files[`../companies/${c.id}.svg`];
  const viewBox = svg?.match(/viewBox="([^"]+)"/)?.[1];
  if (!svg || !viewBox) throw new Error(`companies.ts: no logo at src/companies/${c.id}.svg`);
  return {
    ...c,
    viewBox,
    width: Number(viewBox.split(' ')[2]),
    paths: svg.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, ''),
  };
});
