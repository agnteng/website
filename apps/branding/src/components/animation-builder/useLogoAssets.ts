import { useEffect, useState } from 'react';
import type { OverlayAssets } from './overlay';

// Preload the logo SVGs once, gated on load, for
// the overlay compositor. Mirrors BannerBuilder's asset-loading pattern.
export function useLogoAssets(): OverlayAssets {
  const [assets, setAssets] = useState<OverlayAssets>({ mark: null, word: null, markBlue: null, wordBlue: null, wordLine: null, wordLineBlue: null });
  useEffect(() => {
    const srcs: Record<keyof OverlayAssets, string> = {
      mark: '/assets/logo/ae-mark-white.svg',
      word: '/assets/logo/ae-wordmark-white.svg',
      markBlue: '/assets/logo/ae-mark.svg',
      wordBlue: '/assets/logo/ae-wordmark.svg',
      wordLine: '/assets/logo/ae-wordmark-line-white.svg',
      wordLineBlue: '/assets/logo/ae-wordmark-line.svg',
    };
    const imgs = {} as OverlayAssets;
    const keys = Object.keys(srcs) as (keyof OverlayAssets)[];
    let n = 0;
    const done = () => { if (++n >= keys.length) setAssets({ ...imgs }); };
    keys.forEach((k) => {
      const im = new Image();
      im.onload = done;
      im.onerror = done;
      im.src = srcs[k];
      imgs[k] = im;
    });
  }, []);
  return assets;
}

// Every weight a text layer can ask for. A canvas never fetches a font itself: one that no
// page text uses (Manrope, on the bare render page) is drawn in the fallback until loaded.
const FACES = ['"Kode Mono"', '"Manrope"'].flatMap((f) => [400, 500, 600, 700, 800].map((w) => `${w} 22px ${f}`));

// Wait for the brand fonts so text is drawn in them, at their metrics.
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const d = (document as Document & { fonts?: { load: (s: string) => Promise<unknown>; ready: Promise<unknown> } }).fonts;
    if (d && d.load) {
      Promise.all(FACES.map((f) => d.load(f))).then(() => d.ready).then(() => setReady(true)).catch(() => setReady(true));
      const id = setTimeout(() => setReady(true), 3000);
      return () => clearTimeout(id);
    }
    setReady(true);
  }, []);
  return ready;
}
