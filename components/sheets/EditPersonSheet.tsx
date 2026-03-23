import BottomSheet, { BottomSheetView, BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useRef, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { datePeople } from '@/db/schema';
import { useBoardStore } from '@/store/boardStore';
import { editPerson } from '@/services/board';
import { colors, typography, PIECE_COLORS } from '@/constants/theme';

export function EditPersonSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  const { showingEditSheet, closeEditSheet, selectedPersonId } = useBoardStore();
  const snapPoints = useMemo(() => ['70%'], []);

  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: people = [] } = useLiveQuery(
    db.select().from(datePeople).where(eq(datePeople.id, selectedPersonId ?? '')),
    [selectedPersonId],
  );
  const person = people[0];

  useEffect(() => {
    if (showingEditSheet && person) {
      sheetRef.current?.expand();
      setName(person.name);
      setPhotoUri(null); // existing photo shown from person.photoData
    } else {
      sheetRef.current?.close();
    }
  }, [showingEditSheet, person?.id]);

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
    if (!name.trim() || !selectedPersonId || saving) return;
    setSaving(true);
    try {
      await editPerson(selectedPersonId, name.trim(), photoUri ?? undefined);
      closeEditSheet();
    } finally {
      setSaving(false);
    }
  };

  if (!person) return null;

  const displayPhotoUri = photoUri ?? (person.photoData ? `data:image/jpeg;base64,${person.photoData}` : null);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={closeEditSheet}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.textSecondary }}
    >
      <BottomSheetView style={styles.content}>
        <TouchableOpacity style={[styles.photoPicker, { backgroundColor: person.colorHex + '44' }]} onPress={pickPhoto}>
          {displayPhotoUri ? (
            <Image source={{ uri: displayPhotoUri }} style={styles.photoImg} />
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

        {/* Color swatches — disabled, shown for reference only */}
        <View style={styles.swatches}>
          {PIECE_COLORS.map((c) => (
            <View
              key={c}
              style={[styles.swatch, { backgroundColor: c, opacity: c === person.colorHex ? 1 : 0.3 }, c === person.colorHex && styles.swatchSelected]}
            />
          ))}
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          Color cannot be changed after creation
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
          onPress={handleSave}
          disabled={!name.trim() || saving}
        >
          <Text style={[typography.body, { color: colors.bg, fontWeight: '700' }]}>
            {saving ? 'Saving...' : 'Save Changes'}
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
