import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useRef, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { datePeople } from '@/db/schema';
import { useBoardStore } from '@/store/boardStore';
import { logDate } from '@/services/board';
import { colors, typography } from '@/constants/theme';

export function EliminateSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  const {
    showingEliminateSheet,
    closeEliminateSheet,
    selectedPersonId,
    selectPerson,
    setMoveResult,
  } = useBoardStore();
  const snapPoints = useMemo(() => ['50%'], []);

  const [farewellNote, setFarewellNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: people = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.id, selectedPersonId ?? '')),
    [selectedPersonId],
  );
  const person = people[0];

  useEffect(() => {
    if (showingEliminateSheet) {
      sheetRef.current?.expand();
      setFarewellNote('');
    } else {
      sheetRef.current?.close();
    }
  }, [showingEliminateSheet]);

  const handleConfirm = async () => {
    if (!selectedPersonId || saving) return;
    setSaving(true);
    try {
      const result = await logDate(selectedPersonId, 'eliminate', farewellNote.trim());
      closeEliminateSheet();
      selectPerson(null); // also close DateProfileSheet
      setMoveResult(result);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={closeEliminateSheet}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView style={styles.content}>
        <Text style={typography.subheading}>Eliminate {person?.name}?</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 8, marginBottom: 16 }]}>
          They'll be removed from the board permanently.
        </Text>

        <BottomSheetTextInput
          style={styles.input}
          placeholder="Farewell note (optional)"
          placeholderTextColor={colors.textSecondary}
          value={farewellNote}
          onChangeText={setFarewellNote}
          multiline
        />

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={saving}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
            {saving ? 'Eliminating...' : 'Eliminate 💀'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={closeEliminateSheet}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>Cancel</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20 },
  input: { backgroundColor: '#2a0045', color: colors.text, borderRadius: 10, padding: 12, marginBottom: 16, minHeight: 80, textAlignVertical: 'top' },
  confirmBtn: { backgroundColor: '#4a0020', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
});
