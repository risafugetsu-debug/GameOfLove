import { Canvas, Path, Skia, BlurMask, Circle } from '@shopify/react-native-skia';
import { Fragment, useMemo } from 'react';
import { Text, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { colors, MILESTONES } from '@/constants/theme';
import type { Milestone } from '@/types';
import { sectionCenter } from '@/helpers/board';
import { PieceView } from './PieceView';

interface PersonOnBoard {
  id: string;
  position: number;
  colorHex: string;
  photoData: string | null;
  isFavorite: boolean;
  name: string;
}

interface Props {
  width: number;
  height: number;
  people: PersonOnBoard[];
  onPieceTap: (personId: string) => void;
  onMilestoneTap: (milestone: Milestone) => void;
}

const MILESTONE_SET = new Set(MILESTONES.map((m) => m.position));

function buildConnectorPath(width: number, height: number) {
  // Thin line connecting pos1 → pos30; START (pos0) is a detached circle.
  const points = Array.from({ length: 31 }, (_, i) => sectionCenter(i, width, height));
  const path = Skia.Path.Make();
  path.moveTo(points[1].x, points[1].y);
  for (let i = 2; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const prevRow = Math.floor((i - 2) / 6);
    const currRow = Math.floor((i - 1) / 6);
    if (currRow !== prevRow) {
      const cpx = curr.x;
      const cpy = prev.y + (curr.y - prev.y) * 0.5;
      path.cubicTo(prev.x, cpy, cpx, cpy, curr.x, curr.y);
    } else {
      path.lineTo(curr.x, curr.y);
    }
  }
  return path;
}

export function BoardPathView({ width, height, people, onPieceTap, onMilestoneTap }: Props) {
  const connectorPath = useMemo(() => buildConnectorPath(width, height), [width, height]);

  const spaces = useMemo(
    () =>
      Array.from({ length: 31 }, (_, i) => ({
        pos: i,
        ...sectionCenter(i, width, height),
        isMilestone: MILESTONE_SET.has(i),
        isStart: i === 0,
      })),
    [width, height],
  );

  const hitAreas = useMemo(
    () =>
      people.map((person, staggerIdx) => {
        const pt = sectionCenter(person.position, width, height);
        const samePosBefore = people.slice(0, staggerIdx).filter(
          (p) => p.position === person.position,
        );
        return { id: person.id, cx: pt.x + samePosBefore.length * 8, cy: pt.y };
      }),
    [people, width, height],
  );

  const milestoneCenters = useMemo(
    () => MILESTONES.map((m) => ({ milestone: m, ...sectionCenter(m.position, width, height) })),
    [width, height],
  );

  const tap = Gesture.Tap().onEnd((e) => {
    'worklet';
    const { x, y } = e;
    for (let i = 0; i < hitAreas.length; i++) {
      const { id, cx, cy } = hitAreas[i];
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= 20) {
        runOnJS(onPieceTap)(id);
        return;
      }
    }
  });

  const milestoneTap = Gesture.Tap().onEnd((e) => {
    'worklet';
    const { x, y } = e;
    for (let i = 0; i < milestoneCenters.length; i++) {
      const { milestone, x: cx, y: cy } = milestoneCenters[i];
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= 20) {
        runOnJS(onMilestoneTap)(milestone);
        return;
      }
    }
  });

  const gesture = Gesture.Exclusive(milestoneTap, tap);

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }}>
        <Canvas style={{ width, height }}>
          {/* Subtle ambient glow on the connector */}
          <Path
            path={connectorPath}
            color="rgba(255,105,180,0.18)"
            style="stroke"
            strokeWidth={22}
          >
            <BlurMask blur={8} style="normal" />
          </Path>
          {/* Thin connector line between spaces */}
          <Path
            path={connectorPath}
            color="rgba(139,26,74,0.65)"
            style="stroke"
            strokeWidth={3}
            strokeCap="round"
            strokeJoin="round"
          />

          {/* Space circles */}
          {spaces.map(({ pos, x, y, isMilestone, isStart }) => {
            const r = isMilestone ? 16 : 13;
            const fill = isStart ? colors.accent
              : isMilestone ? '#1a0030'
              : '#f0c8dc';
            const border = isStart ? '#ffffff'
              : isMilestone ? colors.accent
              : colors.roadBorder;
            const bw = isMilestone ? 2.5 : 2;
            return (
              <Fragment key={pos}>
                {/* drop shadow */}
                <Circle cx={x} cy={y + 2.5} r={r} color="rgba(0,0,0,0.28)" />
                {/* fill */}
                <Circle cx={x} cy={y} r={r} color={fill} />
                {/* border */}
                <Circle cx={x} cy={y} r={r} color={border} style="stroke" strokeWidth={bw} />
              </Fragment>
            );
          })}
        </Canvas>

        {/* Milestone emoji overlays — centered on their circles */}
        {MILESTONES.map((m) => {
          const pt = sectionCenter(m.position, width, height);
          return (
            <View
              key={m.position}
              style={{
                position: 'absolute',
                left: pt.x - 16,
                top: pt.y - 16,
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 13 }}>{m.emoji}</Text>
            </View>
          );
        })}

        {people.map((person, idx) => {
          const staggerIndex = people
            .slice(0, idx)
            .filter((p) => p.position === person.position).length;
          return (
            <PieceView
              key={person.id}
              personId={person.id}
              position={person.position}
              colorHex={person.colorHex}
              photoData={person.photoData}
              isFavorite={person.isFavorite}
              staggerIndex={staggerIndex}
              canvasWidth={width}
              canvasHeight={height}
            />
          );
        })}
      </View>
    </GestureDetector>
  );
}
