import { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { useBoardStore } from '@/store/boardStore';
import { BoardPathView } from '@/components/board/BoardPathView';

export default function BoardScreen() {
  const openAddSheet = useBoardStore((s) => s.openAddSheet);
  const selectPerson = useBoardStore((s) => s.selectPerson);
  const openLogSheet = useBoardStore((s) => s.openLogSheet);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  const handlePieceTap = (personId: string) => {
    selectPerson(personId);
    openLogSheet();
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={typography.heading}>💝 Game of Love</Text>
        <TouchableOpacity onPress={openAddSheet} style={styles.addBtn}>
          <Text style={[typography.body, { color: colors.accent }]}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.board} onLayout={onBoardLayout}>
        {boardSize.width > 0 && (
          <BoardPathView
            width={boardSize.width}
            height={boardSize.height}
            people={[]}
            onPieceTap={handlePieceTap}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  addBtn: { padding: 8 },
  board: { flex: 1 },
});
