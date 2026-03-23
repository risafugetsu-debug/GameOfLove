import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActionSheetIOS, Alert, StyleSheet, Image, Platform } from 'react-native';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq, desc } from 'drizzle-orm';
import { formatDistanceToNow } from 'date-fns';
import { db } from '@/db/client';
import { datePeople, dateEntries } from '@/db/schema';
import { useBoardStore } from '@/store/boardStore';
import { currentMilestoneLabel } from '@/helpers/board';
import { colors, typography } from '@/constants/theme';

const VIBE_EMOJI: Record<string, string> = {
  fire: '🔥', good: '😊', meh: '😐', stay: '😬', ouch: '💔', eliminate: '💀',
};

export function DateProfileSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  const {
    selectedPersonId,
    selectPerson,
    openLogSheet,
    openEditSheet,
    openHistorySheet,
    openEliminateSheet,
  } = useBoardStore();

  const snapPoints = useMemo(() => ['60%'], []);

  useEffect(() => {
    if (selectedPersonId) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [selectedPersonId]);

  const { data: people = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.id, selectedPersonId ?? '')),
    [selectedPersonId],
  );
  const person = people[0];

  const { data: recentEntries = [] } = useLiveQuery(
    db.select().from(dateEntries)
      .where(eq(dateEntries.personId, selectedPersonId ?? ''))
      .orderBy(desc(dateEntries.loggedAt))
      .limit(3),
    [selectedPersonId],
  );

  const entryCount = useLiveQuery(
    db.select().from(dateEntries).where(eq(dateEntries.personId, selectedPersonId ?? '')),
    [selectedPersonId],
  ).data?.length ?? 0;

  const showMenu = () => {
    const options = ['Edit'];
    if (entryCount > 0) options.push('View Full History');
    if (!person?.isEliminated) options.push('Eliminate');
    options.push('Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: options.indexOf('Eliminate') },
        (idx) => {
          const action = options[idx];
          if (action === 'Edit') openEditSheet();
          if (action === 'View Full History') openHistorySheet();
          if (action === 'Eliminate') openEliminateSheet();
        },
      );
    } else {
      // Android fallback
      const actionOptions = options.filter((o) => o !== 'Cancel');
      Alert.alert('Options', undefined, [
        ...actionOptions.map((action) => ({
          text: action,
          style: action === 'Eliminate' ? ('destructive' as const) : ('default' as const),
          onPress: () => {
            if (action === 'Edit') openEditSheet();
            if (action === 'View Full History') openHistorySheet();
            if (action === 'Eliminate') openEliminateSheet();
          },
        })),
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  if (!person) return null;

  const logCTADisabled = person.isEliminated || person.position === 30;
  const logCTALabel = person.isEliminated
    ? ''
    : person.position === 30
    ? 'Already The One 💝'
    : 'Log New Date';

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={() => selectPerson(null)}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: person.colorHex }]}>
            {person.photoData ? (
              <Image source={{ uri: `data:image/jpeg;base64,${person.photoData}` }} style={styles.avatarImg} />
            ) : (
              <Text style={{ fontSize: 32 }}>🧑</Text>
            )}
          </View>
          <View style={styles.nameBlock}>
            <Text style={typography.subheading}>{person.name}</Text>
            <Text style={[typography.caption, { color: colors.accent }]}>
              {currentMilestoneLabel(person.position)}
            </Text>
          </View>
          <TouchableOpacity onPress={showMenu} style={styles.menuBtn}>
            <Text style={[typography.body, { color: colors.textSecondary }]}>···</Text>
          </TouchableOpacity>
        </View>

        {recentEntries.map((entry) => (
          <View key={entry.id} style={styles.entryRow}>
            <Text style={{ fontSize: 20 }}>{VIBE_EMOJI[entry.vibe]}</Text>
            <Text style={[typography.caption, { flex: 1, marginLeft: 8 }]} numberOfLines={1}>
              {entry.note || '—'}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {entry.loggedAt ? formatDistanceToNow(entry.loggedAt, { addSuffix: true }) : ''}
            </Text>
          </View>
        ))}

        {!logCTADisabled && (
          <TouchableOpacity style={styles.logBtn} onPress={openLogSheet}>
            <Text style={[typography.body, { color: colors.bg, fontWeight: '700' }]}>
              Log New Date
            </Text>
          </TouchableOpacity>
        )}
        {logCTADisabled && logCTALabel !== '' && (
          <View style={[styles.logBtn, { opacity: 0.5 }]}>
            <Text style={[typography.body, { color: colors.bg }]}>{logCTALabel}</Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: 60, height: 60, borderRadius: 30 },
  nameBlock: { flex: 1, marginLeft: 12 },
  menuBtn: { padding: 8 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.textSecondary },
  logBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
});
