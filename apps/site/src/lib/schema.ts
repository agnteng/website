// schema.org JSON-LD for search engines, built from the content the pages show.
// A page passes its nodes to Shell as `schema`.
import { links, eventName, eventSlug, eventSummary, coverAt, isUpcoming, thumbnail, type Event, type Talk } from './data';

const abs = (path: string) => new URL(path, import.meta.env.SITE).href;

// Enough of the organisation for another node to point at; the home page carries the rest.
const org = { '@type': 'Organization', '@id': abs('/#organization'), name: 'Agentic Engineering', url: abs('/') };

export const organization = { ...org, logo: abs('/assets/logo/ae-icon.svg'), sameAs: [links.youtube, links.substack, links.luma] };

// Names the site in search results.
export const website = { '@type': 'WebSite', '@id': abs('/#website'), name: 'Agentic Engineering', url: abs('/'), publisher: { '@id': org['@id'] } };

export const eventNode = (e: Event) => ({
  '@type': 'Event',
  '@id': abs(`/events/${eventSlug(e)}#event`),
  name: `Agentic Engineering ${eventName(e)}`,
  description: eventSummary(e),
  url: abs(`/events/${eventSlug(e)}`),
  startDate: e.luma?.startAt ?? e.date,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  // The city only: event pages never name the venue (AGENTS.md).
  location: { '@type': 'Place', name: e.city, address: { '@type': 'PostalAddress', addressLocality: e.city } },
  organizer: org,
  ...(coverAt(e) && { image: abs(coverAt(e)!.img.src) }),
  ...(e.speakers?.length && { performer: e.speakers.map((s) => ({ '@type': 'Person', name: s.name })) }),
  ...(isUpcoming(e) && e.free && e.luma && { offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR', url: e.luma.url, availability: 'https://schema.org/InStock' } }),
});

// Search engines need the publish date, which a video has once it is public.
export const videoNode = (t: Talk) =>
  t.video?.publishedAt && {
    '@type': 'VideoObject',
    '@id': abs(`/talks/${t.id}#video`),
    name: t.title,
    description: t.summary,
    thumbnailUrl: abs(thumbnail(t)!),
    uploadDate: t.video.publishedAt,
    ...(t.video.duration && { duration: `PT${Math.floor(t.video.duration / 60)}M${t.video.duration % 60}S` }),
    embedUrl: `https://www.youtube-nocookie.com/embed/${t.video.youtubeId}`,
    url: abs(`/talks/${t.id}`),
    publisher: org,
  };

// The path to a page from its section, e.g. Talks > the talk.
export const breadcrumbs = (...trail: [name: string, path: string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});
