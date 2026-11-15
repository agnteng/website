// A scene: everything the builder shows and exports, as plain data.
//
//   frame       the export size in px
//   background  an animated field, a photo with artifacts, or a solid colour
//   layers      what sits on top, drawn in order: logos, text, photos, boxes
//   mockup      the platform's own UI around the frame (preview only)
//
// A template is nothing more than a scene somebody saved: PRESETS below are the
// brand's, and the builder keeps the user's own. The same JSON goes to the
// render page (src/pages/render.astro), which is how an agent makes an image.
// Positions and sizes are fractions of the frame, so a scene keeps its layout
// at any size.

import type { AnimName } from '@agnteng/brand/components/Animation.tsx';
import type { Artifact } from '@agnteng/brand/components/Artifacts.tsx';
import type { Anchor } from '@agnteng/brand/components/anchor.ts';

export type Fade = 'none' | 'left' | 'right' | 'up' | 'down' | 'radial';
export type Shape = 'square' | 'dot' | 'halftone';

export interface FieldBg {
  kind: 'field';
  animation: AnimName;
  color: string;
  edge: string;
  bg: string;
  cell: number;
  gap: number;
  density: number;
  fade: Fade;
  motion: number;
  shape: Shape;
  // a photo turns the field into its duotone
  image?: { src: string; position: Anchor; contrast: number; edgeGlow: number; tone: number };
}
export interface PhotoBg {
  kind: 'photo';
  src: string;
  position: Anchor;
  color: string;
  tint: boolean;
  cell: number;
  rough: number;
  seed: number;
  animate: boolean;
  artifacts: Artifact[];
}
export interface SolidBg {
  kind: 'solid';
  color: string;
}
export type Background = FieldBg | PhotoBg | SolidBg;

interface Base {
  id: string;
  hidden?: boolean;
}
export interface LogoLayer extends Base {
  type: 'logo';
  form: 'lockup' | 'line' | 'mark'; // mark + two-line wordmark, mark + one-line wordmark, mark alone
  variant: 'white' | 'blue';
  anchor: Anchor;
  scale: number; // the lockup's width, or the mark's height, as a share of the frame
  dx: number; // nudge from the anchor, in frame widths and heights
  dy: number;
}
export interface TextLayer extends Base {
  type: 'text';
  text: string;
  x: number; // where `align` pins the text
  y: number; // its vertical centre
  size: number; // of the frame's shorter side
  font: 'sans' | 'mono';
  weight: number;
  color: string;
  align: 'left' | 'center' | 'right';
  upper: boolean;
  spacing: number; // letter spacing in em
  pill: boolean; // a capsule behind the text
  pillColor: string;
}
export interface PhotoLayer extends Base {
  type: 'photo';
  src: string;
  x: number; // top-left corner
  y: number;
  w: number;
  h: number;
  fit: 'cover' | 'contain';
  radius: number; // of the box's shorter side
  label: string; // shown in the empty slot
}
export interface RectLayer extends Base {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  opacity: number;
  radius: number;
}
export interface ScrimLayer extends Base {
  type: 'scrim';
  shape: 'left' | 'right' | 'bottom' | 'vignette';
  color: string;
  opacity: number;
}
// A box of the brand's artifact cells, for a lower third: solid over (w, h) from its
// corner or edge, breaking up over `reach`. Sizes are shares of the frame; reach and
// cell are shares of its shorter side.
export interface ArtifactLayer extends Base {
  type: 'artifact';
  at: Anchor; // the corner or edge it grows from
  w: number;
  h: number;
  reach: number; // how far past it the cells thin out to nothing
  turn: number; // degrees, about its own middle
  radius: number; // of its open corners, as a share of the frame's shorter side
  cell: number;
  rough: number; // how ragged its edge is, in cells
  stray: number; // the chance of a lone cell just past the edge
  seed: number;
  color: string;
}
// A dashed outline of where a platform crops: shown in the builder, never exported.
export interface GuideLayer extends Base {
  type: 'guide';
  shape: 'circle' | 'rect';
  x: number; // centre
  y: number;
  w: number;
  h: number;
}
export type Layer = LogoLayer | TextLayer | PhotoLayer | RectLayer | ScrimLayer | ArtifactLayer | GuideLayer;
export type Mockup = 'x' | 'linkedin' | 'substack' | 'luma';

export interface Scene {
  frame: { w: number; h: number };
  background: Background;
  layers: Layer[];
  mockup?: Mockup;
}

// ── defaults ────────────────────────────────────────────────────────────────
export const FIELD: FieldBg = {
  kind: 'field', animation: 'aurora', color: '#1E2BE6', edge: '#ED4BA0', bg: '#05071E',
  cell: 2, gap: 0, density: 0.65, fade: 'none', motion: 82, shape: 'square',
};
export const FIELD_IMAGE = { src: '', position: 'center' as Anchor, contrast: 1.25, edgeGlow: 1, tone: 0.8 };
export const PHOTO: PhotoBg = {
  kind: 'photo', src: '', position: 'center', color: '#1E2BE6', tint: true,
  cell: 10, rough: 0.3, seed: 4821, animate: true, artifacts: [{ at: 'left', solid: 0.2, reach: 0.5 }],
};
export const SOLID: SolidBg = { kind: 'solid', color: '#1E2BE6' };

let ids = 0;
export const newId = () => `l${Date.now().toString(36)}${(ids++).toString(36)}`;

// A new layer of each kind, as "add a layer" makes it.
export const LAYER_DEFAULTS: { [K in Layer['type']]: Omit<Extract<Layer, { type: K }>, 'id'> } = {
  logo: { type: 'logo', form: 'lockup', variant: 'white', anchor: 'center', scale: 0.3, dx: 0, dy: 0 },
  text: { type: 'text', text: 'Text', x: 0.5, y: 0.5, size: 0.06, font: 'sans', weight: 800, color: '#F4F5FF', align: 'center', upper: false, spacing: 0, pill: false, pillColor: '#F4F5FF' },
  photo: { type: 'photo', src: '', x: 0.3, y: 0.25, w: 0.4, h: 0.5, fit: 'cover', radius: 0.04, label: 'Photo' },
  rect: { type: 'rect', x: 0, y: 0.7, w: 1, h: 0.3, color: '#0B0E2A', opacity: 1, radius: 0 },
  scrim: { type: 'scrim', shape: 'bottom', color: '#05071E', opacity: 0.9 },
  artifact: { type: 'artifact', at: 'bottom-left', w: 0.3, h: 0.18, reach: 0.067, turn: -3, radius: 0, cell: 0.022, rough: 1.6, stray: 0.22, seed: 4821, color: '#1E2BE6' },
  guide: { type: 'guide', shape: 'rect', x: 0.5, y: 0.5, w: 0.6, h: 0.3 },
};
export const LAYER_NAMES: Record<Layer['type'], string> = {
  logo: 'Logo', text: 'Text', photo: 'Photo', rect: 'Box', scrim: 'Scrim', artifact: 'Artifact', guide: 'Guide',
};

// The colour around the artboard and behind an export.
export const bgColor = (b: Background) => (b.kind === 'field' ? b.bg : b.color);

// ── frames ──────────────────────────────────────────────────────────────────
export const FRAMES: { name: string; w: number; h: number }[] = [
  { name: '16:9', w: 1920, h: 1080 },
  { name: 'Square', w: 1080, h: 1080 },
  { name: 'Portrait 4:5', w: 1080, h: 1350 },
  { name: 'Story 9:16', w: 1080, h: 1920 },
  { name: 'Link preview', w: 1200, h: 630 },
  { name: 'YouTube banner', w: 2560, h: 1440 },
  { name: 'YouTube thumbnail', w: 1280, h: 720 },
  { name: 'X header', w: 1500, h: 500 },
  { name: 'LinkedIn cover', w: 1584, h: 264 },
  { name: 'Substack', w: 1344, h: 256 },
  { name: 'Luma calendar', w: 1400, h: 400 },
  { name: 'Luma cover', w: 1000, h: 1000 },
];

// The builder shows any frame about 960px on its long edge; cells are sized for that.
export const stageSize = (f: Scene['frame']) => {
  const k = 960 / (Math.max(f.w, f.h) || 1);
  return { w: Math.max(1, Math.round(f.w * k)), h: Math.max(1, Math.round(f.h * k)) };
};

// ── presets ─────────────────────────────────────────────────────────────────
const logo = (p: Partial<LogoLayer>): LogoLayer => ({ ...LAYER_DEFAULTS.logo, id: newId(), ...p });
const text = (p: Partial<TextLayer>): TextLayer => ({ ...LAYER_DEFAULTS.text, id: newId(), ...p });
const photo = (p: Partial<PhotoLayer>): PhotoLayer => ({ ...LAYER_DEFAULTS.photo, id: newId(), ...p });
const circle: Omit<GuideLayer, 'id'> = { type: 'guide', shape: 'circle', x: 0.5, y: 0.5, w: 1, h: 1 };
const mono = { font: 'mono' as const, weight: 600, upper: true };

const banner = (name: string, w: number, h: number, anchor: Anchor, mockup?: Mockup, extra: Layer[] = []): Preset => ({
  name, group: 'Banners',
  scene: { frame: { w, h }, mockup, layers: [logo({ anchor }), ...extra] },
});
const cover = (name: string, w: number, h: number, scale: number): Preset => ({
  name, group: 'Covers',
  scene: {
    frame: { w, h }, layers: [
      { ...LAYER_DEFAULTS.scrim, id: newId(), shape: 'vignette', opacity: 0.62 },
      logo({ scale, dy: -0.06 }),
      text({ ...mono, text: 'Lisbon', y: 0.66, size: 0.044, color: '#05071E', spacing: 0.14, pill: true }),
      text({ ...mono, text: 'Thu 24 Jun · 19:00', y: 0.908, size: 0.034, spacing: 0.12 }),
    ],
  },
});
// Square photos side by side, name and role under each, the logo and a date above.
// Layer order is part of the presets' contract with scripts: scrim, logo, date, then
// photo, name and role for each speaker.
const COL = 0.2813, GAP = 0.033;
const lineup = (n: number): Layer[] => {
  const left = (1 - n * COL - (n - 1) * GAP) / 2;
  return [
    { ...LAYER_DEFAULTS.scrim, id: newId(), shape: 'bottom', opacity: 0.9 },
    logo({ anchor: 'top-left', scale: COL, dx: left - 0.045 }),
    text({ text: 'Lisbon · 24 Jun', x: 1 - left, y: 0.13, size: 0.049, align: 'right', upper: true }),
    ...Array.from({ length: n }, (_, i) => left + i * (COL + GAP)).flatMap((x, i) => [
      photo({ x, y: 0.32, w: COL, h: 0.5, radius: 0.04, label: `Speaker ${i + 1}` }),
      text({ text: 'Speaker name', x, y: 0.863, size: 0.0425, align: 'left' }),
      text({ text: 'Role, company', x, y: 0.912, size: 0.036, weight: 500, align: 'left' }),
    ]),
  ];
};

// A preset sets the frame and the layers. The brand's leave the background alone, so a
// field or photo you have set up survives a change of format; a saved one brings its own.
export interface Preset {
  name: string;
  group: string;
  scene: Omit<Scene, 'background'> & { background?: Background };
}
export const PRESETS: Preset[] = [
  banner('YouTube banner', 2560, 1440, 'center', undefined, [{ type: 'guide', id: newId(), shape: 'rect', x: 0.5, y: 0.5, w: 0.604, h: 0.294 }]),
  banner('X header', 1500, 500, 'right', 'x'),
  banner('LinkedIn cover', 1584, 264, 'right', 'linkedin'),
  banner('Substack masthead', 1344, 256, 'right', 'substack'),
  { name: 'Substack wordmark', group: 'Banners', scene: { frame: { w: 1344, h: 256 }, layers: [logo({ form: 'line', scale: 0.8 })] } },
  banner('Luma calendar', 1400, 400, 'right', 'luma'),
  { name: 'Telegram photo', group: 'Banners', scene: { frame: { w: 512, h: 512 }, layers: [logo({ form: 'mark', scale: 0.42 }), { ...circle, id: newId() }] } },
  { name: 'Avatar', group: 'Banners', scene: { frame: { w: 1024, h: 1024 }, layers: [logo({ form: 'mark', scale: 0.42 }), { ...circle, id: newId() }] } },
  cover('Luma event cover', 1000, 1000, 0.7),
  cover('Title slide', 1920, 1080, 0.62),
  {
    // Layer order, for scripts: photo, box, date, name, role, logo.
    name: 'Speaker card', group: 'Speakers',
    scene: {
      frame: { w: 1080, h: 1350 },
      layers: [
        photo({ x: 0, y: 0, w: 1, h: 0.68, radius: 0, label: 'Photo' }),
        { ...LAYER_DEFAULTS.rect, id: newId(), y: 0.68, h: 0.32 },
        text({ ...mono, text: 'Lisbon · 24 Jun', x: 0.08, y: 0.745, size: 0.026, color: '#B5A6FF', align: 'left', spacing: 0.12 }),
        text({ text: 'Speaker name', x: 0.08, y: 0.815, size: 0.056, align: 'left' }),
        text({ text: 'Role, company', x: 0.08, y: 0.872, size: 0.032, weight: 500, align: 'left' }),
        logo({ form: 'mark', anchor: 'bottom-right', scale: 0.1, dx: -0.03, dy: -0.04 }),
      ],
    },
  },
  { name: 'Speaker pair', group: 'Speakers', scene: { frame: { w: 1920, h: 1080 }, layers: lineup(2) } },
  { name: 'Speaker trio', group: 'Speakers', scene: { frame: { w: 1920, h: 1080 }, layers: lineup(3) } },
  // Talk-video lower thirds: judge them against a frame of the talk as the photo background.
  {
    name: 'Lower third', group: 'Video',
    scene: {
      frame: { w: 1920, h: 1080 },
      layers: [
        { ...LAYER_DEFAULTS.artifact, id: newId() },
        text({ text: 'Speaker name', x: 0.0333, y: 0.885, size: 0.0593, align: 'left' }),
        text({ ...mono, text: 'Role, company', x: 0.0333, y: 0.94, size: 0.024, weight: 500, align: 'left', spacing: 0.12 }),
      ],
    },
  },
  {
    name: 'Coming up', group: 'Video',
    scene: {
      frame: { w: 1920, h: 1080 },
      layers: [
        { ...LAYER_DEFAULTS.artifact, id: newId(), at: 'bottom-right', w: 0.27, h: 0.15, turn: 3 },
        text({ text: 'Coming up…', x: 0.9667, y: 0.918, size: 0.0667, align: 'right' }),
      ],
    },
  },
  {
    name: 'Sponsor banner', group: 'Sponsors',
    scene: {
      frame: { w: 1584, h: 297 }, layers: [
        text({ ...mono, text: 'In partnership with', x: 0.045, y: 0.5, size: 0.1, align: 'left', spacing: 0.12 }),
        photo({ x: 0.42, y: 0.22, w: 0.24, h: 0.56, fit: 'contain', radius: 0, label: 'Logo' }),
        photo({ x: 0.7, y: 0.22, w: 0.24, h: 0.56, fit: 'contain', radius: 0, label: 'Logo' }),
      ],
    },
  },
  {
    name: 'Photo with artifacts', group: 'Photos',
    scene: { frame: { w: 1920, h: 1080 }, background: PHOTO, layers: [] },
  },
];

// A frame side in px: whole, and within what a canvas can hold.
export const side = (v: unknown, fallback: number) => Math.max(16, Math.min(8000, Math.round(Number(v)) || fallback));

// ── reading a scene from outside (a pasted JSON, the render page's input) ───
// Fills in whatever is missing, so a short scene written by hand or by a model works.
export function readScene(input: unknown): Scene {
  const s = (input ?? {}) as Partial<Scene>;
  const b = (s.background ?? {}) as Partial<Background>;
  const background: Background =
    b.kind === 'photo' ? { ...PHOTO, ...b }
    : b.kind === 'solid' ? { ...SOLID, ...b }
    : { ...FIELD, ...(b as Partial<FieldBg>), kind: 'field', image: (b as FieldBg).image && { ...FIELD_IMAGE, ...(b as FieldBg).image } };
  const seen = new Set<string>();
  const layers = (Array.isArray(s.layers) ? s.layers : [])
    .filter((l): l is Layer => !!l && Object.hasOwn(LAYER_DEFAULTS, l.type))
    .map((l) => {
      // every layer needs an id of its own: a copied layer arrives with its original's
      const id = l.id && !seen.has(l.id) ? l.id : newId();
      seen.add(id);
      return { ...LAYER_DEFAULTS[l.type], ...l, id } as Layer;
    });
  const frame = { w: side(s.frame?.w, 1920), h: side(s.frame?.h, 1080) };
  return { frame, background, layers, ...(s.mockup ? { mockup: s.mockup } : {}) };
}

// A scene as JSON to copy: photos that only exist in this browser get a stand-in path.
export const writeScene = (s: Scene) =>
  JSON.stringify(s, (k, v) => (k === 'src' && typeof v === 'string' && v.startsWith('blob:') ? '/your-image.jpg' : v), 2);
