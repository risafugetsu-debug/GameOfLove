import { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { colors, typography } from '@/constants/theme';
import { db } from '@/db/client';
import { datePeople } from '@/db/schema';
import { useBoardStore } from '@/store/boardStore';
import { BoardPathView } from '@/components/board/BoardPathView';
import { DateChipRow } from '@/components/board/DateChipRow';
import { EmptyBoardOverlay } from '@/components/board/EmptyBoardOverlay';
import { DateProfileSheet } from '@/components/sheets/DateProfileSheet';

export default function BoardScreen() {
  const openAddSheet = useBoardStore((s) => s.openAddSheet);
  const selectPerson = useBoardStore((s) => s.selectPerson);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  const { data: activePeople = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.isEliminated, false))
  );

  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
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
                people={activePeople}
                onPieceTap={selectPerson}
              />
            )}
            {activePeople.length === 0 && <EmptyBoardOverlay />}
          </View>
          <DateChipRow people={activePeople} onPress={selectPerson} />
          <DateProfileSheet />
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  addBtn: { padding: 8 },
  board: { flex: 1 },
});
