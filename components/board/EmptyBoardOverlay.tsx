import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/constants/theme';

export function EmptyBoardOverlay() {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <Text style={[typography.subheading, { textAlign: 'center' }]}>No dates yet</Text>
      <Text style={[typography.body, { textAlign: 'center', marginTop: 8, color: colors.textSecondary }]}>
        Tap + Add to get started 💝
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(13,0,26,0.7)',
    padding: 24,
  },
});
