import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import type { ScheduleExtra } from '@/src/api/hebe/types/schedule';
import { useScheduleExtra } from '@/src/data/useScheduleExtra';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';

interface DaySection {
  date: string;
  data: ScheduleExtra[];
}

function buildDaySections(items: ScheduleExtra[]): DaySection[] {
  const byDate = new Map<string, ScheduleExtra[]>();
  for (const item of items) {
    const list = byDate.get(item.DateAt) ?? [];
    list.push(item);
    byDate.set(item.DateAt, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      data: [...data].sort((a, b) => a.TimeSlot.Position - b.TimeSlot.Position),
    }));
}

export default function ScheduleExtraScreen() {
  const colors = useThemeColors();
  const { scheduleExtra, isLoading, isRefetching, error, refetch, hasActiveStudent } = useScheduleExtra();
  const sections = useMemo(() => buildDaySections(scheduleExtra), [scheduleExtra]);

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
          {error instanceof Error ? error.message : 'Błąd ładowania zajęć dodatkowych'}
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      style={[styles.list, { backgroundColor: colors.background }]}
      sections={sections}
      keyExtractor={(item) => String(item.Id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionHeader, { backgroundColor: colors.card }]}>
          <Text style={[styles.dayName, { color: colors.text }]}>{formatHebeDate(section.date)}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={[styles.time, { color: colors.secondaryText }]} numberOfLines={1}>
            {item.TimeSlot.Display}
          </Text>
          <View style={styles.info}>
            <Text style={[styles.title, { color: colors.text }]}>{item.SchedulePupilDescription || item.ExtraDescription}</Text>
            <Text style={[styles.details, { color: colors.secondaryText }]}>
              {item.Teacher.DisplayName} {item.Room ? `· sala ${item.Room.Code}` : ''}
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak zajęć dodatkowych w tym okresie.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  dayName: { fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  time: { width: 82, fontSize: 12 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  details: { fontSize: 13, marginTop: 2 },
});
