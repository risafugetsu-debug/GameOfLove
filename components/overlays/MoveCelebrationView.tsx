import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useBoardStore } from '@/store/boardStore';
import { colors, typography } from '@/constants/theme';

export function MoveCelebrationView() {
  const { moveResult, setMoveResult } = useBoardStore();
  const confettiRef = useRef<any>(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (moveResult) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      if (moveResult.isTheOne) confettiRef.current?.start();
      const timer = setTimeout(() => dismiss(), 3000);
      return () => clearTimeout(timer);
    }
  }, [moveResult]);

  const dismiss = () => {
    Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setMoveResult(null);
    });
  };

  if (!moveResult) return null;

  const { personName, delta, newPosition, milestone, isEliminated, isTheOne } = moveResult;

  let headline = '';
  let subtext = '';
  let showProgress = false;

  if (isEliminated) {
    headline = `${personName} is off the board 💀`;
  } else if (isTheOne) {
    headline = `You found The One! 💝`;
    subtext = `${personName} made it! 🎉`;
  } else if (delta === 0) {
    headline = `${personName} stayed put 😬`;
  } else if (delta! > 0) {
    headline = `${personName} moved up ${delta}! 🔥`;
    showProgress = true;
  } else {
    headline = `${personName} moved back ${Math.abs(delta!)} 💔`;
    showProgress = true;
  }

  const progress = newPosition !== null ? Math.round((newPosition / 30) * 100) : 0;

  return (
    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={dismiss}>
      <Animated.View style={[styles.overlay, { opacity }, isEliminated && styles.dimmed]}>
        <Text style={[typography.heading, { textAlign: 'center', marginBottom: 8 }]}>
          {headline}
        </Text>
        {subtext !== '' && (
          <Text style={[typography.subheading, { textAlign: 'center', marginBottom: 16 }]}>
            {subtext}
          </Text>
        )}
        {milestone && !isEliminated && (
          <Text style={[typography.body, { textAlign: 'center', color: colors.accent, marginBottom: 12 }]}>
            You hit {milestone.emoji} {milestone.name}! ✨
          </Text>
        )}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
            <Text style={[typography.caption, { marginTop: 6, color: colors.textSecondary }]}>
              {progress}% toward The One
            </Text>
          </View>
        )}
      </Animated.View>
      {isTheOne && (
        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: 0, y: 0 }}
          autoStart={false}
          colors={['#ff6eb4', '#c77dff', '#ffd60a', '#90e0ef']}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(13,0,26,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dimmed: { backgroundColor: 'rgba(13,0,26,0.97)' },
  progressContainer: { width: '80%', alignItems: 'center' },
  progressBar: { height: 8, backgroundColor: colors.accent, borderRadius: 4, alignSelf: 'flex-start' },
});
