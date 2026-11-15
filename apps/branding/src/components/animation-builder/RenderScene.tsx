import { useEffect, useState } from 'react';
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
  useEffect(() => {
    if (error) document.documentElement.dataset.render = error;
    else if (scene && fontsReady) document.documentElement.dataset.render = 'ok';
  }, [error, scene, fontsReady]);
  if (error) return <p style={{ font: '16px system-ui', padding: 24, color: '#fff' }}>{error}</p>;
  if (!scene) return null;
  // Cells are sized for the builder's stage; here the frame is drawn at its own size.
  const scale = Math.max(scene.frame.w, scene.frame.h) / Math.max(stageSize(scene.frame).w, stageSize(scene.frame).h);
  return (
    <div style={{ position: 'relative', width: scene.frame.w, height: scene.frame.h, overflow: 'hidden', background: bgColor(scene.background) }}>
      <SceneView scene={scene} assets={assets} fontsReady={fontsReady} scale={scale} paused={new URLSearchParams(location.search).has('still')} />
    </div>
  );
}
