import { useCallback, useEffect, useRef, useState } from 'react';
import CollapsibleSection from './animation-builder/CollapsibleSection';
import CanvasStage from './animation-builder/CanvasStage';
import TopBar from './animation-builder/TopBar';
import CodeDrawer from './animation-builder/CodeDrawer';
import SceneView from './animation-builder/SceneView';
import { BackgroundPanel, FramePanel, LayersPanel } from './animation-builder/panels';
import { exportJpg, exportVideo, exportGif } from './animation-builder/exporters';
import { drawLayers } from './animation-builder/sceneDraw';
import { useLogoAssets, useFontsReady } from './animation-builder/useLogoAssets';
import { FIELD, PHOTO, PRESETS, bgColor, readScene, writeScene, type Background, type Preset, type Scene } from './animation-builder/scene';

// The builder: one scene (animation-builder/scene.ts), a stage that shows it,
// and a sidebar with a panel for each of its parts. Presets fill the scene in;
// everything they set can be changed afterwards. What comes out is an image or
// a video, the background's JSX, or the scene as JSON for the render page.

type SectionId = 'presets' | 'frame' | 'background' | 'layers' | 'export';
const START: Scene = { frame: { w: 1920, h: 1080 }, background: FIELD, layers: [] };
const STORE = 'agnteng.builder.presets';
const GROUPS = [...new Set(PRESETS.map((p) => p.group))];

// The background as the component that draws it, for pasting into a page.
function jsx(b: Background): string {
  const src = (s: string) => (s.startsWith('blob:') ? '/your-image.jpg' : s);
  if (b.kind === 'solid') return `<div style={{ background: '${b.color}' }} />`;
  if (b.kind === 'photo') {
    return [
      '<Artifacts', `  src="${src(b.src)}"`, `  position="${b.position}"`, `  color="${b.color}"`, ...(b.tint ? ['  tint'] : []),
      `  cell={${b.cell}}`, `  rough={${b.rough}}`, `  seed={${b.seed}}`, ...(b.animate ? ['  animate'] : []),
      '  artifacts={[', ...b.artifacts.map((a) => `    { at: '${a.at}', solid: ${a.solid}, reach: ${a.reach} },`), '  ]}', '/>',
    ].join('\n');
  }
  const props = `  animation="${b.animation}"\n  color="${b.color}"\n  edge="${b.edge}"\n  bg="${b.bg}"\n  cell={${b.cell}}\n  gap={${b.gap}}\n  density={${b.density}}\n  motion={${b.motion}}\n  fade="${b.fade}"\n  shape="${b.shape}"`;
  return b.image?.src
    ? `<Animation\n${props}\n>\n  <Image src="${src(b.image.src)}" contrast={${b.image.contrast}} edgeGlow={${b.image.edgeGlow}} tone={${b.image.tone}} position="${b.image.position}" />\n</Animation>`
    : `<Animation\n${props}\n/>`;
}

export default function WaveFieldBuilder() {
  const [scene, setScene] = useState<Scene>(START);
  const [selected, setSelected] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [mockup, setMockup] = useState(true);
  const [guides, setGuides] = useState(true);
  const [imgStatus, setImgStatus] = useState<'ok' | 'cors' | 'error' | null>(null);
  const [secs, setSecs] = useState(4);
  const [busy, setBusy] = useState<'jpg' | 'gif' | 'mp4' | null>(null);
  const [prog, setProg] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [mine, setMine] = useState<Preset[]>([]);
  const [naming, setNaming] = useState<string | null>(null); // the name being typed for a new preset
  const [pasting, setPasting] = useState<string | null>(null); // the JSON being pasted in
  const [open, setOpen] = useState<Record<SectionId, boolean>>({ presets: true, frame: false, background: true, layers: true, export: false });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const images = useRef<Record<string, HTMLImageElement | null>>({});
  const onImages = useCallback((m: Record<string, HTMLImageElement | null>) => { images.current = m; }, []);
  const assets = useLogoAssets();
  const fontsReady = useFontsReady();
  const toggle = (id: SectionId) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const patch = (p: Partial<Scene>) => setScene((s) => ({ ...s, ...p }));

  // The user's own presets live in this browser.
  useEffect(() => {
    try { setMine((JSON.parse(localStorage.getItem(STORE) || '[]') as Preset[]).map((p) => ({ ...p, scene: readScene(p.scene) }))); } catch { /* none saved, or storage is off */ }
  }, []);
  const keep = (next: Preset[]) => {
    setMine(next);
    try { localStorage.setItem(STORE, JSON.stringify(next.map((p) => ({ ...p, scene: JSON.parse(writeScene(p.scene as Scene)) })))); } catch { /* storage is off */ }
  };
  const applyPreset = (p: Preset) => {
    // A preset without a background leaves the current one in place.
    setScene((s) => readScene({ ...p.scene, background: p.scene.background ?? s.background }));
    setSelected(null);
  };

  // A picture dropped on the stage goes to the selected photo layer, else to the background.
  const dropImage = (file: File) => {
    const src = URL.createObjectURL(file);
    setScene((s) => {
      const layer = s.layers.find((l) => l.id === selected);
      if (layer?.type === 'photo') return { ...s, layers: s.layers.map((l) => (l.id === layer.id ? { ...layer, src } : l)) };
      const b = s.background;
      if (b.kind === 'field' && b.image?.src) return { ...s, background: { ...b, image: { ...b.image, src } } };
      return { ...s, background: b.kind === 'photo' ? { ...b, src } : { ...PHOTO, src, color: b.color } };
    });
  };

  const doExport = async (kind: 'jpg' | 'gif' | 'mp4') => {
    const canvas = canvasRef.current;
    if (!canvas || busy) return;
    setMsg(null);
    setBusy(kind);
    setProg(0);
    try {
      const target = {
        source: canvas,
        out: scene.frame,
        bg: bgColor(scene.background),
        overlay: (ctx: CanvasRenderingContext2D, W: number, H: number) => drawLayers(ctx, W, H, scene.layers, assets, images.current, fontsReady, false),
        smooth: scene.background.kind === 'photo', // a photo is scaled smoothly; the field's cells are kept hard
      };
      const name = `agentic-${scene.frame.w}x${scene.frame.h}`;
      if (kind === 'jpg') await exportJpg(target, name);
      else if (kind === 'mp4') await exportVideo(target, secs, name);
      else await exportGif(target, secs, name, 12, setProg);
    } catch (e) {
      console.error('export failed', e);
      setMsg('Export failed. A photo loaded by URL from another site can block it: upload the file instead.');
    } finally {
      setBusy(null);
      setProg(0);
    }
  };
  const paste = () => {
    try {
      setScene(readScene(JSON.parse(pasting || '')));
      setSelected(null);
      setPasting(null);
      setMsg(null);
    } catch {
      setMsg('That is not a scene: it has to be JSON.');
    }
  };

  const chip = 'rounded-md border border-black/10 px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-deep-navy';
  const wide = 'w-full rounded-md border border-black/10 py-2 font-mono text-[11px] uppercase tracking-wider text-deep-navy/70 transition-colors hover:border-electric-blue hover:text-electric-blue disabled:cursor-not-allowed disabled:opacity-40';
  const field = 'w-full min-w-0 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy focus:border-electric-blue focus:outline-none';
  const label = 'mb-2 block font-mono text-[11px] uppercase tracking-wider text-deep-navy/55';
  const visible = scene.layers.filter((l) => l.type !== 'guide').length;

  return (
    <div className="grid h-screen grid-cols-[1fr_328px] grid-rows-[52px_1fr] bg-canvas font-sans text-deep-navy">
      <TopBar />

      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1">
          <CanvasStage frame={scene.frame} bg={bgColor(scene.background)} paused={paused} onTogglePlay={() => setPaused((v) => !v)} onDropImage={dropImage}>
            <SceneView scene={scene} assets={assets} fontsReady={fontsReady} paused={paused} preview={guides} mockup={mockup} canvasRef={canvasRef} onStatus={setImgStatus} onImages={onImages} />
          </CanvasStage>
          {imgStatus === 'cors' && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
              <div className="rounded-md bg-coral px-3 py-1.5 font-mono text-[10px] text-deep-navy shadow">
                This URL allows showing the photo but not recolouring or exporting it. Upload the file instead.
              </div>
            </div>
          )}
        </div>
        <CodeDrawer
          tabs={[
            { name: 'Scene', code: writeScene(scene) },
            { name: 'JSX', code: visible ? `${jsx(scene.background)}\n\n/* The background only. The ${visible} layer${visible > 1 ? 's' : ''} on top are part of the scene, not of this component. */` : jsx(scene.background) },
          ]}
        />
      </div>

      <aside className="overflow-y-auto border-l border-line bg-panel">
        <CollapsibleSection title="Presets" open={open.presets} onToggle={() => toggle('presets')}>
          {GROUPS.map((g) => (
            <div key={g}>
              <span className={label}>{g}</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.filter((p) => p.group === g).map((p) => <button key={p.name} type="button" onClick={() => applyPreset(p)} className={chip}>{p.name}</button>)}
              </div>
            </div>
          ))}
          <div>
            <span className={label}>Yours</span>
            <div className="flex flex-wrap gap-1.5">
              {mine.map((p, i) => (
                <span key={i} className="inline-flex overflow-hidden rounded-md border border-black/10">
                  <button type="button" onClick={() => applyPreset(p)} className="px-2.5 py-1.5 font-mono text-[11px] text-deep-navy/70 transition-colors hover:text-electric-blue">{p.name}</button>
                  <button type="button" aria-label={`Delete ${p.name}`} onClick={() => keep(mine.filter((_, j) => j !== i))} className="border-l border-black/10 px-2 font-mono text-[11px] text-deep-navy/40 transition-colors hover:text-coral">✕</button>
                </span>
              ))}
              {naming === null && <button type="button" onClick={() => setNaming('')} className="rounded-md border border-electric-blue/40 bg-electric-blue/10 px-2.5 py-1.5 font-mono text-[11px] text-electric-blue transition-colors hover:bg-electric-blue/15">+ save this one</button>}
            </div>
            {naming !== null && (
              <form className="mt-2 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (naming.trim()) { keep([...mine, { name: naming.trim(), group: 'Yours', scene }]); setNaming(null); } }}>
                <input autoFocus type="text" value={naming} onChange={(e) => setNaming(e.target.value)} placeholder="Name it" aria-label="Preset name" className={field} />
                <button type="submit" className={`shrink-0 ${chip}`}>save</button>
                <button type="button" onClick={() => setNaming(null)} className={`shrink-0 ${chip}`}>cancel</button>
              </form>
            )}
          </div>
          <p className="font-mono text-[10px] leading-relaxed text-deep-navy/45">A preset fills in the frame and the layers; change anything afterwards. Yours also keep their background, and stay in this browser.</p>
        </CollapsibleSection>

        <CollapsibleSection title="Frame" open={open.frame} onToggle={() => toggle('frame')} right={`${scene.frame.w}×${scene.frame.h}`}>
          <FramePanel scene={scene} set={patch} mockup={mockup} setMockup={setMockup} guides={guides} setGuides={setGuides} />
        </CollapsibleSection>

        <CollapsibleSection title="Background" open={open.background} onToggle={() => toggle('background')} right={scene.background.kind}>
          <BackgroundPanel b={scene.background} set={(background) => patch({ background })} />
        </CollapsibleSection>

        <CollapsibleSection title="Layers" open={open.layers} onToggle={() => toggle('layers')} right={String(scene.layers.length)}>
          <LayersPanel layers={scene.layers} set={(layers) => patch({ layers })} selected={selected} select={setSelected} />
        </CollapsibleSection>

        <CollapsibleSection title="Export" open={open.export} onToggle={() => toggle('export')}>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-deep-navy/55">Seconds</span>
            <input type="number" min={1} max={15} value={secs} onChange={(e) => setSecs(Math.max(1, Math.min(15, Math.round(Number(e.target.value) || 1))))} className="w-16 rounded-md border border-black/15 bg-white px-2.5 py-1.5 font-mono text-[11px] text-deep-navy focus:border-electric-blue focus:outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => doExport('jpg')} disabled={!!busy} className={wide}>JPG</button>
            <button type="button" onClick={() => doExport('gif')} disabled={!!busy} className={wide}>GIF</button>
            <button type="button" onClick={() => doExport('mp4')} disabled={!!busy} className={wide}>MP4</button>
          </div>
          {pasting === null
            ? <button type="button" onClick={() => setPasting('')} className={wide}>open a scene from JSON</button>
            : (
              <div className="space-y-1.5">
                <textarea autoFocus value={pasting} onChange={(e) => setPasting(e.target.value)} placeholder='{ "frame": { "w": 1920, "h": 1080 }, … }' aria-label="Scene JSON" rows={5} className={`${field} resize-y`} />
                <div className="flex gap-1.5">
                  <button type="button" onClick={paste} className={wide}>open</button>
                  <button type="button" onClick={() => { setPasting(null); setMsg(null); }} className={wide}>cancel</button>
                </div>
              </div>
            )}
          {busy
            ? <div className="font-mono text-[10px] text-electric-blue">exporting {busy.toUpperCase()}…{busy === 'gif' ? ` ${Math.round(prog * 100)}%` : ''}</div>
            : msg
              ? <div className="font-mono text-[10px] text-coral">{msg}</div>
              : <p className="font-mono text-[10px] leading-relaxed text-deep-navy/40">Exports are {scene.frame.w}×{scene.frame.h}. Seconds set the GIF and MP4 length; JPG takes the current frame, so pause to pick one. The scene itself is in the Code drawer.</p>}
        </CollapsibleSection>

        <div className="p-4">
          <button type="button" onClick={() => { setScene(START); setSelected(null); }} className={wide}>start over</button>
        </div>
      </aside>
    </div>
  );
}
