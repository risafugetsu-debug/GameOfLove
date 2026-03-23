import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { sectionCenter } from '@/helpers/board';

interface Props {
  personId: string;
  position: number;
  colorHex: string;
  photoData: string | null;
  staggerIndex: number;   // 0-based among pieces sharing same section
  canvasWidth: number;
  canvasHeight: number;
  isNew?: boolean;        // true on first render → fade in
}

const PIECE_RADIUS = 20;

export function PieceView({
  position, colorHex, photoData, staggerIndex, canvasWidth, canvasHeight, isNew,
}: Props) {
  const center = sectionCenter(position, canvasWidth, canvasHeight);
  const targetX = center.x + staggerIndex * 8 - PIECE_RADIUS;
  const targetY = center.y - PIECE_RADIUS;

  const x = useSharedValue(targetX);
  const y = useSharedValue(targetY);
  const opacity = useSharedValue(isNew ? 0 : 1);

  useEffect(() => {
    x.value = withSpring(targetX);
    y.value = withSpring(targetY);
  }, [targetX, targetY]);

  useEffect(() => {
    if (isNew) opacity.value = withTiming(1, { duration: 300 });
  }, [isNew]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.piece, { width: PIECE_RADIUS * 2, height: PIECE_RADIUS * 2, borderRadius: PIECE_RADIUS, backgroundColor: colorHex, position: 'absolute', top: 0, left: 0 }, animStyle]}>
      {photoData ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${photoData}` }}
          style={{ width: PIECE_RADIUS * 2, height: PIECE_RADIUS * 2, borderRadius: PIECE_RADIUS }}
        />
      ) : (
        <Text style={styles.emoji}>🧑</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  emoji: { fontSize: 18 },
});
