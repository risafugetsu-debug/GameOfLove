import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useRef, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
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
  { vibe: 'fire',  emoji: '🔥', label: 'Fire' },
  { vibe: 'good',  emoji: '😊', label: 'Good' },
  { vibe: 'meh',   emoji: '😐', label: 'Meh' },
  { vibe: 'stay',  emoji: '😬', label: 'Stay' },
  { vibe: 'ouch',  emoji: '💔', label: 'Ouch' },
];

interface Props {
  isVisible: boolean;
  onClose: () => void;
}

export function MilestoneJumpSheet({ isVisible, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { selectedMilestone, setMoveResult, invalidateBoard } = useBoardStore();
  const snapPoints = useMemo(() => ['85%'], []);

  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<Vibe | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: activePeople = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.isEliminated, false)),
    [],
  );

  const eligiblePlayers = selectedMilestone
    ? activePeople.filter((p) => p.position < selectedMilestone.position)
    : [];

  // Reset state on open or milestone change
  useEffect(() => {
    if (isVisible) {
      setSelectedPersonId(eligiblePlayers.length === 1 ? eligiblePlayers[0].id : null);
      setSelectedVibe(null);
      setNote('');
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [isVisible, selectedMilestone?.position, eligiblePlayers.length]);

  const handleSave = async () => {
    if (!selectedPersonId || !selectedVibe || !selectedMilestone || saving) return;
    setSaving(true);
    try {
      const result = logDate(selectedPersonId, selectedVibe, note, selectedMilestone.position);
      invalidateBoard();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      setTimeout(() => setMoveResult(result), 700);
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  };

  if (!selectedMilestone) return null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView style={styles.content}>
        {/* Milestone header */}
        <Text style={styles.milestoneEmoji}>{selectedMilestone.emoji}</Text>
        <Text style={typography.subheading}>{selectedMilestone.name}</Text>
        <Text style={[typography.caption, styles.description]}>{selectedMilestone.description}</Text>

        <View style={styles.divider} />

        {/* Player picker */}
        <Text style={[typography.caption, styles.sectionLabel]}>Who reached this?</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {activePeople.map((person) => {
            const eligible = person.position < selectedMilestone.position;
            const selected = selectedPersonId === person.id;
            return (
              <TouchableOpacity
                key={person.id}
                style={[
                  styles.chip,
                  selected && { borderColor: colors.accent, borderWidth: 2 },
                  !eligible && styles.chipDisabled,
                ]}
                onPress={() => eligible && setSelectedPersonId(person.id)}
                disabled={!eligible}
              >
                <View style={[styles.chipDot, { backgroundColor: person.colorHex }]} />
                <Text style={[styles.chipName, !eligible && { color: colors.textSecondary }]}>
                  {person.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Vibe picker */}
        <Text style={[typography.caption, styles.sectionLabel]}>How did it go?</Text>
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

        {/* Note input */}
        <BottomSheetTextInput
          style={styles.noteInput}
          placeholder="Add a note... (optional)"
          placeholderTextColor={colors.textSecondary}
          multiline
          value={note}
          onChangeText={setNote}
        />

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, (!selectedPersonId || !selectedVibe) && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!selectedPersonId || !selectedVibe || saving}
        >
          <Text style={[typography.body, { color: colors.bg, fontWeight: '700' }]}>
            {saving ? 'Saving...' : `${selectedMilestone.emoji} Log & Jump to ${selectedMilestone.name}`}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content:         { flex: 1, padding: 20 },
  milestoneEmoji:  { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  description:     { color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  divider:         { height: 1, backgroundColor: '#2a0050', marginVertical: 16 },
  sectionLabel:    { color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  chipRow:         { flexDirection: 'row', marginBottom: 16 },
  chip:            { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2a0045', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  chipDisabled:    { opacity: 0.4 },
  chipDot:         { width: 10, height: 10, borderRadius: 5 },
  chipName:        { color: colors.text, fontSize: 14 },
  vibeGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  vibeCell:        { width: '18%', aspectRatio: 1, backgroundColor: '#2a0045', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  noteInput:       { backgroundColor: '#2a0045', color: colors.text, borderRadius: 10, padding: 12, minHeight: 60, textAlignVertical: 'top', marginBottom: 16 },
  saveBtn:         { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
});
