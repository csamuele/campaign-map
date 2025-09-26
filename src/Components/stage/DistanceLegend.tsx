import React from 'react';

type Props = {
  distances: Record<string, number>;
  pointerMap?: { x: number; y: number } | null;
};

export const DistanceLegend: React.FC<Props> = ({ distances, pointerMap }) => {
  return (
    <div style={{
      position: 'fixed',
      left: 12,
      right: 12,
      bottom: 12,
      // Allow pointer events to pass through so Konva canvas underneath remains clickable
      pointerEvents: 'none',
      background: 'rgba(0,0,0,0.6)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: 8,
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      zIndex: 9999,
    }}>
      {['volcano','waterfall','cave'].map((id) => (
        <div key={id} style={{ minWidth: 120, pointerEvents: 'auto' }}>
          <strong>{id}</strong>: {distances[id] ?? '—'} px
        </div>
      ))}
      {/* pointer map coordinates */}
      <div style={{ minWidth: 180, textAlign: 'right', pointerEvents: 'auto' }}>
        <strong>Mouse (map):</strong>{' '}
        {pointerMap ? `${Math.round(pointerMap.x)}, ${Math.round(pointerMap.y)} px` : '—'}
      </div>
    </div>
  );
};

export default DistanceLegend;
