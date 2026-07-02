import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/src/ui/theme';

const ITEMS: { href: string; label: string }[] = [
  { href: '/announcements', label: 'Ogłoszenia' },
  { href: '/homework', label: 'Zadania domowe' },
  { href: '/exams', label: 'Sprawdziany' },
  { href: '/schedule-extra', label: 'Zajęcia dodatkowe' },
  { href: '/notes', label: 'Uwagi i pochwały' },
  { href: '/teachers', label: 'Nauczyciele' },
  { href: '/settings', label: 'Ustawienia' },
];

export default function MoreScreen() {
  const colors = useThemeColors();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {ITEMS.map((item) => (
        <Pressable
          key={item.href}
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => router.push(item.href as never)}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { fontSize: 16 },
});
