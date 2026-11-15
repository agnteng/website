import { useEffect, useMemo, useRef } from 'react';
import Animation from '@agnteng/brand/components/Animation.tsx';
import AnimImage from '@agnteng/brand/components/Image.tsx';
import Artifacts from '@agnteng/brand/components/Artifacts.tsx';
import { drawLayers } from './sceneDraw';
import { stageSize, type Scene } from './scene';
import type { OverlayAssets } from './overlay';
import { useImageList } from './useImageList';
import Mockup from './Mockup';

// A scene on screen: its background (a canvas of its own) with the layers on a
// second canvas over it. It fills its parent, which gives it the frame's shape.
//
// `scale` is how much larger than the builder's stage the parent is: cell sizes
// are multiplied by it, so the render page draws at full size what the stage
// shows small, cell for cell.

interface Props {
  scene: Scene;
  assets: OverlayAssets;
  fontsReady: boolean;
  scale?: number;
  paused?: boolean;
  preview?: boolean; // guides and empty photo slots
  mockup?: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>; // the background, for export
  onStatus?: (s: 'ok' | 'cors' | 'error') => void;
  onImages?: (images: Record<string, HTMLImageElement | null>) => void;
}

const NO_ARTIFACTS: [] = [];
const fill = { position: 'absolute', inset: 0, width: '100%', height: '100%' } as const;

export default function SceneView({ scene, assets, fontsReady, scale = 1, paused = false, preview = false, mockup = false, canvasRef, onStatus, onImages }: Props) {
  const { background: b, layers, frame } = scene;
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const photos = layers.filter((l) => l.type === 'photo');
  const loaded = useImageList(photos.map((l) => l.src || null));
  const images = useMemo(
    () => Object.fromEntries(photos.map((l, i) => [l.id, loaded[i] ?? null])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loaded, photos.map((l) => l.id).join('|')],
  );
  useEffect(() => onImages?.(images), [images, onImages]);

  // The layers' canvas holds about the frame's own pixels (capped), so type and logos stay crisp.
  const k = Math.min(1, 2560 / Math.max(frame.w, frame.h));
  const bw = Math.round(frame.w * k), bh = Math.round(frame.h * k);
  useEffect(() => {
    const cv = overlayRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    cv.width = bw;
    cv.height = bh;
    drawLayers(ctx, bw, bh, layers, assets, images, fontsReady, preview);
  }, [layers, assets, images, fontsReady, preview, bw, bh]);

  const stage = stageSize(frame);
  // Whole pixels: a cell of 12.5px leaves hairlines between cells.
  const px = (n: number) => Math.round(n * scale);
  return (
    <>
      {b.kind === 'field' ? (
        <Animation
          animation={b.animation} color={b.color} edge={b.edge} bg={b.bg} cell={px(b.cell)} gap={px(b.gap)}
          density={b.density} fade={b.fade} motion={b.motion} shape={b.shape}
          paused={paused} canvasRef={canvasRef} onStatus={onStatus} style={fill}
        >
          {b.image?.src && <AnimImage src={b.image.src} contrast={b.image.contrast} edgeGlow={b.image.edgeGlow} tone={b.image.tone} position={b.image.position} />}
        </Animation>
      ) : b.kind === 'photo' ? (
        <Artifacts
          src={b.src} position={b.position} color={b.color} tint={b.tint} cell={px(b.cell)} rough={b.rough}
          seed={b.seed} animate={b.animate} paused={paused} artifacts={b.artifacts} canvasRef={canvasRef} onStatus={onStatus} style={fill}
        />
      ) : (
        // A solid colour needs no cells; the empty canvas is there for the exporters to read.
        <Artifacts artifacts={NO_ARTIFACTS} canvasRef={canvasRef} style={fill} />
      )}
      <canvas ref={overlayRef} aria-hidden="true" style={fill} />
      {mockup && scene.mockup && <Mockup kind={scene.mockup} W={stage.w} H={stage.h} />}
    </>
  );
}
