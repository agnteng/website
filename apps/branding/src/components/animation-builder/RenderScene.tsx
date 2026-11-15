import { useEffect, useRef, useState } from 'react';
import SceneView from './SceneView';
import { useFontsReady, useLogoAssets } from './useLogoAssets';
import { bgColor, readScene, stageSize, type Scene } from './scene';

// The render page: one scene, edge to edge, with nothing around it, for a
// headless browser to photograph (scripts/render_scene.py). The scene comes as
// JSON in `?scene=`, or from the address in `?src=`. `data-render` on <html> says how
// it went: "ok" once the scene is on the page, else what was wrong.
export default function RenderScene() {
  const [scene, setScene] = useState<Scene | null>(null);
  const [error, setError] = useState('');
  const assets = useLogoAssets();
  const fontsReady = useFontsReady();
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const src = q.get('src');
    (src ? fetch(src).then((r) => r.json()) : Promise.resolve(JSON.parse(q.get('scene') || 'null')))
      .then((s) => (s ? setScene(readScene(s)) : setError('No scene: pass ?scene=<JSON> or ?src=<address of the JSON>.')))
      .catch((e) => setError(`That scene could not be read: ${e.message}`));
  }, []);
  // `?frames=N&fps=F` also records the moving picture: N JPEG frames, left in the page
  // as JSON for the script to collect.
  const box = useRef<HTMLDivElement>(null);
  const [pictures, setPictures] = useState<Record<string, HTMLImageElement | null>>({});
  const [waited, setWaited] = useState(false); // a picture that fails to load must not hold the render for ever
  useEffect(() => { const id = setTimeout(() => setWaited(true), 6000); return () => clearTimeout(id); }, []);
  const done = useRef(false);
  useEffect(() => {
    const html = document.documentElement;
    if (error) { html.dataset.render = error; return; }
    if (!scene || !fontsReady || done.current) return;
    if (!waited && scene.layers.some((l) => l.type === 'photo' && l.src && !l.hidden && !pictures[l.id])) return;
    done.current = true;
    const q = new URLSearchParams(location.search);
    const frames = Number(q.get('frames')) || 0, fps = Number(q.get('fps')) || 15;
    if (!frames) { html.dataset.render = 'ok'; return; }
    (async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      await sleep(1500); // the background's own photo, and a first painted frame
      const [bg, over] = box.current!.querySelectorAll('canvas');
      const { w, h } = scene.frame;
      const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
      const ctx = c.getContext('2d')!;
      const out: string[] = [];
      for (let i = 0; i < frames; i++) {
        ctx.fillStyle = bgColor(scene.background);
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(bg, 0, 0, w, h);
        ctx.drawImage(over, 0, 0, w, h);
        out.push(c.toDataURL('image/jpeg', 0.92));
        await sleep(1000 / fps);
      }
      document.body.appendChild(Object.assign(document.createElement('script'), { id: 'frames', type: 'application/json', textContent: JSON.stringify(out) }));
      html.dataset.render = 'ok';
    })().catch((e) => { html.dataset.render = `The frames could not be read (a photo from a site that forbids it?): ${e.message}`; });
  }, [error, scene, fontsReady, pictures, waited]);
  if (error) return <p style={{ font: '16px system-ui', padding: 24, color: '#fff' }}>{error}</p>;
  if (!scene) return null;
  // Cells are sized for the builder's stage; here the frame is drawn at its own size.
  const scale = Math.max(scene.frame.w, scene.frame.h) / Math.max(stageSize(scene.frame).w, stageSize(scene.frame).h);
  return (
    <div ref={box} style={{ position: 'relative', width: scene.frame.w, height: scene.frame.h, overflow: 'hidden', background: bgColor(scene.background) }}>
      <SceneView scene={scene} assets={assets} fontsReady={fontsReady} scale={scale} paused={new URLSearchParams(location.search).has('still')} onImages={setPictures} />
    </div>
  );
}
