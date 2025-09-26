import React, { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Image } from 'react-konva';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useImage } from 'react-konva-utils';
import { useOverlayRegistry, IconOverlay, IconInput } from 'Components/icon';
import DistanceLegend from './DistanceLegend';
import MapCircles from './MapCircles';

const MAP_SIZE = { width: 820, height: 1310 };

export const MyStage: React.FC = () => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const width = window.innerWidth;
  const height = window.innerHeight;
  const stageRef = useRef<StageType | null>(null);
  const mapImgSource = '/map.svg';

  const [map] = useImage(mapImgSource);

  // anchors in map (image) pixel coordinates
  const volcanoAnchor = { x: 352, y: 856 };
  const waterfallAnchor = { x: 650, y: 985 };
  const caveAnchor = { x: 108, y: 413 };
  const chestAnchor = { x: 524, y: 600 };

  // icon colors
  const volcanoColor = { r: 255, g: 69, b: 0 }; // orange-red
  const waterfallColor = { r: 30, g: 144, b: 255 }; // dodger blue
  const caveColor = { r: 128, g: 0, b: 128 }; // purple
  const chestColor = { r: 255, g: 215, b: 0 }; // gold

  const { makeRef, updateAll } = useOverlayRegistry();
  const volcanoRefCallback = makeRef();
  const waterfallRefCallback = makeRef();
  const caveRefCallback = makeRef();
  const chestRefCallback = makeRef();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInitial, setEditorInitial] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const achievementAudioRef = useRef<HTMLAudioElement | null>(null);

  const openEditorFor = (initialOrId?: string) => {
    const maybeKey = initialOrId;
    if (maybeKey && maybeKey.startsWith('id:')) {
      const id = maybeKey.slice(3);
      const raw = localStorage.getItem(`icon:${id}`);
      const stage = stageRef.current;
      const scale = stage ? stage.scaleX() || 1 : 1;
      if (raw) {
        const n = Number(raw);
        setEditorInitial(String(Math.round(n * scale)));
      } else {
        setEditorInitial('');
      }
      setEditingId(id);
      setEditorOpen(true);
      return;
    }
    setEditorInitial(initialOrId || '');
    setEditorOpen(true);
  };

  const [distances, setDistances] = useState<Record<string, number>>({});
  const [pointerMapPos, setPointerMapPos] = useState<{ x: number; y: number } | null>(null);

  // Helpers ---------------------------------------------------------------
  // Use the hard-coded MAP_SIZE constant instead of dynamically querying the image.

  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  // Mouse move: convert pointer to map coordinates and compute distances
  const handleMouseMoveKonva = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scale = stage.scaleX() || 1;
    const stagePos = stage.position();
    const pointerMap = {
      x: (pointer.x - stagePos.x) / scale,
      y: (pointer.y - stagePos.y) / scale,
    };
    setPointerMapPos({ x: pointerMap.x, y: pointerMap.y });

    const d = {
      volcano: Math.round(Math.hypot(pointerMap.x - volcanoAnchor.x, pointerMap.y - volcanoAnchor.y)),
      waterfall: Math.round(Math.hypot(pointerMap.x - waterfallAnchor.x, pointerMap.y - waterfallAnchor.y)),
      cave: Math.round(Math.hypot(pointerMap.x - caveAnchor.x, pointerMap.y - caveAnchor.y)),
    };
    setDistances(d);
  };

  const handleMouseLeaveKonva = () => {
    setDistances({});
    setPointerMapPos(null);
  };

  // Ctrl/meta + click -> copy legend values to clipboard
  const handleStageClick = async (e: KonvaEventObject<MouseEvent>) => {
    if (!(e && e.evt && (e.evt.ctrlKey || e.evt.metaKey))) return;
    const lines = ['volcano', 'waterfall', 'cave'].map((id) => `${id}: ${distances[id] ?? '—'} px`);
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      console.log('Copied distances to clipboard');
    } catch (err) {
      // fallback: show prompt and log error for diagnostics
      // (navigator.clipboard may be unavailable in some environments)
      console.warn('clipboard write failed', err);
      window.prompt('Copy distances', text);
    }
  };

  // drag: clamp stage position so the map cannot be dragged out of view
  const handleDragMove = () => {
    const stage = stageRef.current;
    if (!stage || !map) return;
    const scale = stage.scaleX() || 1;
    const pos = stage.position();
  const { width: iw, height: ih } = MAP_SIZE;
    const scaledW = iw * scale;
    const scaledH = ih * scale;
    // center horizontally when narrower than viewport
    const minX = scaledW <= width ? (width - scaledW) / 2 : Math.min(0, width - scaledW);
    const maxX = scaledW <= width ? (width - scaledW) / 2 : 0;
    const minY = Math.min(0, height - scaledH);
    const maxY = 0;
    const clamped = {
      x: clamp(pos.x, minX, maxX),
      y: clamp(pos.y, minY, maxY),
    };
    // only set if different to avoid extra redraws
    if (clamped.x !== pos.x || clamped.y !== pos.y) {
      stage.position(clamped);
    }
    updateAll();
  };

  // wheel/zoom: zoom towards pointer and clamp position afterwards
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage || !map) return;
    const oldScale = stage.scaleX() || 1;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    const clampedScale = clamp(newScale, 0.2, 6);

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    stage.scale({ x: clampedScale, y: clampedScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

  // clamp new position to image bounds (use hard-coded MAP_SIZE)
  const { width: iw, height: ih } = MAP_SIZE;
    const scaledW = iw * clampedScale;
    const scaledH = ih * clampedScale;
    const minX = scaledW <= width ? (width - scaledW) / 2 : Math.min(0, width - scaledW);
    const maxX = scaledW <= width ? (width - scaledW) / 2 : 0;
    const minY = Math.min(0, height - scaledH);
    const maxY = 0;

    const clampedPos = {
      x: clamp(newPos.x, minX, maxX),
      y: clamp(newPos.y, minY, maxY),
    };
    stage.position(clampedPos);
    updateAll();
  };

  // initial update after map loads (update overlays)
  useEffect(() => {
    if (map) updateAll();
  }, [map, updateAll]);

  // preload achievement audio once
  useEffect(() => {
    try {
      const a = new Audio('/acheivement.mp3');
      a.preload = 'auto';
      achievementAudioRef.current = a;
    } catch (err) {
      // ignore; audio will be created on-demand later
      console.warn('failed to create achievement audio', err);
    }
  }, []);

  // play sound once when puzzleSolved becomes true
  useEffect(() => {
    if (!puzzleSolved) return;
    const a = achievementAudioRef.current ?? new Audio('/acheivement.mp3');
    // attempt to play; caller likely initiated from a user gesture (submit)
    a.play().catch((err) => {
      // log and ignore playback errors (autoplay policies, etc.)
      console.warn('achievement audio play failed', err);
    });
  }, [puzzleSolved]);

  return (
    <>
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onWheel={handleWheel}
        draggable={true}
        onDragMove={handleDragMove}
        onMouseMove={handleMouseMoveKonva}
        onMouseLeave={handleMouseLeaveKonva}
        onClick={handleStageClick}
        style={{ cursor: 'grab' }}
      >
        <Layer>
          {/* Background map image (non-interactive) */}
          {map && <Image image={map as HTMLImageElement} x={0} y={0} listening={false} width={MAP_SIZE.width} height={MAP_SIZE.height} />}

          {/* Circles rendered in map-space */}
          <MapCircles
            items={[
              { id: 'volcano', anchor: volcanoAnchor, color: volcanoColor },
              { id: 'waterfall', anchor: waterfallAnchor, color: waterfallColor },
              { id: 'cave', anchor: caveAnchor, color: caveColor },
            ]}
          />

          <IconOverlay
            id="volcano"
            ref={volcanoRefCallback}
            stageRef={stageRef}
            imageSrc={'/volcano.svg'}
            anchor={volcanoAnchor}
            iconScale={5}
            onOpenEditor={(maybe) => openEditorFor(maybe ? `id:${maybe}` : undefined)}
			color={volcanoColor}
          />

          <IconOverlay
            id="waterfall"
            ref={waterfallRefCallback}
            stageRef={stageRef}
            imageSrc={'/waterfall.svg'}
            anchor={waterfallAnchor}
            iconScale={4}
            onOpenEditor={(maybe) => openEditorFor(maybe ? `id:${maybe}` : undefined)}
			color={waterfallColor}
          />

          <IconOverlay
            id="cave"
            ref={caveRefCallback}
            stageRef={stageRef}
            imageSrc={'/cave.svg'}
            anchor={caveAnchor}
            iconScale={4}
            onOpenEditor={(maybe) => openEditorFor(maybe ? `id:${maybe}` : undefined)}
			color={caveColor}
          />
		 {puzzleSolved && <IconOverlay
			id="chest"
			ref={chestRefCallback}
			stageRef={stageRef}
			imageSrc={'/chest.svg'}
			anchor={chestAnchor}
			iconScale={0.25}
			// onOpenEditor={(maybe) => openEditorFor(maybe ? `id:${maybe}` : undefined)}
			color={chestColor}
          />}

          {/* Scale bar rendered in map coordinates (full map width) */}
        </Layer>
      </Stage>

  {isAdmin && <DistanceLegend distances={distances} pointerMap={pointerMapPos} />}

      { /* render portal outside the Konva Stage so it mounts into the DOM */ }
      <IconInput
        open={editorOpen}
        initialValue={editorInitial}
        title={editingId ? `Set radius for ${editingId}` : 'Input Distance'}
        onSubmit={(v) => {
          if (editingId) {
            const num = Number(v);
            if (!v || !isFinite(num) || num <= 0) {
              localStorage.removeItem(`icon:${editingId}`);
            } else {
              localStorage.setItem(`icon:${editingId}`, v);
			  const caveValue = localStorage.getItem(`icon:cave`) || '';
			  const volcanoValue = localStorage.getItem(`icon:volcano`) || '';
			  const waterfallValue = localStorage.getItem(`icon:waterfall`) || '';
			  if (caveValue === '456' && volcanoValue === '309' && waterfallValue === '406') {
				setPuzzleSolved(true);

			  }
            }
          }
          console.log('Label submitted', v, 'for', editingId);
          setEditorOpen(false);
          setEditingId(null);
        }}
        onClose={() => {
          setEditorOpen(false);
          setEditingId(null);
        }}
      />
    </>
  );
};

export default MyStage;

