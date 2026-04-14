import { ScrollView, TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';

interface Person {
  id: string;
  name: string;
  colorHex: string;
  photoData: string | null;
  position: number;
  isEliminated: boolean;
  isFavorite: boolean;
}

interface Props {
  people: Person[];
  onPress: (personId: string) => void;
}

export function DateChipRow({ people, onPress }: Props) {
  const sorted = [...people].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {sorted.map((person) => (
        <TouchableOpacity
          key={person.id}
          style={[styles.item, person.isEliminated && styles.itemEliminated]}
          onPress={() => onPress(person.id)}
        >
          <View style={[styles.avatar, { borderColor: person.colorHex }]}>
            {person.photoData ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${person.photoData}` }}
                style={styles.avatarImg}
              />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: person.colorHex }]}>
                <Text style={styles.avatarEmoji}>
                  {person.isEliminated ? '\uD83D\uDC80' : '\uD83E\uDDD1'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {person.isFavorite ? '⭐ ' : ''}{person.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const AVATAR_SIZE = 52;

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 16, paddingVertical: 8, gap: 16, alignItems: 'center' },
  item: { alignItems: 'center', width: 64 },
  itemEliminated: { opacity: 0.4 },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 24 },
  name: {
    marginTop: 4,
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    width: 64,
  },
});
