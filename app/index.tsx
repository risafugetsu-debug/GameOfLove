import { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, StyleSheet, View, LayoutChangeEvent } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import * as Haptics from 'expo-haptics';
import { colors, typography } from '@/constants/theme';
import { db } from '@/db/client';
import { datePeople } from '@/db/schema';
import { useBoardStore } from '@/store/boardStore';
import { BoardPathView } from '@/components/board/BoardPathView';
import { DateChipRow } from '@/components/board/DateChipRow';
import { NeonTitle } from '@/components/board/NeonTitle';
import { EmptyBoardOverlay } from '@/components/board/EmptyBoardOverlay';
import { DateProfileSheet } from '@/components/sheets/DateProfileSheet';
import { LogDateSheet } from '@/components/sheets/LogDateSheet';
import { AddDateSheet } from '@/components/sheets/AddDateSheet';
import { EditPersonSheet } from '@/components/sheets/EditPersonSheet';
import { EliminateSheet } from '@/components/sheets/EliminateSheet';
import { DateHistoryView } from '@/components/sheets/DateHistoryView';
import { MoveCelebrationView } from '@/components/overlays/MoveCelebrationView';

export default function BoardScreen() {
  const openAddSheet = useBoardStore((s) => s.openAddSheet);
  const selectPerson = useBoardStore((s) => s.selectPerson);
  const boardVersion = useBoardStore((s) => s.boardVersion);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const insets = useSafeAreaInsets();

  const { data: activePeople = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.isEliminated, false)),
    [boardVersion]
  );

  const { data: eliminatedPeople = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.isEliminated, true)),
    [boardVersion]
  );

  const onBoardLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBoardSize({ width, height });
  };

  const handlePieceTap = (personId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    selectPerson(personId);
  };

  const handleAddPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openAddSheet();
  };

  const allPeople = [
    ...activePeople,
    ...eliminatedPeople,
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <SafeAreaView style={styles.root}>
          <View style={styles.header}>
            <NeonTitle>Game of Love</NeonTitle>
            <TouchableOpacity onPress={handleAddPress} style={styles.addBtn}>
              <Text style={[typography.body, { color: colors.accent }]}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.board} onLayout={onBoardLayout}>
            {boardSize.width > 0 && (
              <BoardPathView
                width={boardSize.width}
                height={boardSize.height}
                people={activePeople}
                onPieceTap={handlePieceTap}
              />
            )}
            {activePeople.length === 0 && <EmptyBoardOverlay />}
          </View>
          {allPeople.length > 0 && (
            <DateChipRow
              people={allPeople}
              onPress={(id) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                selectPerson(id);
              }}
            />
          )}
          <View style={styles.legalRow}>
            <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://risafugetsu-debug.github.io/GameOfLove/legal/')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalDot}>·</Text>
            <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync('https://risafugetsu-debug.github.io/GameOfLove/legal/')}>
              <Text style={styles.legalLink}>Terms & Conditions</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: insets.bottom }} />
          <DateProfileSheet />
          <LogDateSheet />
          <AddDateSheet />
          <EditPersonSheet />
          <EliminateSheet />
          <DateHistoryView />
        </SafeAreaView>
      </BottomSheetModalProvider>
      <MoveCelebrationView />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  addBtn: { padding: 8 },
  board: { flex: 1 },
  legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 8 },
  legalLink: { fontSize: 11, color: '#555', textDecorationLine: 'underline' },
  legalDot: { fontSize: 11, color: '#555' },
});
