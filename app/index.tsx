import { SafeAreaView, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { useBoardStore } from '@/store/boardStore';

export default function BoardScreen() {
  const openAddSheet = useBoardStore((s) => s.openAddSheet);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={typography.heading}>💝 Game of Love</Text>
        <TouchableOpacity onPress={openAddSheet} style={styles.addBtn}>
          <Text style={[typography.body, { color: colors.accent }]}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {/* BoardPathView and DateChipRow go here */}
      <View style={styles.board}>
        <Text style={[typography.caption, { textAlign: 'center' }]}>Board coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  addBtn: { padding: 8 },
  board: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
