import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useRef, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { datePeople } from '@/db/schema';
import { useBoardStore } from '@/store/boardStore';
import { addPerson } from '@/services/board';
import { colors, typography, PIECE_COLORS } from '@/constants/theme';

export function AddDateSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  const { showingAddSheet, closeAddSheet } = useBoardStore();
  const snapPoints = useMemo(() => ['70%'], []);

  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [colorHex, setColorHex] = useState(PIECE_COLORS[0]);
  const [saving, setSaving] = useState(false);

  // Default color = first not in use
  const { data: activePeople = [] } = useLiveQuery(
    db.select({ colorHex: datePeople.colorHex }).from(datePeople).where(eq(datePeople.isEliminated, false)),
  );
  useEffect(() => {
    const usedColors = activePeople.map((p) => p.colorHex);
    const defaultColor = PIECE_COLORS.find((c) => !usedColors.includes(c)) ?? PIECE_COLORS[0];
    setColorHex(defaultColor);
  }, [activePeople.length]);

  useEffect(() => {
    if (showingAddSheet) {
      sheetRef.current?.expand();
      setName(''); setNote(''); setPhotoUri(null);
    } else {
      sheetRef.current?.close();
    }
  }, [showingAddSheet]);

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await addPerson(name.trim(), colorHex, note.trim() || undefined, photoUri ?? undefined);
      closeAddSheet();
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
      onClose={closeAddSheet}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView style={styles.content}>
        <TouchableOpacity style={[styles.photoPicker, { backgroundColor: colorHex + '44' }]} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImg} />
          ) : (
            <Text style={{ fontSize: 40 }}>🧑</Text>
          )}
        </TouchableOpacity>

        <BottomSheetTextInput
          style={styles.input}
          placeholder="Name *"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <BottomSheetTextInput
          style={styles.input}
          placeholder="First impression (optional)"
          placeholderTextColor={colors.textSecondary}
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.swatches}>
          {PIECE_COLORS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.swatch, { backgroundColor: c }, colorHex === c && styles.swatchSelected]}
              onPress={() => setColorHex(c)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!name.trim() || saving}
        >
          <Text style={[typography.body, { color: colors.bg, fontWeight: '700' }]}>
            {saving ? 'Adding...' : 'Add to Board 💝'}
          </Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20, alignItems: 'center' },
  photoPicker: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  photoImg: { width: 100, height: 100, borderRadius: 50 },
  input: { width: '100%', backgroundColor: '#2a0045', color: colors.text, borderRadius: 10, padding: 12, marginTop: 12 },
  swatches: { flexDirection: 'row', gap: 10, marginTop: 16 },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSelected: { borderWidth: 3, borderColor: colors.text },
  saveBtn: { width: '100%', backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
});
