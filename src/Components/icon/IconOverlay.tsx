import React, { forwardRef, useImperativeHandle, useRef, useCallback } from 'react';
import { Group, Image, Line, Rect } from 'react-konva';
import type Konva from 'konva';
import type { Stage as StageType } from 'konva/lib/Stage';
import { useImage } from 'react-konva-utils';

export type IconProps = {
  stageRef: React.RefObject<StageType | null>;
  imageSrc: string;
  anchor: { x: number; y: number };
  yOffset?: number;
  boxPadding?: number;
  boxCorner?: number;
  boxShadow?: boolean;
  scaleMode?: 'screen' | 'map'; // screen = fixed pixel size, map = scales with map
  iconScale?: number; // multiplier for icon size (default 1)
  maxSize?: number; // optional maximum on-screen size in pixels (width)
};

export const IconOverlay = forwardRef<{ update: () => void } | null, IconProps>(
  (
    {
      stageRef,
      imageSrc,
      anchor,
      yOffset = 24,
      boxPadding = 8,
      boxCorner = 8,
      boxShadow = true,
      scaleMode = 'screen',
      iconScale = 1,
      maxSize = 75,
    },
    ref
  ) => {
    const [image] = useImage(imageSrc);
    const groupRef = useRef<Konva.Group | null>(null);
    // base size used for drawing and positioning (image pixels * iconScale)
    const baseSize = { width: (image?.width ?? 96) * iconScale, height: (image?.height ?? 64) * iconScale };

    const update = useCallback(() => {
      const stage = stageRef.current;
      const group = groupRef.current;
      if (!stage || !group) return;

  const baseWidth = (image?.width ?? 96) * iconScale;

      if (scaleMode === 'screen') {
        const transform = stage.getAbsoluteTransform();
        const pt = transform.point({ x: anchor.x, y: anchor.y });
        // Konva.Group has absolutePosition in runtime; use it if available
        type HasAbsolute = { absolutePosition?: (p: { x: number; y: number }) => void };
        const maybe = group as unknown as HasAbsolute;
        if (typeof maybe.absolutePosition === 'function') {
          maybe.absolutePosition({ x: pt.x, y: pt.y });
        } else {
          group.position({ x: pt.x, y: pt.y });
        }

        const s = stage.scaleX() || 1;
        const inv = 1 / s;

        // default scale to keep icon screen-sized
        let finalScale = inv;
        if (typeof maxSize === 'number' && baseWidth > 0) {
          const onScreenWidth = baseWidth * inv;
          if (onScreenWidth > maxSize) {
            finalScale = maxSize / baseWidth;
          }
        }

        group.scale({ x: finalScale, y: finalScale });
      } else {
        group.position({ x: anchor.x, y: anchor.y });
        const stageScale = stage.scaleX() || 1;
        let finalScale = 1;
        if (typeof maxSize === 'number' && baseWidth > 0) {
          const onScreenWidth = baseWidth * stageScale;
          if (onScreenWidth > maxSize) {
            finalScale = maxSize / onScreenWidth;
          }
        }
        group.scale({ x: finalScale, y: finalScale });
      }

      const layer = group.getLayer && group.getLayer();
      if (layer && layer.batchDraw) layer.batchDraw();
  }, [stageRef, anchor.x, anchor.y, scaleMode, image, iconScale, maxSize]);

    useImperativeHandle(ref, () => ({ update }), [update]);

    return (
      <Group ref={groupRef} x={0} y={0} onClick={() => {window.alert('Icon clicked!')}}
>
        <Rect
          x={-baseSize.width / 2 - boxPadding}
          y={-baseSize.height - yOffset - boxPadding}
          width={baseSize.width + boxPadding * 2}
          height={baseSize.height + boxPadding * 2}
          fill="#fff"
          cornerRadius={boxCorner}
          shadowColor={boxShadow ? '#000' : undefined}
          shadowBlur={boxShadow ? 12 : 0}
          shadowOpacity={boxShadow ? 0.25 : 0}
          shadowOffset={boxShadow ? { x: 0, y: 4 } : undefined}
        />
        <Image
          image={image}
          x={-baseSize.width / 2}
          y={-baseSize.height - yOffset}
          width={baseSize.width}
          height={baseSize.height}
        />
        <Line points={[-8, -8, 8, 8]} stroke="red" strokeWidth={3} lineCap="round" />
        <Line points={[-8, 8, 8, -8]} stroke="red" strokeWidth={3} lineCap="round" />
      </Group>
    );
  }
);

export default IconOverlay;
