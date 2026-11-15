// Draws a scene's layers on a canvas, over whatever is already there (the
// background). Everything is sized from (W, H), so the builder's preview, its
// exports and the render page draw the same picture at their own resolutions.

import { anchorFactors } from '@agnteng/brand/components/anchor.ts';
import { drawImageContain, drawImageCover, drawLogo, drawSlotPlaceholder, roundRect, type OverlayAssets } from './overlay';
import type { Layer, LogoLayer, PhotoLayer, ScrimLayer, TextLayer } from './scene';

type Ctx = CanvasRenderingContext2D;
type Spacing = Ctx & { letterSpacing?: string };
const FONTS = { sans: '"Manrope", ui-sans-serif, system-ui, sans-serif', mono: '"Kode Mono", ui-monospace, monospace' };
const loaded = (im: HTMLImageElement | null | undefined): im is HTMLImageElement => !!im && im.complete && im.naturalWidth > 0;

function logo(ctx: Ctx, W: number, H: number, l: LogoLayer, a: OverlayAssets) {
  ctx.save();
  ctx.translate(l.dx * W, l.dy * H);
  if (l.form !== 'mark') {
    drawLogo(ctx, W, H, l.anchor, l.scale, a, l.variant, false, l.form === 'line');
  } else {
    const mark = l.variant === 'blue' ? a.markBlue : a.mark;
    if (loaded(mark)) {
      const mh = Math.min(W, H) * l.scale, mw = mh * (mark.naturalWidth / mark.naturalHeight);
      const { fx, fy } = anchorFactors(l.anchor);
      const padX = W * 0.045, padY = H * 0.07;
      ctx.drawImage(mark, padX + (W - mw - 2 * padX) * fx, padY + (H - mh - 2 * padY) * fy, mw, mh);
    }
  }
  ctx.restore();
}

function text(ctx: Ctx, W: number, H: number, l: TextLayer) {
  const size = Math.min(W, H) * l.size;
  const value = l.upper ? l.text.toUpperCase() : l.text;
  const sp = ctx as Spacing;
  ctx.font = `${l.weight} ${size}px ${FONTS[l.font]}`;
  sp.letterSpacing = `${l.spacing * size}px`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = l.align;
  const x = l.x * W, y = l.y * H;
  if (l.pill && value) {
    // The capsule hugs the text; the trailing letter space is not part of it.
    const tw = ctx.measureText(value).width - l.spacing * size;
    const padX = size * 1.15, ph = size * 2.1, pw = tw + padX * 2;
    const left = l.align === 'left' ? x : l.align === 'right' ? x - pw : x - pw / 2;
    roundRect(ctx, left, y - ph / 2, pw, ph, ph / 2);
    ctx.fillStyle = l.pillColor;
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = l.color;
    ctx.fillText(value, left + padX, y + size * 0.04);
  } else {
    ctx.fillStyle = l.color;
    ctx.fillText(value, x, y);
  }
  sp.letterSpacing = '0px';
}

function photo(ctx: Ctx, W: number, H: number, l: PhotoLayer, im: HTMLImageElement | null | undefined, slots: boolean) {
  const x = l.x * W, y = l.y * H, w = l.w * W, h = l.h * H;
  if (!loaded(im)) return slots ? drawSlotPlaceholder(ctx, x, y, w, h, l.label) : undefined;
  if (l.fit === 'contain') drawImageContain(ctx, im, x + w / 2, y + h / 2, w, h);
  else drawImageCover(ctx, im, x, y, w, h, Math.min(w, h) * l.radius);
}

function scrim(ctx: Ctx, W: number, H: number, l: ScrimLayer) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(l.color.slice(i, i + 2), 16));
  const c = (a: number) => `rgba(${r},${g},${b},${a * l.opacity})`;
  let grad: CanvasGradient;
  if (l.shape === 'vignette') {
    const m = Math.min(W, H);
    grad = ctx.createRadialGradient(W / 2, H / 2, m * 0.18, W / 2, H / 2, m * 0.72);
    grad.addColorStop(0, c(0.2));
    grad.addColorStop(1, c(1));
  } else {
    grad = l.shape === 'bottom' ? ctx.createLinearGradient(0, 0, 0, H) : l.shape === 'left' ? ctx.createLinearGradient(0, 0, W, 0) : ctx.createLinearGradient(W, 0, 0, 0);
    // dark where the copy goes, clear at the far side
    const stops = l.shape === 'bottom' ? [[0, 0.25], [0.45, 0.38], [1, 1]] : [[0, 1], [0.46, 0.72], [1, 0.18]];
    for (const [at, a] of stops) grad.addColorStop(at, c(a));
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

// `images` holds each photo layer's loaded picture, by layer id. `preview` adds
// what only the builder shows: guides, and the dashed slot of a photo with no picture.
export function drawLayers(
  ctx: Ctx, W: number, H: number, layers: Layer[], assets: OverlayAssets,
  images: Record<string, HTMLImageElement | null>, fontsReady: boolean, preview: boolean,
) {
  for (const l of layers) {
    if (l.hidden) continue;
    if (l.type === 'logo') logo(ctx, W, H, l, assets);
    else if (l.type === 'text') { if (fontsReady) text(ctx, W, H, l); }
    else if (l.type === 'photo') photo(ctx, W, H, l, images[l.id], preview);
    else if (l.type === 'scrim') scrim(ctx, W, H, l);
    else if (l.type === 'rect') {
      ctx.save();
      ctx.globalAlpha = l.opacity;
      ctx.fillStyle = l.color;
      roundRect(ctx, l.x * W, l.y * H, l.w * W, l.h * H, Math.min(l.w * W, l.h * H) * l.radius);
      ctx.fill();
      ctx.restore();
    } else if (preview) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = Math.max(1.5, Math.min(W, H) * 0.004);
      ctx.setLineDash([ctx.lineWidth * 4, ctx.lineWidth * 4]);
      ctx.beginPath();
      if (l.shape === 'circle') ctx.ellipse(l.x * W, l.y * H, (l.w * W) / 2, (l.h * H) / 2, 0, 0, Math.PI * 2);
      else ctx.rect((l.x - l.w / 2) * W, (l.y - l.h / 2) * H, l.w * W, l.h * H);
      ctx.stroke();
      ctx.restore();
    }
  }
}
