import { ScrollView, TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { currentMilestoneLabel } from '@/helpers/board';

interface Person {
  id: string;
  name: string;
  colorHex: string;
  photoData: string | null;
  position: number;
}

interface Props {
  people: Person[];
  onPress: (personId: string) => void;
}

export function DateChipRow({ people, onPress }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {people.map((person) => (
        <TouchableOpacity
          key={person.id}
          style={[styles.chip, { borderColor: person.colorHex }]}
          onPress={() => onPress(person.id)}
        >
          <View style={[styles.avatar, { backgroundColor: person.colorHex }]}>
            {person.photoData ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${person.photoData}` }}
                style={styles.avatarImg}
              />
            ) : (
              <Text>🧑</Text>
            )}
          </View>
          <View style={styles.chipText}>
            <Text style={[typography.caption, { color: colors.text }]} numberOfLines={1}>
              {person.name}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
              {currentMilestoneLabel(person.position)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { height: 80, flexGrow: 0 },
  content: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a0030', borderRadius: 24, borderWidth: 1, paddingRight: 12, overflow: 'hidden' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  chipText: { marginLeft: 8 },
});
