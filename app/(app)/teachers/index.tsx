import { useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Teacher } from '@/src/api/hebe/types/teacher';
import { useTeachers } from '@/src/data/useTeachers';
import { useThemeColors } from '@/src/ui/theme';

function sortedTeachers(teachers: Teacher[]): Teacher[] {
  return [...teachers].sort((a, b) => a.Description.localeCompare(b.Description) || a.DisplayName.localeCompare(b.DisplayName));
}

export default function TeachersScreen() {
  const colors = useThemeColors();
  const { teachers, isLoading, isRefetching, error, refetch, hasActiveStudent } = useTeachers();
  const rows = useMemo(() => sortedTeachers(teachers), [teachers]);

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
          {error instanceof Error ? error.message : 'Błąd ładowania nauczycieli'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList<Teacher>
      style={[styles.list, { backgroundColor: colors.background }]}
      data={rows}
      keyExtractor={(item) => `${item.Id}-${item.Description}`}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }) => (
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.subject, { color: colors.accent }]}>{item.Description}</Text>
          <Text style={[styles.name, { color: colors.text }]}>{item.DisplayName}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak danych o nauczycielach.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  row: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  subject: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  name: { fontSize: 15 },
});
