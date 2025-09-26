import { Stage, Layer, Image } from 'react-konva';
import type { Stage as StageType } from 'konva/lib/Stage';
import type { KonvaEventObject } from 'konva/lib/Node';
import { useImage } from 'react-konva-utils';
import { useRef, useEffect } from 'react';
import { useOverlayRegistry, IconOverlay } from 'Components/icon';

export const MyStage = () => {
	const width = window.innerWidth;
	const height = window.innerHeight;
	const stageRef = useRef<StageType | null>(null);
	const mapImgSource = '/src/assets/map.svg';
	const volcanoImgSource = '/src/assets/volcano.svg';
	const [map] = useImage(mapImgSource);

	// Volcano overlay: anchor in map (image) pixel coordinates.
	// Change these to the correct map-space anchor for your SVG.
	const volcanoAnchor = { x: 352, y: 856 };
	// vertical gap (pixels) between the red X and the bottom of the volcano image

	// use overlay registry hook (DRY registration + updateAll)
	const { makeRef, updateAll } = useOverlayRegistry();
	// callback refs for each overlay (returned by makeRef)
	const volcanoRefCallback = makeRef();
	const waterfallRefCallback = makeRef();
    const caveRefCallback = makeRef();

	// limits
	const MIN_SCALE = 0.5;
	const MAX_SCALE = 10;

	const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

	const getImageSize = () => {
		const imgEl = map as HTMLImageElement | undefined;
		const iw = imgEl ? (imgEl.naturalWidth || imgEl.width || width) : width;
		const ih = imgEl ? (imgEl.naturalHeight || imgEl.height || height) : height;
		return { iw, ih };
	};

	// center horizontally after image loads
	useEffect(() => {
		const stage = stageRef.current;
		if (!stage || !map) return;
		const imgEl = map as HTMLImageElement | undefined;
		const iw = imgEl ? (imgEl.naturalWidth || imgEl.width || width) : width;
		const ih = imgEl ? (imgEl.naturalHeight || imgEl.height || height) : height;
		const scale = stage.scaleX() || 1;
		const scaledW = iw * scale;
		// compute horizontal center or clamp if larger
		const x = scaledW <= width ? (width - scaledW) / 2 : clamp(stage.x(), Math.min(0, width - scaledW), 0);
		// clamp vertical to keep image visible (don't change if already set)
		const minY = Math.min(0, height - ih * scale);
		const y = clamp(stage.y(), minY, 0);
		stage.position({ x, y });
	}, [map, width, height]);

	const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
		e.evt.preventDefault();

		const stage = stageRef.current;
		if (!stage) return;
		const oldScale = stage.scaleX();
		const pointer = stage.getPointerPosition();
		if (!pointer) return;

		const mousePointTo = {
			x: (pointer.x - stage.x()) / oldScale,
			y: (pointer.y - stage.y()) / oldScale,
		};

		// how to scale? Zoom in? Or zoom out?
		const scrollspeed = 10;
		let direction = e.evt.deltaY > 0 ? -1 : 1;

		// when we zoom on trackpad, e.evt.ctrlKey is true
		// in that case lets revert direction
		if (e.evt.ctrlKey) {
			direction = -direction;
		}

		const scaleBy = 1 + scrollspeed / 100;
		let newScale =
			direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
		// clamp scale
		newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);

		stage.scale({ x: newScale, y: newScale });

		const newPos = {
			x: pointer.x - mousePointTo.x * newScale,
			y: pointer.y - mousePointTo.y * newScale,
		};

		// clamp position so image stays covering the canvas
		const { iw, ih } = getImageSize();
		const scaledW = iw * newScale;
		const scaledH = ih * newScale;
		// If image is narrower than stage, center horizontally
		const minX = scaledW <= width ? (width - scaledW) / 2 : Math.min(0, width - scaledW);
		const maxX = scaledW <= width ? (width - scaledW) / 2 : 0;
		const minY = Math.min(0, height - scaledH);
		const maxY = 0;

		const clamped = {
			x: clamp(newPos.x, minX, maxX),
			y: clamp(newPos.y, minY, maxY),
		};

		stage.position(clamped);

	// update overlays
	updateAll();
	};

	const handleDragMove = () => {
		const stage = stageRef.current;
		if (!stage || !map) return;
		const scale = stage.scaleX();
		const pos = stage.position();
		const { iw, ih } = getImageSize();
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

	// update overlays
	updateAll();
	};

	// initial update after map loads (update overlays)
	useEffect(() => {
		if (map) updateAll();
	}, [map, updateAll]);

	return (
		<Stage
			width={width}
			height={height}
			ref={stageRef}
			onWheel={handleWheel}
			draggable={true}
			onDragMove={handleDragMove}
			style={{ cursor: 'grab' }}
		>
			<Layer>
				<Image image={map} x={0} y={0} style={{ cursor: 'grab' }} />
				{/* volcano Group is positioned at the anchor point (map coords).
					The volcano Image inside is offset so its bottom-center sits at the anchor.
					Because the Group and children live in map coordinates, they will scale/translate with the Stage,
					making the volcano appear to grow/shrink as the viewer zooms in/out. */}
				<IconOverlay
					ref={volcanoRefCallback}
					stageRef={stageRef}
					imageSrc={volcanoImgSource}
					anchor={volcanoAnchor}
					iconScale={4}
				/>
				<IconOverlay
					ref={waterfallRefCallback}
					imageSrc="/src/assets/waterfall.svg"
					stageRef={stageRef}
					anchor={{ x: 650, y: 985 }}
					iconScale={4}
				/>
                <IconOverlay
                    ref={caveRefCallback}
                    imageSrc="/src/assets/cave.svg"
                    stageRef={stageRef}
                    anchor={{ x: 108, y: 413 }}
					iconScale={4}
				/>
			</Layer>
		</Stage>
	);
};
