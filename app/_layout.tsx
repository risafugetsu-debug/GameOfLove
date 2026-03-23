import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { db } from '@/db/client';
import migrations from '@/db/migrations/migrations';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.error }}>DB migration failed: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
