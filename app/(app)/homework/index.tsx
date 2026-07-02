import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Homework } from '@/src/api/hebe/types/homework';
import { useHomework } from '@/src/data/useHomework';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';
import { htmlToPlainText } from '@/src/utils/richText';

function sortByDeadline(items: Homework[]): Homework[] {
  return [...items].sort((a, b) => a.DeadlineAt.localeCompare(b.DeadlineAt));
}

export default function HomeworkScreen() {
  const colors = useThemeColors();
  const { homework, isLoading, isRefetching, error, refetch, hasActiveStudent } = useHomework();
  const rows = useMemo(() => sortByDeadline(homework), [homework]);

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
          {error instanceof Error ? error.message : 'Błąd ładowania zadań domowych'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList<Homework>
      style={[styles.list, { backgroundColor: colors.background }]}
      data={rows}
      keyExtractor={(item) => String(item.Id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }) => (
        <View style={[styles.card, { borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.subject, { color: colors.accent }]}>{item.Subject.Name}</Text>
            <Text style={[styles.deadline, { color: colors.secondaryText }]}>{formatHebeDate(item.DeadlineAt)}</Text>
          </View>
          <Text style={[styles.content, { color: colors.text }]}>{htmlToPlainText(item.Content)}</Text>
          <Text style={[styles.creator, { color: colors.secondaryText }]}>{item.Creator.DisplayName}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak zadań domowych.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  card: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subject: { fontWeight: '700', fontSize: 14 },
  deadline: { fontSize: 12 },
  content: { fontSize: 14, lineHeight: 20 },
  creator: { fontSize: 12, marginTop: 2 },
});
