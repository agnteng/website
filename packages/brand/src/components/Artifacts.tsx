import { useEffect, useRef, useState } from 'react';
import { anchorFactors, type Anchor } from './anchor';

// Artifacts: square cells in one colour that cover part of a frame and break up
// along a ragged edge, so whatever is under them (a photo, usually) dissolves
// into that colour. The brand's way to pixelate a photo without dithering it.
//
//   <Artifacts src="/photo.jpg" tint color="#1E2BE6" cell={10} seed={4821} animate
//     artifacts={[{ at: 'left', solid: 0.2, reach: 0.5 }]} />
//
// The canvas fills its parent. With `src` it draws the photo too (cover-cropped,
// and recoloured into `color` when `tint` is set; `tint={0.5}` goes half way).
// `edge` is a second colour that a few of the ragged cells take. Without `src` the canvas is
// transparent and only draws the cells: lay it over images of your own.
//
// `wave` makes an artifact's edge swell in and out; still drawn in whole cells, so no curve shows.
//
// The seed fixes the pattern for a given frame size and cell size: cells sit on
// a grid, so a frame of another size draws another pattern from the same seed.

export interface Artifact {
  at: Anchor; // the edge, corner or centre it grows from
  solid: number; // how far from there the cells are whole (0–1 of the frame)
  reach: number; // how far the last cells get before the artifact is gone
  wave?: number; // how far its edge swells in and out, in the units of `solid` (0 = straight)
  waveLength?: number; // one swell and dip, as a share of the frame along the edge
  waveShift?: number; // where along the edge the swells fall, as a share of a wave length
}

interface Props {
  artifacts: Artifact[];
  color?: string;
  seed?: number;
  cell?: number; // cell size in px
  pixelRatio?: number; // canvas pixels per layout pixel; the screen's (up to 2) unless given
  rough?: number; // how ragged the edge is (0 = a straight fade)
  animate?: boolean; // a few cells along the edge blink in and out, slowly
  paused?: boolean; // hold the animation on its current frame
  src?: string;
  position?: Anchor; // the photo's cover crop
  edge?: string; // a second colour: a few of the ragged cells take it, more of them further out
  tint?: boolean | number; // recolour the photo: shadows navy, mid-tones `color`, highlights near white. A number (0–1) is how strongly
  onStatus?: (s: 'ok' | 'cors' | 'error') => void;
  style?: React.CSSProperties;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>; // expose the canvas for export
}

// A fixed pseudo-random value in [0, 1) for a cell and a seed. The builder's artifact
// layer uses it too, so a seed draws the same pattern in both.
export function rnd(a: number, b: number, s: number) {
  let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(s, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);

// How far a point of the frame is from an artifact's anchor: 0 on it, 1 at the
// far edge (the opposite corner of a corner anchor is 2).
function distance(at: Anchor, fx: number, fy: number) {
  const a = anchorFactors(at);
  const dx = a.fx === 0.5 ? null : Math.abs(fx - a.fx);
  const dy = a.fy === 0.5 ? null : Math.abs(fy - a.fy);
  if (dx === null && dy === null) return Math.hypot(fx - 0.5, fy - 0.5) * 2;
  return (dx ?? 0) + (dy ?? 0);
}

// How far an artifact's edge swells out at a point of the frame: a sine along the edge.
// A corner's edge is the frame's diagonal, measured as a share of it. Around a centre
// anchor the edge closes on itself, so it takes a whole number of waves.
function swell(a: Artifact, fx: number, fy: number) {
  if (!a.wave) return 0;
  const f = anchorFactors(a.at), round = f.fx === 0.5 && f.fy === 0.5;
  const along = round ? Math.atan2(fy - 0.5, fx - 0.5) / (2 * Math.PI)
    : f.fx === 0.5 ? fx
    : f.fy === 0.5 ? fy
    : (Math.abs(fx - f.fx) - Math.abs(fy - f.fy)) / 2;
  const waves = 1 / Math.max(0.02, a.waveLength ?? 0.5);
  return a.wave * Math.sin(2 * Math.PI * (along * (round ? Math.max(1, Math.round(waves)) : waves) + (a.waveShift ?? 0)));
}

export default function Artifacts({
  artifacts,
  color = '#1E2BE6',
  seed = 1,
  cell = 10,
  pixelRatio,
  rough = 0.3,
  animate = false,
  paused = false,
  src = '',
  position = 'center',
  tint = false,
  edge = '',
  onStatus,
  style,
  canvasRef,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  useEffect(() => {
    if (canvasRef) canvasRef.current = ref.current;
  }, [canvasRef]);

  // The photo is loaded once per `src` and kept while other props change.
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    setImg(null);
    if (!src) return;
    let live = true;
    const load = (cors: boolean) => {
      const im = new Image();
      if (cors) im.crossOrigin = 'anonymous';
      im.onload = () => live && setImg(im);
      // A site that sends no CORS headers refuses the first request. Without them
      // its photo can still be shown, only not recoloured or exported.
      im.onerror = () => live && (cors ? load(false) : statusRef.current?.('error'));
      im.src = src;
    };
    load(!/^(blob|data):/.test(src));
    return () => { live = false; };
  }, [src]);

  // One string for the effect's dependencies: the list is rebuilt on every render.
  const shape = JSON.stringify(artifacts);
  const clock = useRef(0); // kept when a prop changes, so a paused frame stays the frame it was

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const list: Artifact[] = JSON.parse(shape);
    const still = !animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const c = Math.max(2, cell);
    let w = 0, h = 0, dpr = 1, cols = 0, rows = 0;
    let cover: Float32Array = new Float32Array(0); // each cell's share of an artifact, 0–1

    // The photo, cropped and tinted once per size, then stamped under the cells.
    const photo = document.createElement('canvas');
    let hasPhoto = false;
    const paintPhoto = () => {
      hasPhoto = false;
      if (!img || canvas.width < 1 || canvas.height < 1) return;
      photo.width = canvas.width;
      photo.height = canvas.height;
      const pctx = photo.getContext('2d', { willReadFrequently: true })!;
      const s = Math.max(photo.width / img.naturalWidth, photo.height / img.naturalHeight);
      const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
      const { fx, fy } = anchorFactors(position);
      pctx.drawImage(img, (photo.width - dw) * fx, (photo.height - dh) * fy, dw, dh);
      hasPhoto = true;
      try {
        // Reading the pixels is also the test for a photo the browser won't let out.
        const px = pctx.getImageData(0, 0, photo.width, photo.height);
        const amount = tint === true ? 1 : Math.max(0, Math.min(1, Number(tint) || 0));
        if (amount > 0) {
          const c2 = rgb(color);
          const dark = mix(rgb('#05071E'), c2, 0.08), light = mix(rgb('#F4F5FF'), c2, 0.04);
          for (let i = 0; i < px.data.length; i += 4) {
            const l = (0.2126 * px.data[i] + 0.7152 * px.data[i + 1] + 0.0722 * px.data[i + 2]) / 255;
            const [from, to, t] = l < 0.5 ? [dark, c2, l * 2] : [c2, light, l * 2 - 1];
            for (let ch = 0; ch < 3; ch++) {
              const toned = from[ch] + (to[ch] - from[ch]) * t;
              px.data[i + ch] += (toned - px.data[i + ch]) * amount; // part way from the photo's own colour
            }
          }
          pctx.putImageData(px, 0, 0);
        }
        statusRef.current?.('ok');
      } catch {
        statusRef.current?.('cors');
      }
    };

    const layout = () => {
      // The layout size, not the on-screen one: a zoomed or scaled parent keeps its cells.
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      dpr = pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // Enough cells to overhang the frame, centred: its edges are always inside the grid.
      cols = Math.ceil(w / c);
      rows = Math.ceil(h / c);
      cover = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const fx = (i + 0.5) / cols, fy = (j + 0.5) / rows;
          // Each 4×4 block shifts the edge, which is what makes it ragged.
          const shift = (rnd(i >> 2, j >> 2, seed + 101) - 0.5) * rough;
          let k = 0;
          for (const a of list) {
            const reach = Math.max(a.solid + 0.01, a.reach);
            const d = distance(a.at, fx, fy) - swell(a, fx, fy);
            k = Math.max(k, d <= a.solid ? 1 : clamp((reach - d - shift) / (reach - a.solid), 0, 1));
          }
          cover[j * cols + i] = k;
        }
      }
      paintPhoto();
    };

    const draw = (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (hasPhoto) ctx.drawImage(photo, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = color;
      const offx = Math.floor((w - cols * c) / 2), offy = Math.floor((h - rows * c) / 2);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = cover[j * cols + i];
          if (k <= 0) continue;
          if (k < 1) {
            // A cell survives with the edge's probability; animated, that probability
            // drifts a little, each cell at its own pace.
            let p = k * k * (3 - 2 * k);
            if (!still) p += 0.16 * Math.sin(t * (0.5 + rnd(i, j, seed + 3) * 1.2) + 6.283 * rnd(i, j, seed + 5));
            if (rnd(i, j, seed) >= p) continue;
          }
          // Only ragged cells take the second colour, and few of them: an accent, not a second field.
          ctx.fillStyle = edge && k < 1 && rnd(i, j, seed + 7) < 0.04 + 0.18 * (1 - k) ? edge : color;
          ctx.globalAlpha = 0.3 + 0.7 * k;
          ctx.fillRect(offx + i * c, offy + j * c, c, c);
        }
      }
      ctx.globalAlpha = 1;
      // First real frame; CSS (.dither-stage) waits for this. A hidden canvas has no cells.
      if (cols * rows > 0) canvas.dataset.painted ??= '';
    };

    // The clock only runs while a frame is drawn, so a pause holds the frame and a
    // canvas that is off screen costs nothing.
    let raf = 0, last = 0, t = clock.current;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (pausedRef.current || now - last < 80) return; // about twelve frames a second: cells step, they don't glide
      t += last ? Math.min(0.25, (now - last) / 1000) : 0;
      last = now;
      clock.current = t;
      draw(t);
    };
    layout();
    draw(t);
    const ro = new ResizeObserver(() => { layout(); draw(t); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      last = 0;
      if (e.isIntersecting && !still) raf = requestAnimationFrame(frame);
    });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [shape, color, seed, cell, pixelRatio, rough, animate, img, position, tint, edge]);

  return <canvas ref={ref} style={{ display: 'block', width: '100%', height: '100%', ...style }} />;
}
