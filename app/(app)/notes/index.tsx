import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Note } from '@/src/api/hebe/types/note';
import { useNotes } from '@/src/data/useNotes';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';

function sortByDateDesc(items: Note[]): Note[] {
  return [...items].sort((a, b) => b.ValidAt.localeCompare(a.ValidAt));
}

export default function NotesScreen() {
  const colors = useThemeColors();
  const { notes, isLoading, isRefetching, error, refetch, hasActiveStudent } = useNotes();
  const rows = useMemo(() => sortByDateDesc(notes), [notes]);

  if (!hasActiveStudent) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Brak zarejestrowanego ucznia.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.error, { color: colors.danger }]}>
          {error instanceof Error ? error.message : 'Błąd ładowania uwag'}
        </Text>
      </View>
    );
  }

  const positiveColor = '#2e9e4f';

  return (
    <FlatList<Note>
      style={[styles.list, { backgroundColor: colors.background }]}
      data={rows}
      keyExtractor={(item) => String(item.Id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }) => {
        const accent = item.Positive ? positiveColor : colors.danger;
        return (
          <View style={[styles.card, { borderBottomColor: colors.border, borderLeftColor: accent }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.kind, { color: accent }]}>{item.Positive ? 'Pochwała' : 'Uwaga'}</Text>
              <Text style={[styles.date, { color: colors.secondaryText }]}>{formatHebeDate(item.ValidAt)}</Text>
            </View>
            {item.Category?.Name && <Text style={[styles.category, { color: colors.secondaryText }]}>{item.Category.Name}</Text>}
            <Text style={[styles.content, { color: colors.text }]}>{item.Content}</Text>
            <Text style={[styles.creator, { color: colors.secondaryText }]}>{item.Creator.DisplayName}</Text>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak uwag i pochwał.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  card: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, gap: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  kind: { fontWeight: '700', fontSize: 13 },
  date: { fontSize: 12 },
  category: { fontSize: 12 },
  content: { fontSize: 14, lineHeight: 20 },
  creator: { fontSize: 12, marginTop: 2 },
});
