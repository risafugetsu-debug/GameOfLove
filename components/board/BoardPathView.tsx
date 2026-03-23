import { Canvas, Path, Skia, BlurMask, Circle } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { colors, MILESTONES } from '@/constants/theme';
import { sectionCenter } from '@/helpers/board';
import { PieceView } from './PieceView';

interface PersonOnBoard {
  id: string;
  position: number;
  colorHex: string;
  photoData: string | null;
  name: string;
}

interface Props {
  width: number;
  height: number;
  people: PersonOnBoard[];
  onPieceTap: (personId: string) => void;
}

function buildRoadPath(width: number, height: number) {
  const points = Array.from({ length: 31 }, (_, i) => sectionCenter(i, width, height));
  const path = Skia.Path.Make();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    // Match sectionCenter's model: positions 1–6 → row 0, 7–12 → row 1, etc.
    // Position 0 is START (treated as row 0).
    const prevRow = i <= 1 ? 0 : Math.floor((i - 2) / 6);
    const currRow = Math.floor((i - 1) / 6);
    if (currRow !== prevRow) {
      // U-turn: cubic bezier
      const cpx = curr.x;
      const cpy = prev.y + (curr.y - prev.y) * 0.5;
      path.cubicTo(prev.x, cpy, cpx, cpy, curr.x, curr.y);
    } else {
      path.lineTo(curr.x, curr.y);
    }
  }
  return path;
}

export function BoardPathView({ width, height, people, onPieceTap }: Props) {
  const roadPath = useMemo(() => buildRoadPath(width, height), [width, height]);

  const tap = Gesture.Tap().onEnd((e) => {
    'worklet';
    const { x, y } = e;
    for (let staggerIdx = 0; staggerIdx < people.length; staggerIdx++) {
      const person = people[staggerIdx];
      const pt = sectionCenter(person.position, width, height);
      // People at the same position are staggered by 8px each
      const samePosBefore = people.slice(0, staggerIdx).filter(
        (p) => p.position === person.position,
      );
      const offsetX = samePosBefore.length * 8;
      const cx = pt.x + offsetX;
      const cy = pt.y;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= 20) {
        runOnJS(onPieceTap)(person.id);
        return;
      }
    }
  });

  return (
    <GestureDetector gesture={tap}>
      <View style={{ width, height }}>
        <Canvas style={{ width, height }}>
          {/* Glow layer */}
          <Path
            path={roadPath}
            color="rgba(255,105,180,0.2)"
            style="stroke"
            strokeWidth={50}
          >
            <BlurMask blur={15} style="normal" />
          </Path>
          {/* Border */}
          <Path
            path={roadPath}
            color={colors.roadBorder}
            style="stroke"
            strokeWidth={36}
            strokeCap="round"
            strokeJoin="round"
          />
          {/* Surface */}
          <Path
            path={roadPath}
            color={colors.roadSurface}
            style="stroke"
            strokeWidth={26}
            strokeCap="round"
            strokeJoin="round"
          />
          {/* Milestone circles */}
          {MILESTONES.map((m) => {
            const pt = sectionCenter(m.position, width, height);
            return <Circle key={m.position} cx={pt.x} cy={pt.y} r={14} color="#3d0030" />;
          })}
        </Canvas>
        {/* Emoji overlays (Skia can't render emoji) */}
        {MILESTONES.map((m) => {
          const pt = sectionCenter(m.position, width, height);
          return (
            <Text
              key={m.position}
              style={{
                position: 'absolute',
                left: pt.x - 12,
                top: pt.y - 28,
                fontSize: 18,
              }}
            >
              {m.emoji}
            </Text>
          );
        })}
        {people.map((person) => {
          const staggerIndex = people
            .filter((p) => p.position === person.position)
            .indexOf(person);
          return (
            <PieceView
              key={person.id}
              personId={person.id}
              position={person.position}
              colorHex={person.colorHex}
              photoData={person.photoData}
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
