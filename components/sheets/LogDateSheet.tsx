import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useRef, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { datePeople } from '@/db/schema';
import { useBoardStore } from '@/store/boardStore';
import { logDate } from '@/services/board';
import { colors, typography } from '@/constants/theme';
import type { Vibe } from '@/types';

const VIBES: { vibe: Vibe; emoji: string; label: string }[] = [
  { vibe: 'fire',      emoji: '🔥', label: 'Fire' },
  { vibe: 'good',      emoji: '😊', label: 'Good' },
  { vibe: 'meh',       emoji: '😐', label: 'Meh' },
  { vibe: 'stay',      emoji: '😬', label: 'Stay' },
  { vibe: 'ouch',      emoji: '💔', label: 'Ouch' },
  { vibe: 'eliminate', emoji: '💀', label: 'Drop' },
];

export function LogDateSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  const { showingLogSheet, closeLogSheet, selectedPersonId, setMoveResult, selectPerson, invalidateBoard } = useBoardStore();
  const snapPoints = useMemo(() => ['80%'], []);

  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (showingLogSheet) {
      sheetRef.current?.expand();
      setSelectedVibe(null);
      setNote('');
    } else {
      sheetRef.current?.close();
    }
  }, [showingLogSheet]);

  const { data: people = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.id, selectedPersonId ?? '')),
    [selectedPersonId],
  );
  const person = people[0];

  const handleSave = async () => {
    if (!selectedVibe || !selectedPersonId || saving) return;
    setSaving(true);
    try {
      const result = logDate(selectedPersonId, selectedVibe, note);
      invalidateBoard();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      closeLogSheet();
      selectPerson(null);
      setTimeout(() => setMoveResult(result), 700);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e?.message ?? String(e));
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
      onClose={closeLogSheet}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView style={styles.content}>
        <Text style={typography.subheading}>
          How'd it go with {person?.name ?? '...'}?
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          {new Date().toLocaleDateString()}
        </Text>

        <BottomSheetTextInput
          style={styles.noteInput}
          placeholder="Add a note... (optional)"
          placeholderTextColor={colors.textSecondary}
          multiline
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.vibeGrid}>
          {VIBES.map(({ vibe, emoji, label }) => (
            <TouchableOpacity
              key={vibe}
              style={[styles.vibeCell, selectedVibe === vibe && { borderColor: colors.accent, borderWidth: 2 }]}
              onPress={() => setSelectedVibe(vibe)}
            >
              <Text style={{ fontSize: 28 }}>{emoji}</Text>
              <Text style={typography.caption}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !selectedVibe && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!selectedVibe || saving}
        >
          <Text style={[typography.body, { color: colors.bg, fontWeight: '700' }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20 },
  noteInput: { backgroundColor: '#2a0045', color: colors.text, borderRadius: 10, padding: 12, marginTop: 16, minHeight: 80, textAlignVertical: 'top' },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  vibeCell: { width: '30%', aspectRatio: 1, backgroundColor: '#2a0045', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
});
