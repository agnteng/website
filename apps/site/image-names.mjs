// Names for the images the build publishes, saying what each shows: the meetup a
// photo is from, a talk's title and speaker, a speaker's name. The build hands
// astro.config.mjs a file's bytes and its bare name ("01"), so files are recognised
// by a hash of their bytes.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
const jpgs = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jpg')).map((f) => join(dir, f)) : []);

export const hashOf = (bytes) => createHash('sha1').update(bytes).digest('hex');

// hash of the file's bytes → its published name, without hash or extension.
export function imageNames(repoRoot) {
  const names = new Map();
  const name = (path, as) => names.set(hashOf(readFileSync(path)), as);
  for (const date of readdirSync(join(repoRoot, 'content'))) {
    const dir = join(repoRoot, 'content', date);
    if (!existsSync(join(dir, 'event.json'))) continue;
    const event = json(join(dir, 'event.json'));
    const meetup = `agentic-engineering-${slug(event.city)}-${event.number}`;
    for (const photo of jpgs(join(dir, 'photos'))) name(photo, `${meetup}-ai-meetup-${photo.match(/([^/]+)\.jpg$/)[1]}`);
    const talks = jpgs(join(dir, 'talks')).map((still) => ({ still, ...json(still.replace(/\.jpg$/, '.json')) }));
    for (const talk of talks) name(talk.still, slug(`${talk.title} ${talk.speaker}`));
    for (const speaker of event.speakers ?? []) {
      const photo = speaker.photo && join(repoRoot, 'apps/branding/public', speaker.photo);
      // event.json may shorten a name ("Andy Nik"); the talk has it in full.
      const full = talks.find((t) => t.speaker.startsWith(speaker.name))?.speaker ?? speaker.name;
      if (photo && existsSync(photo)) name(photo, `${slug(full)}-agentic-engineering-speaker`);
    }
  }
  return names;
}
