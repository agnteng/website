import type { ReactNode } from 'react';
import { BRAND_COLORS } from '../BrandColorPicker';
import { ANIMATIONS } from '@agnteng/brand/components/Animation.tsx';
import type { Artifact } from '@agnteng/brand/components/Artifacts.tsx';
import { Check, Colour, Num, Range, Row, Seg, Select, btn, field, iconBtn, note } from './Controls';
import AlignPad from './AlignPad';
import ImageInput from './ImageInput';
import {
  FIELD, FIELD_IMAGE, PHOTO, SOLID, FRAMES, LAYER_DEFAULTS, LAYER_NAMES, newId,
  type Background, type FieldBg, type Layer, type Mockup, type PhotoBg, type Scene, type Fade, type Shape,
} from './scene';

// The builder's sidebar, one panel per part of a scene. Each takes the part it
// edits and a function that replaces it; none of them knows about the others.

// A thin rule between groups of controls inside one panel.
const Rule = () => <div className="!my-2.5 h-px bg-line" />;
// Two numbers on one line: X and Y, or width and height.
const Pair = ({ label, a, b }: { label: string; a: ReactNode; b: ReactNode }) => (
  <Row label={label}><div className="grid grid-cols-2 gap-1.5">{a}{b}</div></Row>
);
// A number with a one-letter tag inside its field.
const Tagged = ({ tag, ...p }: { tag: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) => (
  <label className="relative block">
    <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-deep-navy/40">{tag}</span>
    <Num {...p} className="!pl-5" />
  </label>
);
type XYWH = { x: number; y: number; w: number; h: number };
const Box = ({ v, set }: { v: XYWH; set: (p: Partial<XYWH>) => void }) => (
  <>
    <Pair label="Position" a={<Tagged tag="X" value={v.x} step={0.01} onChange={(x) => set({ x })} />} b={<Tagged tag="Y" value={v.y} step={0.01} onChange={(y) => set({ y })} />} />
    <Pair label="Size" a={<Tagged tag="W" value={v.w} min={0.01} step={0.01} onChange={(w) => set({ w })} />} b={<Tagged tag="H" value={v.h} min={0.01} step={0.01} onChange={(h) => set({ h })} />} />
  </>
);

// ── frame ───────────────────────────────────────────────────────────────────
const MOCKUPS: { value: 'none' | Mockup; label: string }[] = [
  { value: 'none', label: 'None' }, { value: 'x', label: 'X' }, { value: 'linkedin', label: 'LinkedIn' }, { value: 'substack', label: 'Substack' }, { value: 'luma', label: 'Luma' },
];
export function FramePanel({ scene, set, mockup, setMockup, guides, setGuides }: {
  scene: Scene; set: (p: Partial<Scene>) => void;
  mockup: boolean; setMockup: (v: boolean) => void; guides: boolean; setGuides: (v: boolean) => void;
}) {
  const { w, h } = scene.frame;
  const named = FRAMES.find((f) => f.w === w && f.h === h)?.name ?? 'Custom';
  return (
    <>
      <Row label="Size">
        <Select
          label="Frame size" value={named}
          options={[...FRAMES.map((f) => ({ value: f.name, label: `${f.name}  ${f.w} × ${f.h}` })), ...(named === 'Custom' ? [{ value: 'Custom', label: 'Custom' }] : [])]}
          onChange={(n) => { const f = FRAMES.find((x) => x.name === n); if (f) set({ frame: { w: f.w, h: f.h } }); }}
        />
      </Row>
      <Pair label="Pixels" a={<Tagged tag="W" value={w} min={16} max={8000} onChange={(v) => set({ frame: { w: v, h } })} />} b={<Tagged tag="H" value={h} min={16} max={8000} onChange={(v) => set({ frame: { w, h: v } })} />} />
      <Row label="Platform UI"><Select<'none' | Mockup> label="Platform UI" options={MOCKUPS} value={scene.mockup ?? 'none'} onChange={(v) => set({ mockup: v === 'none' ? undefined : v })} /></Row>
      <div className="flex flex-wrap gap-x-4">
        {scene.mockup && <Check label="Show platform UI" checked={mockup} onChange={setMockup} />}
        <Check label="Guides and empty slots" checked={guides} onChange={setGuides} />
      </div>
    </>
  );
}

// ── background ──────────────────────────────────────────────────────────────
const KINDS: Background['kind'][] = ['field', 'photo', 'solid'];
const FADES: Fade[] = ['none', 'left', 'right', 'up', 'down', 'radial'];
const SHAPES: Shape[] = ['square', 'dot', 'halftone'];
const PALETTE = BRAND_COLORS.map((c) => c.hex);
const FIELD_LOOKS: Record<string, Partial<FieldBg>> = {
  Fine: { ...FIELD },
  Wave: { animation: 'wave', color: '#1E2BE6', edge: '#3A4DFF', bg: '#05071E', cell: 10, gap: 1, density: 0.6, motion: 70 },
  Aurora: { animation: 'aurora', color: '#1E2BE6', edge: '#16D9A6', bg: '#05071E', cell: 9, gap: 1, density: 0.5, motion: 60 },
  Drift: { animation: 'drift', color: '#7C4DF5', edge: '#1FC6E6', bg: '#05071E', cell: 9, gap: 1, density: 0.5, motion: 45 },
  Rain: { animation: 'rain', color: '#1FC6E6', edge: '#B5A6FF', bg: '#05071E', cell: 8, gap: 1, density: 0.16, motion: 80 },
  Radar: { animation: 'radar', color: '#16D9A6', edge: '#B5A6FF', bg: '#05071E', cell: 9, gap: 1, density: 0.14, motion: 55 },
  Bloom: { animation: 'bloom', color: '#ED4BA0', edge: '#7C4DF5', bg: '#05071E', cell: 10, gap: 1, density: 0.42, motion: 55 },
  Swarm: { animation: 'swarm', color: '#1E2BE6', edge: '#1FC6E6', bg: '#05071E', cell: 9, gap: 1, density: 0.2, motion: 50 },
};
const rand = (n: number) => Math.floor(Math.random() * n);
const randomField = (): Partial<FieldBg> => ({
  animation: ANIMATIONS[rand(ANIMATIONS.length)], color: PALETTE[rand(5)], edge: PALETTE[rand(PALETTE.length)],
  cell: 6 + rand(14), gap: rand(3), density: Number((0.35 + Math.random() * 0.4).toFixed(2)), fade: FADES[rand(FADES.length)], motion: rand(100),
});

export function BackgroundPanel({ b, set }: { b: Background; set: (b: Background) => void }) {
  // Changing kind keeps what carries over: the photo, and the colour.
  const kind = (k: Background['kind']) => {
    if (k === b.kind) return;
    const src = b.kind === 'photo' ? b.src : b.kind === 'field' ? b.image?.src ?? '' : '';
    const { color } = b;
    set(k === 'photo' ? { ...PHOTO, src, color } : k === 'solid' ? { ...SOLID, color } : { ...FIELD, color, image: src ? { ...FIELD_IMAGE, src } : undefined });
  };
  return (
    <>
      <Seg options={KINDS} value={b.kind} onChange={kind} />
      {b.kind === 'field' && <Field b={b} set={(p) => set({ ...b, ...p })} />}
      {b.kind === 'photo' && <Photo b={b} set={(p) => set({ ...b, ...p })} />}
      {b.kind === 'solid' && <Colour label="Colour" value={b.color} onChange={(color) => set({ ...b, color })} />}
    </>
  );
}

function Field({ b, set }: { b: FieldBg; set: (p: Partial<FieldBg>) => void }) {
  const img = b.image;
  const setImg = (p: Partial<NonNullable<FieldBg['image']>>) => set({ image: { ...FIELD_IMAGE, ...img, ...p } });
  return (
    <>
      <Row label="Look">
        <div className="flex gap-1.5">
          <select value="" onChange={(e) => set(FIELD_LOOKS[e.target.value])} aria-label="Apply a look" className={`${field} cursor-pointer`}>
            <option value="" disabled>Apply a look…</option>
            {Object.keys(FIELD_LOOKS).map((n) => <option key={n}>{n}</option>)}
          </select>
          <button type="button" onClick={() => set(randomField())} className={btn}>Random</button>
        </div>
      </Row>
      <Row label="Animation"><Select label="Animation" options={ANIMATIONS} value={b.animation} onChange={(animation) => set({ animation })} /></Row>
      <Row label="Cells"><Seg options={SHAPES} value={b.shape} onChange={(shape) => set({ shape })} /></Row>
      <Colour label="Colour" value={b.color} onChange={(color) => set({ color })} />
      <Colour label="Edge" value={b.edge} onChange={(edge) => set({ edge })} />
      <Colour label="Behind" value={b.bg} onChange={(bg) => set({ bg })} />
      <Rule />
      <Range label="Cell size" value={b.cell} min={2} max={28} step={1} onChange={(cell) => set({ cell })} />
      <Range label="Gap" value={b.gap} min={0} max={6} step={1} onChange={(gap) => set({ gap })} />
      <Range label="Density" value={b.density} min={0} max={1} onChange={(density) => set({ density })} />
      <Range label="Motion" value={b.motion} min={0} max={100} step={1} onChange={(motion) => set({ motion })} />
      <Row label="Fade"><Select label="Fade" options={FADES} value={b.fade} onChange={(fade) => set({ fade })} /></Row>
      <Rule />
      <Row label="Photo as a duotone" stack><ImageInput value={img?.src ?? ''} onChange={(src) => set({ image: src ? { ...FIELD_IMAGE, ...img, src } : undefined })} /></Row>
      {img?.src && (
        <>
          <Row label="Crop"><AlignPad value={img.position} onChange={(position) => setImg({ position })} /></Row>
          <Range label="Contrast" value={img.contrast} min={0.6} max={2.4} step={0.05} onChange={(contrast) => setImg({ contrast })} />
          <Range label="Edge glow" value={img.edgeGlow} min={0} max={2.5} step={0.05} onChange={(edgeGlow) => setImg({ edgeGlow })} />
          <Range label="Tone" value={img.tone} min={0} max={1} step={0.05} onChange={(tone) => setImg({ tone })} />
        </>
      )}
    </>
  );
}

function Photo({ b, set }: { b: PhotoBg; set: (p: Partial<PhotoBg>) => void }) {
  const item = (i: number, p: Partial<Artifact>) => set({ artifacts: b.artifacts.map((a, j) => (j === i ? { ...a, ...p } : a)) });
  return (
    <>
      <ImageInput value={b.src} onChange={(src) => set({ src })} />
      <Row label="Crop"><AlignPad value={b.position} onChange={(position) => set({ position })} /></Row>
      <Rule />
      <Colour label="Artifacts" value={b.color} onChange={(color) => set({ color })} />
      <div className="flex flex-wrap gap-x-4">
        <Check label="Tint the photo" checked={b.tint} onChange={(tint) => set({ tint })} />
        <Check label="Animate the edge" checked={b.animate} onChange={(animate) => set({ animate })} />
      </div>
      <Range label="Cell size" value={b.cell} min={4} max={40} step={1} onChange={(cell) => set({ cell })} />
      <Range label="Roughness" value={b.rough} min={0} max={0.8} step={0.02} onChange={(rough) => set({ rough })} />
      <Row label="Seed">
        <div className="flex gap-1.5">
          <Num value={b.seed} min={0} onChange={(seed) => set({ seed })} />
          <button type="button" onClick={() => set({ seed: 1000 + rand(9000) })} className={btn}>New</button>
        </div>
      </Row>
      {b.artifacts.map((a, i) => (
        <div key={i} className="space-y-2 rounded-[6px] bg-deep-navy/[0.03] p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-deep-navy/75">Artifact {i + 1}</span>
            <button type="button" aria-label={`Remove artifact ${i + 1}`} title="Remove" onClick={() => set({ artifacts: b.artifacts.filter((_, j) => j !== i) })} className={`${iconBtn} hover:!text-coral`}>✕</button>
          </div>
          <Row label="Grows from"><AlignPad value={a.at} onChange={(at) => item(i, { at })} /></Row>
          <Range label="Solid" value={a.solid} min={0} max={1} onChange={(solid) => item(i, { solid, reach: Math.max(a.reach, solid) })} />
          <Range label="Reach" value={a.reach} min={0} max={1.5} onChange={(reach) => item(i, { reach, solid: Math.min(a.solid, reach) })} />
        </div>
      ))}
      <button type="button" onClick={() => set({ artifacts: [...b.artifacts, { at: 'bottom-right', solid: 0.15, reach: 0.45 }] })} className={`${btn} w-full`}>Add an artifact</button>
    </>
  );
}

// ── layers ──────────────────────────────────────────────────────────────────
const TYPES = Object.keys(LAYER_DEFAULTS) as Layer['type'][];

export function LayersPanel({ layers, set, selected, select }: { layers: Layer[]; set: (l: Layer[]) => void; selected: string | null; select: (id: string | null) => void }) {
  const patch = (id: string, p: Partial<Layer>) => set(layers.map((l) => (l.id === id ? ({ ...l, ...p } as Layer) : l)));
  const move = (i: number, d: number) => {
    const next = [...layers];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set(next);
  };
  const add = (type: Layer['type']) => {
    const l = { ...LAYER_DEFAULTS[type], id: newId() } as Layer;
    set([...layers, l]);
    select(l.id);
  };
  const cur = layers.find((l) => l.id === selected);
  return (
    <>
      {layers.length === 0 && <p className={note}>Nothing on top of the background yet.</p>}
      {/* The list reads top to bottom as front to back, so it runs against the drawing order. */}
      <ul className="-mx-1">
        {layers.map((l, i) => (
          <li key={l.id} className={`group flex h-7 items-center rounded-[5px] pl-2 pr-0.5 ${l.id === selected ? 'bg-electric-blue/10' : 'hover:bg-deep-navy/[0.04]'}`}>
            <button type="button" onClick={() => select(l.id === selected ? null : l.id)} aria-pressed={l.id === selected} className={`flex h-full min-w-0 flex-1 items-center gap-1.5 text-left text-[11px] ${l.hidden ? 'text-deep-navy/35' : 'text-deep-navy'}`}>
              <span className="shrink-0 text-deep-navy/45">{LAYER_NAMES[l.type]}</span>
              <span className="truncate">{l.type === 'text' ? l.text : l.type === 'photo' ? l.label : l.type === 'logo' ? l.form : ''}</span>
            </button>
            <span className={`flex ${l.id === selected ? '' : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100'}`}>
              <button type="button" aria-label="Bring forward" title="Bring forward" disabled={i === layers.length - 1} onClick={() => move(i, 1)} className={iconBtn}>↑</button>
              <button type="button" aria-label="Send back" title="Send back" disabled={i === 0} onClick={() => move(i, -1)} className={iconBtn}>↓</button>
              <button type="button" aria-label="Delete" title="Delete" onClick={() => { set(layers.filter((x) => x.id !== l.id)); if (selected === l.id) select(null); }} className={`${iconBtn} hover:!text-coral`}>✕</button>
            </span>
            <button type="button" aria-label={l.hidden ? 'Show' : 'Hide'} title={l.hidden ? 'Show' : 'Hide'} onClick={() => patch(l.id, { hidden: !l.hidden })} className={iconBtn}>
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" fill="none" stroke="currentColor" strokeWidth="1.2" /><circle cx="8" cy="8" r="1.8" fill={l.hidden ? 'none' : 'currentColor'} stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
          </li>
        )).reverse()}
      </ul>
      <select value="" onChange={(e) => add(e.target.value as Layer['type'])} aria-label="Add a layer" className={`${field} cursor-pointer`}>
        <option value="" disabled>Add a layer…</option>
        {TYPES.map((t) => <option key={t} value={t}>{LAYER_NAMES[t]}</option>)}
      </select>
      {cur && (
        <>
          <Rule />
          <LayerEditor l={cur} set={(p) => patch(cur.id, p)} />
        </>
      )}
    </>
  );
}

const FORMS = ['lockup', 'line', 'mark'] as const;
const VARIANTS = ['white', 'blue'] as const;
const FONTS = [{ value: 'sans', label: 'Manrope' }, { value: 'mono', label: 'Kode Mono' }] as const;
const ALIGNS = ['left', 'center', 'right'] as const;
const WEIGHTS = [{ value: '500', label: 'Medium' }, { value: '600', label: 'Semibold' }, { value: '800', label: 'Extrabold' }] as const;
const FITS = ['cover', 'contain'] as const;
const SCRIMS = ['bottom', 'left', 'right', 'vignette'] as const;
const GUIDES = ['rect', 'circle'] as const;

function LayerEditor({ l, set }: { l: Layer; set: (p: Partial<Layer>) => void }): ReactNode {
  if (l.type === 'logo') return (
    <>
      <Row label="Logo"><Seg options={FORMS} value={l.form} onChange={(form) => set({ form })} /></Row>
      <Row label="Colour"><Seg options={VARIANTS} value={l.variant} onChange={(variant) => set({ variant })} /></Row>
      <Row label="Placement"><AlignPad value={l.anchor} onChange={(anchor) => set({ anchor, dx: 0, dy: 0 })} /></Row>
      <Range label="Size" value={l.scale} min={0.05} max={1} onChange={(scale) => set({ scale })} />
      <Pair label="Nudge" a={<Tagged tag="X" value={l.dx} step={0.01} onChange={(dx) => set({ dx })} />} b={<Tagged tag="Y" value={l.dy} step={0.01} onChange={(dy) => set({ dy })} />} />
    </>
  );
  if (l.type === 'text') return (
    <>
      <input type="text" value={l.text} onChange={(e) => set({ text: e.target.value })} aria-label="Text" placeholder="Text" className={field} />
      <Row label="Typeface">
        <div className="grid grid-cols-2 gap-1.5">
          <Select<'sans' | 'mono'> label="Typeface" options={FONTS} value={l.font} onChange={(font) => set({ font })} />
          <Select<string> label="Weight" options={WEIGHTS} value={String(l.weight)} onChange={(w) => set({ weight: Number(w) })} />
        </div>
      </Row>
      <Range label="Size" value={l.size} min={0.01} max={0.4} step={0.002} onChange={(size) => set({ size })} />
      <Colour label="Colour" value={l.color} onChange={(color) => set({ color })} />
      <Row label="Align"><Seg options={ALIGNS} value={l.align} onChange={(align) => set({ align })} /></Row>
      <Pair label="Position" a={<Tagged tag="X" value={l.x} step={0.005} onChange={(x) => set({ x })} />} b={<Tagged tag="Y" value={l.y} step={0.005} onChange={(y) => set({ y })} />} />
      <Range label="Spacing" value={l.spacing} min={-0.05} max={0.4} onChange={(spacing) => set({ spacing })} />
      <div className="flex flex-wrap gap-x-4">
        <Check label="Capitals" checked={l.upper} onChange={(upper) => set({ upper })} />
        <Check label="In a pill" checked={l.pill} onChange={(pill) => set({ pill })} />
      </div>
      {l.pill && <Colour label="Pill" value={l.pillColor} onChange={(pillColor) => set({ pillColor })} />}
    </>
  );
  if (l.type === 'photo') return (
    <>
      <ImageInput value={l.src} onChange={(src) => set({ src })} />
      <Row label="Slot name"><input type="text" value={l.label} onChange={(e) => set({ label: e.target.value })} className={field} /></Row>
      <Row label="Fit"><Seg options={FITS} value={l.fit} onChange={(fit) => set({ fit })} /></Row>
      <Box v={l} set={set} />
      <Range label="Radius" value={l.radius} min={0} max={0.5} onChange={(radius) => set({ radius })} />
    </>
  );
  if (l.type === 'rect') return (
    <>
      <Colour label="Colour" value={l.color} onChange={(color) => set({ color })} />
      <Range label="Opacity" value={l.opacity} min={0} max={1} onChange={(opacity) => set({ opacity })} />
      <Box v={l} set={set} />
      <Range label="Radius" value={l.radius} min={0} max={0.5} onChange={(radius) => set({ radius })} />
    </>
  );
  if (l.type === 'scrim') return (
    <>
      <Row label="Dark toward"><Select label="Dark toward" options={SCRIMS} value={l.shape} onChange={(shape) => set({ shape })} /></Row>
      <Colour label="Colour" value={l.color} onChange={(color) => set({ color })} />
      <Range label="Strength" value={l.opacity} min={0} max={1} onChange={(opacity) => set({ opacity })} />
    </>
  );
  return (
    <>
      <Row label="Shape"><Seg options={GUIDES} value={l.shape} onChange={(shape) => set({ shape })} /></Row>
      <Box v={l} set={set} />
      <p className={note}>A guide marks where a platform crops. It is never exported.</p>
    </>
  );
}
