import { useCallback, useEffect, useRef, useState } from 'react';
import CollapsibleSection from './animation-builder/CollapsibleSection';
import CanvasStage from './animation-builder/CanvasStage';
import TopBar from './animation-builder/TopBar';
import CodeDrawer from './animation-builder/CodeDrawer';
import SceneView from './animation-builder/SceneView';
import { BackgroundPanel, FramePanel, LayersPanel } from './animation-builder/panels';
import { Range, Row, Seg, btn, btnAccent, field, note } from './animation-builder/Controls';
import { exportJpg, exportVideo, exportGif } from './animation-builder/exporters';
import { drawLayers } from './animation-builder/sceneDraw';
import { useLogoAssets, useFontsReady } from './animation-builder/useLogoAssets';
import { FIELD, PHOTO, PRESETS, bgColor, readScene, stageSize, writeScene, type Background, type Preset, type Scene } from './animation-builder/scene';

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

const SCALES = ['1×', '2×', '3×', '4×'] as const;
// Past this a browser may give an empty canvas.
const CANVAS_MAX_EDGE = 8192;

export default function WaveFieldBuilder() {
  const [scene, setScene] = useState<Scene>(START);
  const [selected, setSelected] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [mockup, setMockup] = useState(true);
  const [guides, setGuides] = useState(true);
  const [imgStatus, setImgStatus] = useState<'ok' | 'cors' | 'error' | null>(null);
  const [secs, setSecs] = useState(4);
  const [times, setTimes] = useState<(typeof SCALES)[number]>('1×'); // export size, in frames
  const [pixelRatio, setPixelRatio] = useState<number | undefined>(); // set while a large export is read
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
  // The notice about a photo that cannot be read belongs to the picture that raised it.
  const bgSrc = scene.background.kind === 'photo' ? scene.background.src : scene.background.kind === 'field' ? scene.background.image?.src : '';
  useEffect(() => setImgStatus(null), [bgSrc]);
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
    const by = Number.parseInt(times, 10);
    const out = { w: scene.frame.w * by, h: scene.frame.h * by };
    try {
      // A photo is redrawn from its file at the export's size; the field's flat cells scale as they are.
      if (scene.background.kind === 'photo') {
        const stage = stageSize(scene.frame);
        const ratio = Math.min(out.w / stage.w, CANVAS_MAX_EDGE / Math.max(stage.w, stage.h));
        const want = Math.round(stage.w * ratio);
        setPixelRatio(ratio);
        for (let i = 0; i < 60 && canvas.width !== want; i++) await new Promise((r) => setTimeout(r, 50));
        await new Promise((r) => setTimeout(r, 250)); // and a painted frame at that size
      }
      const target = {
        source: canvas,
        out,
        scale: by,
        bg: bgColor(scene.background),
        overlay: (ctx: CanvasRenderingContext2D, W: number, H: number) => drawLayers(ctx, W, H, scene.layers, assets, images.current, fontsReady, false),
        smooth: scene.background.kind === 'photo', // a photo is scaled smoothly; the field's cells are kept hard
      };
      const name = `agentic-${out.w}x${out.h}`;
      if (kind === 'jpg') await exportJpg(target, name);
      else if (kind === 'mp4') await exportVideo(target, secs, name);
      else await exportGif(target, secs, name, 12, setProg);
    } catch (e) {
      console.error('export failed', e);
      setMsg(by > 1
        ? 'Export failed. The browser may refuse a picture this large: try a smaller scale.'
        : 'Export failed. A photo loaded by URL from another site can block it: upload the file instead.');
    } finally {
      setPixelRatio(undefined);
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

  const visible = scene.layers.filter((l) => l.type !== 'guide').length;

  return (
    <div className="grid h-screen grid-cols-[1fr_288px] grid-rows-[44px_1fr] bg-canvas font-sans text-deep-navy">
      <TopBar />

      <div className="flex min-h-0 flex-col overflow-hidden">
        <div className="relative min-h-0 flex-1">
          <CanvasStage frame={scene.frame} bg={bgColor(scene.background)} paused={paused} onTogglePlay={() => setPaused((v) => !v)} onDropImage={dropImage}>
            <SceneView scene={scene} assets={assets} fontsReady={fontsReady} paused={paused} pixelRatio={pixelRatio} preview={guides} mockup={mockup} canvasRef={canvasRef} onStatus={setImgStatus} onImages={onImages} />
          </CanvasStage>
          {imgStatus === 'cors' && (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
              <div className="rounded-md bg-coral px-3 py-1.5 text-[11px] text-deep-navy shadow">
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

      <aside className="overflow-y-auto border-l border-line bg-panel font-sans">
        <CollapsibleSection title="Presets" open={open.presets} onToggle={() => toggle('presets')}>
          {[...GROUPS.map((g) => [g, PRESETS.filter((p) => p.group === g)] as const), ['Yours', mine] as const].map(([g, list]) => (
            <Row key={g} label={g} top>
              <div className="flex flex-wrap gap-1">
                {list.map((p, i) => (
                  <span key={p.name + i} className="inline-flex h-6 overflow-hidden rounded-[5px] border border-black/10 text-[11px] transition-colors hover:border-black/25">
                    <button type="button" onClick={() => applyPreset(p)} className="px-2 text-deep-navy/80 hover:text-deep-navy">{p.name}</button>
                    {g === 'Yours' && <button type="button" aria-label={`Delete ${p.name}`} title="Delete" onClick={() => keep(mine.filter((_, j) => j !== i))} className="border-l border-black/10 px-1.5 text-deep-navy/40 hover:text-coral">✕</button>}
                  </span>
                ))}
                {g === 'Yours' && naming === null && <button type="button" onClick={() => setNaming('')} className={btn}>Save current…</button>}
              </div>
            </Row>
          ))}
          {naming !== null && (
            <form className="flex gap-1.5" onSubmit={(e) => { e.preventDefault(); if (naming.trim()) { keep([...mine, { name: naming.trim(), group: 'Yours', scene }]); setNaming(null); } }}>
              <input autoFocus type="text" value={naming} onChange={(e) => setNaming(e.target.value)} placeholder="Name this preset" aria-label="Preset name" className={field} />
              <button type="submit" className={btnAccent}>Save</button>
              <button type="button" onClick={() => setNaming(null)} className={btn}>Cancel</button>
            </form>
          )}
          <p className={note}>A preset fills in the frame and the layers; everything stays editable. Yours also keep their background and live in this browser, without uploaded pictures.</p>
        </CollapsibleSection>

        <CollapsibleSection title="Frame" open={open.frame} onToggle={() => toggle('frame')} right={`${scene.frame.w} × ${scene.frame.h}`}>
          <FramePanel scene={scene} set={patch} mockup={mockup} setMockup={setMockup} guides={guides} setGuides={setGuides} />
        </CollapsibleSection>

        <CollapsibleSection title="Background" open={open.background} onToggle={() => toggle('background')}>
          <BackgroundPanel b={scene.background} set={(background) => patch({ background })} />
        </CollapsibleSection>

        <CollapsibleSection title="Layers" open={open.layers} onToggle={() => toggle('layers')} right={scene.layers.length || undefined}>
          <LayersPanel layers={scene.layers} set={(layers) => patch({ layers })} selected={selected} select={setSelected} />
        </CollapsibleSection>

        <CollapsibleSection title="Export" open={open.export} onToggle={() => toggle('export')} right={`${scene.frame.w * Number.parseInt(times, 10)} × ${scene.frame.h * Number.parseInt(times, 10)}`}>
          <Row label="Scale"><Seg options={SCALES} value={times} onChange={setTimes} /></Row>
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" onClick={() => doExport('jpg')} disabled={!!busy} className={btnAccent}>JPG</button>
            <button type="button" onClick={() => doExport('gif')} disabled={!!busy} className={btnAccent}>GIF</button>
            <button type="button" onClick={() => doExport('mp4')} disabled={!!busy} className={btnAccent}>MP4</button>
          </div>
          <Range label="Seconds" value={secs} min={1} max={15} step={1} onChange={setSecs} />
          {busy
            ? <p className="text-[11px] text-electric-blue">Exporting {busy.toUpperCase()}…{busy === 'gif' ? ` ${Math.round(prog * 100)}%` : ''}</p>
            : msg
              ? <p className="text-[11px] text-coral">{msg}</p>
              : <p className={note}>Scale multiplies the frame: 2× of 1200 × 630 is 2400 × 1260, with everything in it twice the size. MP4 stops at 3840 on its long side and GIF at 2000. Seconds set the GIF and MP4 length. JPG takes the current frame: pause to pick one.</p>}
          <div className="!mt-2.5 border-t border-line pt-2.5">
            {pasting === null
              ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <button type="button" onClick={() => setPasting('')} className={btn}>Open scene JSON…</button>
                  <button type="button" onClick={() => { setScene(START); setSelected(null); }} className={btn}>Start over</button>
                </div>
              )
              : (
                <div className="space-y-1.5">
                  <textarea autoFocus value={pasting} onChange={(e) => setPasting(e.target.value)} placeholder='{ "frame": { "w": 1920, "h": 1080 }, … }' aria-label="Scene JSON" rows={5} className={`${field} !h-auto resize-y py-1.5 font-[ui-monospace,SFMono-Regular,Menlo,monospace]`} />
                  <div className="flex gap-1.5">
                    <button type="button" onClick={paste} className={btnAccent}>Open</button>
                    <button type="button" onClick={() => { setPasting(null); setMsg(null); }} className={btn}>Cancel</button>
                  </div>
                </div>
              )}
          </div>
        </CollapsibleSection>
      </aside>
    </div>
  );
}
