import React from 'react';
import { Circle } from 'react-konva';
import type { Stage as StageType } from 'konva/lib/Stage';

type Item = { id: string; anchor: { x: number; y: number }; color?: { r: number; g: number; b: number } };

type Props = {
  items: Item[];
  // optional stage ref so circles can adapt stroke width to current scale
  stageRef?: React.RefObject<StageType | null>;
};

/**
 * Render map-space circles for each item that has a stored radius in localStorage.
 * Stored value is expected to be map pixels (so the circle scales with the map).
 */
export const MapCircles: React.FC<Props> = ({ items, stageRef }) => {
  return (
    <>
      {items.map((it) => {
        const raw = localStorage.getItem(`icon:${it.id}`);
        if (!raw) return null;
        const n = Number(raw);
        if (!isFinite(n) || n <= 0) return null;
        const mapRadius = n * 20;
        const colorStr = it.color ? `rgb(${it.color.r},${it.color.g},${it.color.b})` : 'rgba(255,0,0,0.9)';
        // compute stroke width so that it decreases as we zoom in (i.e., as stage scale increases)
        const stageScale = stageRef && stageRef.current ? (stageRef.current.scaleX() || 1) : 1;
        // base stroke width in screen pixels when scale === 1
        const baseStroke = 2;
        // inverse scale so zooming in (scale>1) makes stroke thinner
        const strokeW = baseStroke / stageScale;

        return (
          <Circle
            key={`circle-${it.id}`}
            x={it.anchor.x}
            y={it.anchor.y}
            radius={mapRadius}
            stroke={colorStr}
            strokeWidth={strokeW}
            listening={false}
          />
        );
      })}
    </>
  );
};

export default MapCircles;
