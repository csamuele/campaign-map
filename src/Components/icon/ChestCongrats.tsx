import React, { useEffect, useRef } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import type { Stage as StageType } from 'konva/lib/Stage';
import Konva from 'konva';

type Props = {
  stageRef: React.RefObject<StageType | null>;
  anchor: { x: number; y: number };
  visible: boolean;
  onClose?: () => void;
  // offset in screen pixels from the anchor point
  offset?: { x: number; y: number };
};

const ChestCongrats: React.FC<Props> = ({ stageRef, anchor, visible, offset = { x: 0, y: 0 } }) => {
  const groupRef = useRef<Konva.Group | null>(null);
    const stageScale = stageRef.current?.scaleX() || 1;
  useEffect(() => {
    const stage = stageRef.current;
    const group = groupRef.current;
    if (!stage || !group) return;


    // position the group in screen coordinates near the anchor
    const transform = stage.getAbsoluteTransform();
    const pt = transform.point({ x: anchor.x, y: anchor.y });
    // prefer absolutePosition when available (keeps correct coords regardless of transforms)
    type HasAbsolute = { absolutePosition?: (p: { x: number; y: number }) => void };
    const maybe = group as unknown as HasAbsolute;
    if (typeof maybe.absolutePosition === 'function') {
      maybe.absolutePosition({ x: pt.x + offset.x, y: pt.y + offset.y });
    } else {
      group.position({ x: pt.x + offset.x, y: pt.y + offset.y });
    }
    // bring to front / redraw
    const layer = group.getLayer && group.getLayer();
    if (layer && layer.batchDraw) layer.batchDraw();

    // entrance scale animation when shown
    let tween: Konva.Tween | null = null;
    if (visible) {
      // start slightly smaller and pop to full size
      group.scale({ x: 0.6, y: 0.6 });
      tween = new Konva.Tween({ node: group, duration: 0.3, scaleX: 1, scaleY: 1 });
      tween.play();
    }
    return () => {
      if (tween) {
        tween.pause();
        tween.destroy();
      }
    };
  }, [stageRef, anchor.x, anchor.y, offset.x, offset.y, visible]);

  if (!visible) return null;

  return (
    <Group ref={groupRef} listening>
      {/* stylized gold callout with shadow */}
      <Rect
        x={10}
        y={-10}
        width={260}
        height={100}
        cornerRadius={12}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 260, y: 90 }}
        fillLinearGradientColorStops={[0, '#fff8e1', 0.5, '#ffe082', 1, '#ffd54f']}
        shadowColor="#000"
        shadowBlur={12}
        shadowOpacity={0.25}
      />
      <Circle x={0} y={0} radius={8 / stageScale} fill="#ffd54f" />
      <Text x={20} y={12} text={'Congratulations!'} fontStyle={'bold'} fontSize={16} fill={'#4a2f00'} />
      <Text
        x={20}
        y={36}
        width={220}
        text={'You found the location of the leviathan skin cache. You must be quick to get there before the Harbingers'}
        fontSize={13}
        fill={'#3e2723'}
      />
    
    </Group>
  );
};

export default ChestCongrats;
