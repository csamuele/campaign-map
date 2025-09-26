import React from 'react';
import { Circle } from 'react-konva';

type Item = { id: string; anchor: { x: number; y: number }; color?: { r: number; g: number; b: number } };

type Props = {
  items: Item[];
};

/**
 * Render map-space circles for each item that has a stored radius in localStorage.
 * Stored value is expected to be map pixels (so the circle scales with the map).
 */
export const MapCircles: React.FC<Props> = ({ items }) => {
  return (
    <>
      {items.map((it) => {
        const raw = localStorage.getItem(`icon:${it.id}`);
        if (!raw) return null;
        const n = Number(raw);
        if (!isFinite(n) || n <= 0) return null;
        const mapRadius = n * 20;
        const colorStr = it.color ? `rgb(${it.color.r},${it.color.g},${it.color.b})` : 'rgba(255,0,0,0.9)';
        return (
          <Circle
            key={`circle-${it.id}`}
            x={it.anchor.x}
            y={it.anchor.y}
            radius={mapRadius}
            stroke={colorStr}
            strokeWidth={2}
            listening={false}
          />
        );
      })}
    </>
  );
};

export default MapCircles;
