import type { ReactNode } from 'react';
import BrandColorPicker, { BRAND_COLORS } from '../BrandColorPicker';
import { ANIMATIONS, type AnimName } from '@agnteng/brand/components/Animation.tsx';
import type { Artifact } from '@agnteng/brand/components/Artifacts.tsx';
import { Row, Slider, Seg } from './Controls';
import AlignPad from './AlignPad';
import ImageInput from './ImageInput';
import {
  FIELD, FIELD_IMAGE, PHOTO, SOLID, FRAMES, LAYER_DEFAULTS, LAYER_NAMES, layerLabel, newId,
  type Background, type FieldBg, type Layer, type Mockup, type PhotoBg, type Scene, type Fade, type Shape,
} from './scene';

// The builder's sidebar, one panel per part of a scene. Each takes the part it
// edits and a function that replaces it; none of them knows about the others.

const input = 'w-full min-w-0 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy focus:border-electric-blue focus:outline-none';
const chip = 'rounded-md border border-black/10 px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-deep-navy';
const wide = 'w-full rounded-md border border-black/10 py-2 font-mono text-[11px] uppercase tracking-wider text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-electric-blue';
const Check = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <label className="flex items-center gap-1.5 font-mono text-[11px] text-deep-navy/70">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-electric-blue" /> {label}
  </label>
);
const Range = ({ label, value, min, max, step = 0.01, unit = '', onChange }: { label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void }) => (
  <Row label={label} value={`${step >= 1 ? value : value.toFixed(2)}${unit}`}><Slider min={min} max={max} step={step} value={value} onChange={onChange} /></Row>
);
const Colour = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <Row label={label}><BrandColorPicker tone="light" value={value} onChange={onChange} /></Row>
);
// x, y, width and height of a box, as shares of the frame
const Box = ({ v, set }: { v: { x: number; y: number; w: number; h: number }; set: (p: Partial<{ x: number; y: number; w: number; h: number }>) => void }) => (
  <div className="grid grid-cols-2 gap-x-3 gap-y-3">
    <Range label="X" value={v.x} min={-0.2} max={1} onChange={(x) => set({ x })} />
    <Range label="Y" value={v.y} min={-0.2} max={1} onChange={(y) => set({ y })} />
    <Range label="Width" value={v.w} min={0.02} max={1.2} onChange={(w) => set({ w })} />
    <Range label="Height" value={v.h} min={0.02} max={1.2} onChange={(h) => set({ h })} />
  </div>
);

// ── frame ───────────────────────────────────────────────────────────────────
const MOCKUPS: ('none' | Mockup)[] = ['none', 'x', 'linkedin', 'substack', 'luma'];
export function FramePanel({ scene, set, mockup, setMockup, guides, setGuides }: {
  scene: Scene; set: (p: Partial<Scene>) => void;
  mockup: boolean; setMockup: (v: boolean) => void; guides: boolean; setGuides: (v: boolean) => void;
}) {
  const { w, h } = scene.frame;
  const size = (k: 'w' | 'h', v: string) => set({ frame: { ...scene.frame, [k]: Math.max(16, Math.min(8000, Math.round(Number(v) || 0))) } });
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {FRAMES.map((f) => (
          <button key={f.name} type="button" title={`${f.w}×${f.h}`} onClick={() => set({ frame: { w: f.w, h: f.h } })}
            className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors ${f.w === w && f.h === h ? 'border-electric-blue bg-electric-blue text-white' : 'border-black/10 text-deep-navy/70 hover:border-electric-blue hover:text-deep-navy'}`}>
            {f.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Row label="Width"><input type="number" value={w} onChange={(e) => size('w', e.target.value)} className={input} /></Row>
        <Row label="Height"><input type="number" value={h} onChange={(e) => size('h', e.target.value)} className={input} /></Row>
      </div>
      <Row label="Platform UI around it">
        <Seg options={MOCKUPS} value={scene.mockup ?? 'none'} onChange={(v) => set({ mockup: v === 'none' ? undefined : v })} />
      </Row>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {scene.mockup && <Check label="show platform UI" checked={mockup} onChange={setMockup} />}
        <Check label="guides and empty slots" checked={guides} onChange={setGuides} />
      </div>
    </>
  );
}

// ── background ──────────────────────────────────────────────────────────────
const KINDS: Background['kind'][] = ['field', 'photo', 'solid'];
const FADES: Fade[] = ['none', 'left', 'right', 'up', 'down', 'radial'];
const SHAPES: Shape[] = ['square', 'dot', 'halftone'];
const PALETTE = BRAND_COLORS.map((c) => c.hex);
const FIELD_LOOKS: { name: string; p: Partial<FieldBg> }[] = [
  { name: 'Wave', p: { animation: 'wave', color: '#1E2BE6', edge: '#3A4DFF', bg: '#05071E', cell: 10, gap: 1, density: 0.6, motion: 70 } },
  { name: 'Aurora', p: { animation: 'aurora', color: '#1E2BE6', edge: '#16D9A6', bg: '#05071E', cell: 9, gap: 1, density: 0.5, motion: 60 } },
  { name: 'Drift', p: { animation: 'drift', color: '#7C4DF5', edge: '#1FC6E6', bg: '#05071E', cell: 9, gap: 1, density: 0.5, motion: 45 } },
  { name: 'Rain', p: { animation: 'rain', color: '#1FC6E6', edge: '#B5A6FF', bg: '#05071E', cell: 8, gap: 1, density: 0.16, motion: 80 } },
  { name: 'Radar', p: { animation: 'radar', color: '#16D9A6', edge: '#B5A6FF', bg: '#05071E', cell: 9, gap: 1, density: 0.14, motion: 55 } },
  { name: 'Bloom', p: { animation: 'bloom', color: '#ED4BA0', edge: '#7C4DF5', bg: '#05071E', cell: 10, gap: 1, density: 0.42, motion: 55 } },
  { name: 'Swarm', p: { animation: 'swarm', color: '#1E2BE6', edge: '#1FC6E6', bg: '#05071E', cell: 9, gap: 1, density: 0.2, motion: 50 } },
  { name: 'Fine', p: { ...FIELD } },
];
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
    const color = b.kind === 'field' ? b.color : b.color;
    set(k === 'photo' ? { ...PHOTO, src, color } : k === 'solid' ? { ...SOLID, color } : { ...FIELD, color });
  };
  return (
    <>
      <Row label="Kind"><Seg options={KINDS} value={b.kind} onChange={kind} /></Row>
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
      <Row label="Looks">
        <div className="flex flex-wrap gap-1.5">
          {FIELD_LOOKS.map((l) => <button key={l.name} type="button" onClick={() => set(l.p)} className={chip}>{l.name}</button>)}
          <button type="button" onClick={() => set(randomField())} className="rounded-md border border-electric-blue/40 bg-electric-blue/10 px-2.5 py-1.5 font-mono text-[11px] text-electric-blue transition-colors hover:bg-electric-blue/15">random ⟳</button>
        </div>
      </Row>
      <Row label="Animation"><Seg options={ANIMATIONS} value={b.animation} onChange={(animation: AnimName) => set({ animation })} /></Row>
      <Row label="Shape"><Seg options={SHAPES} value={b.shape} onChange={(shape) => set({ shape })} /></Row>
      <Colour label="Base colour" value={b.color} onChange={(color) => set({ color })} />
      <Colour label="Edge colour" value={b.edge} onChange={(edge) => set({ edge })} />
      <Colour label="Behind the cells" value={b.bg} onChange={(bg) => set({ bg })} />
      <Range label="Cell size" value={b.cell} min={2} max={28} step={1} unit="px" onChange={(cell) => set({ cell })} />
      <Range label="Gap" value={b.gap} min={0} max={6} step={1} unit="px" onChange={(gap) => set({ gap })} />
      <Range label="Density" value={b.density} min={0} max={1} onChange={(density) => set({ density })} />
      <Range label="Motion" value={b.motion} min={0} max={100} step={1} onChange={(motion) => set({ motion })} />
      <Row label="Fade"><Seg options={FADES} value={b.fade} onChange={(fade) => set({ fade })} /></Row>
      <Row label="A photo, as a duotone of the field"><ImageInput value={img?.src ?? ''} onChange={(src) => set({ image: src ? { ...FIELD_IMAGE, ...img, src } : undefined })} /></Row>
      {img?.src && (
        <>
          <Row label="Photo position"><AlignPad value={img.position} onChange={(position) => setImg({ position })} /></Row>
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
      <Row label="Photo"><ImageInput value={b.src} onChange={(src) => set({ src })} /></Row>
      <Row label="Photo position"><AlignPad value={b.position} onChange={(position) => set({ position })} /></Row>
      <Colour label="Artifact colour" value={b.color} onChange={(color) => set({ color })} />
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Check label="tint the photo" checked={b.tint} onChange={(tint) => set({ tint })} />
        <Check label="animate the edge" checked={b.animate} onChange={(animate) => set({ animate })} />
      </div>
      <Range label="Cell size" value={b.cell} min={4} max={40} step={1} unit="px" onChange={(cell) => set({ cell })} />
      <Range label="Roughness" value={b.rough} min={0} max={0.8} step={0.02} onChange={(rough) => set({ rough })} />
      <Row label="Seed">
        <div className="flex gap-1.5">
          <input type="number" min={0} value={b.seed} onChange={(e) => set({ seed: Math.max(0, Math.round(Number(e.target.value) || 0)) })} className={input} />
          <button type="button" onClick={() => set({ seed: 1000 + rand(9000) })} className={`shrink-0 ${chip}`}>new seed ⟳</button>
        </div>
      </Row>
      {b.artifacts.map((a, i) => (
        <div key={i} className="space-y-3 rounded-md border border-black/10 p-3">
          <div className="flex items-start justify-between gap-3">
            <Row label={`Artifact ${i + 1}`}><AlignPad value={a.at} onChange={(at) => item(i, { at })} /></Row>
            <button type="button" onClick={() => set({ artifacts: b.artifacts.filter((_, j) => j !== i) })} className={`shrink-0 ${chip} hover:!border-coral hover:!text-coral`}>remove</button>
          </div>
          <Range label="Solid" value={a.solid} min={0} max={1} onChange={(solid) => item(i, { solid, reach: Math.max(a.reach, solid) })} />
          <Range label="Reach" value={a.reach} min={0} max={1.5} onChange={(reach) => item(i, { reach, solid: Math.min(a.solid, reach) })} />
        </div>
      ))}
      <button type="button" onClick={() => set({ artifacts: [...b.artifacts, { at: 'bottom-right', solid: 0.15, reach: 0.45 }] })} className={wide}>add an artifact</button>
    </>
  );
}

// ── layers ──────────────────────────────────────────────────────────────────
const TYPES = Object.keys(LAYER_DEFAULTS) as Layer['type'][];
const icon = 'grid h-6 w-6 shrink-0 place-items-center rounded font-mono text-[11px] text-deep-navy/50 transition-colors hover:bg-deep-navy/[0.06] hover:text-deep-navy disabled:opacity-25 disabled:hover:bg-transparent';

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
      {layers.length === 0 && <p className="font-mono text-[10px] leading-relaxed text-deep-navy/45">Nothing on top of the background yet. Add a logo, some text or a photo.</p>}
      {/* The list reads top to bottom as front to back, so it runs against the drawing order. */}
      <ul className="space-y-1">
        {layers.map((l, i) => (
          <li key={l.id} className={`flex items-center gap-1 rounded-md border px-1.5 py-1 ${l.id === selected ? 'border-electric-blue bg-electric-blue/[0.06]' : 'border-black/10'}`}>
            <button type="button" onClick={() => select(l.id === selected ? null : l.id)} className={`min-w-0 flex-1 truncate py-0.5 text-left font-mono text-[11px] ${l.hidden ? 'text-deep-navy/35 line-through' : 'text-deep-navy/80'}`}>
              <span className="text-deep-navy/40">{LAYER_NAMES[l.type]} </span>{l.type === 'text' || l.type === 'photo' ? layerLabel(l) : l.type === 'logo' ? l.form : ''}
            </button>
            <button type="button" aria-label={l.hidden ? 'Show' : 'Hide'} title={l.hidden ? 'Show' : 'Hide'} onClick={() => patch(l.id, { hidden: !l.hidden })} className={icon}>{l.hidden ? '○' : '●'}</button>
            <button type="button" aria-label="Bring forward" title="Bring forward" disabled={i === layers.length - 1} onClick={() => move(i, 1)} className={icon}>↓</button>
            <button type="button" aria-label="Send back" title="Send back" disabled={i === 0} onClick={() => move(i, -1)} className={icon}>↑</button>
            <button type="button" aria-label="Delete" title="Delete" onClick={() => { set(layers.filter((x) => x.id !== l.id)); if (selected === l.id) select(null); }} className={`${icon} hover:!text-coral`}>✕</button>
          </li>
        )).reverse()}
      </ul>
      <Row label="Add">
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => <button key={t} type="button" onClick={() => add(t)} className={chip}>+ {LAYER_NAMES[t].toLowerCase()}</button>)}
        </div>
      </Row>
      {cur && (
        <div className="space-y-4 rounded-md border border-electric-blue/40 p-3">
          <LayerEditor l={cur} set={(p) => patch(cur.id, p)} />
        </div>
      )}
    </>
  );
}

const FORMS = ['lockup', 'line', 'mark'] as const;
const VARIANTS = ['white', 'blue'] as const;
const FONTS = ['sans', 'mono'] as const;
const ALIGNS = ['left', 'center', 'right'] as const;
const WEIGHTS = ['500', '600', '800'] as const;
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
      <div className="grid grid-cols-2 gap-3">
        <Range label="Nudge X" value={l.dx} min={-0.5} max={0.5} onChange={(dx) => set({ dx })} />
        <Range label="Nudge Y" value={l.dy} min={-0.5} max={0.5} onChange={(dy) => set({ dy })} />
      </div>
    </>
  );
  if (l.type === 'text') return (
    <>
      <Row label="Text"><input type="text" value={l.text} onChange={(e) => set({ text: e.target.value })} className={input} /></Row>
      <Row label="Typeface"><Seg options={FONTS} value={l.font} onChange={(font) => set({ font })} /></Row>
      <Row label="Weight"><Seg options={WEIGHTS} value={String(l.weight) as (typeof WEIGHTS)[number]} onChange={(w) => set({ weight: Number(w) })} /></Row>
      <Range label="Size" value={l.size} min={0.01} max={0.4} step={0.002} onChange={(size) => set({ size })} />
      <Colour label="Colour" value={l.color} onChange={(color) => set({ color })} />
      <Row label="Align"><Seg options={ALIGNS} value={l.align} onChange={(align) => set({ align })} /></Row>
      <div className="grid grid-cols-2 gap-3">
        <Range label="X" value={l.x} min={0} max={1} step={0.005} onChange={(x) => set({ x })} />
        <Range label="Y" value={l.y} min={0} max={1} step={0.005} onChange={(y) => set({ y })} />
      </div>
      <Range label="Letter spacing" value={l.spacing} min={-0.05} max={0.4} onChange={(spacing) => set({ spacing })} />
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Check label="capitals" checked={l.upper} onChange={(upper) => set({ upper })} />
        <Check label="in a pill" checked={l.pill} onChange={(pill) => set({ pill })} />
      </div>
      {l.pill && <Colour label="Pill colour" value={l.pillColor} onChange={(pillColor) => set({ pillColor })} />}
    </>
  );
  if (l.type === 'photo') return (
    <>
      <Row label="Picture"><ImageInput value={l.src} onChange={(src) => set({ src })} /></Row>
      <Row label="Name of the slot"><input type="text" value={l.label} onChange={(e) => set({ label: e.target.value })} className={input} /></Row>
      <Row label="Fit"><Seg options={FITS} value={l.fit} onChange={(fit) => set({ fit })} /></Row>
      <Box v={l} set={set} />
      <Range label="Corner radius" value={l.radius} min={0} max={0.5} onChange={(radius) => set({ radius })} />
    </>
  );
  if (l.type === 'rect') return (
    <>
      <Colour label="Colour" value={l.color} onChange={(color) => set({ color })} />
      <Range label="Opacity" value={l.opacity} min={0} max={1} onChange={(opacity) => set({ opacity })} />
      <Box v={l} set={set} />
      <Range label="Corner radius" value={l.radius} min={0} max={0.5} onChange={(radius) => set({ radius })} />
    </>
  );
  if (l.type === 'scrim') return (
    <>
      <Row label="Dark toward"><Seg options={SCRIMS} value={l.shape} onChange={(shape) => set({ shape })} /></Row>
      <Colour label="Colour" value={l.color} onChange={(color) => set({ color })} />
      <Range label="Strength" value={l.opacity} min={0} max={1} onChange={(opacity) => set({ opacity })} />
    </>
  );
  return (
    <>
      <Row label="Shape"><Seg options={GUIDES} value={l.shape} onChange={(shape) => set({ shape })} /></Row>
      <Box v={l} set={set} />
      <p className="font-mono text-[10px] leading-relaxed text-deep-navy/45">A guide marks where a platform crops. It is never exported.</p>
    </>
  );
}
