import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { db } from '@/db/client';
import { dateEntries, datePeople } from '@/db/schema';
import { useBoardStore } from '@/store/boardStore';
import { colors, typography } from '@/constants/theme';

const VIBE_EMOJI: Record<string, string> = {
  fire: '🔥', good: '😊', meh: '😐', stay: '😬', ouch: '💔', eliminate: '💀',
};

export function DateHistoryView() {
  const sheetRef = useRef<BottomSheet>(null);
  const { showingHistorySheet, closeHistorySheet, selectedPersonId } = useBoardStore();
  const snapPoints = useMemo(() => ['90%'], []);

  const { data: people = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.id, selectedPersonId ?? '')),
    [selectedPersonId],
  );
  const person = people[0];

  const { data: entries = [] } = useLiveQuery(
    db.select().from(dateEntries)
      .where(eq(dateEntries.personId, selectedPersonId ?? ''))
      .orderBy(desc(dateEntries.loggedAt)),
    [selectedPersonId],
  );

  useEffect(() => {
    if (showingHistorySheet) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [showingHistorySheet]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={closeHistorySheet}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <View style={styles.titleBar}>
        <Text style={typography.subheading}>{person?.name}'s History</Text>
      </View>
      <BottomSheetFlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={{ fontSize: 24, width: 36 }}>{VIBE_EMOJI[item.vibe]}</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={typography.body}>{item.note || '—'}</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {item.loggedAt ? format(item.loggedAt, 'PPP') : ''}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  titleBar: { paddingHorizontal: 20, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.textSecondary },
});
