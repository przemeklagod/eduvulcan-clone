import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import type { Schedule } from '@/src/api/hebe/types/schedule';
import { useSchedule } from '@/src/data/useSchedule';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';

interface DaySection {
  date: string;
  data: Schedule[];
}

function buildDaySections(lessons: Schedule[]): DaySection[] {
  const byDate = new Map<string, Schedule[]>();
  for (const lesson of lessons) {
    const list = byDate.get(lesson.DateAt) ?? [];
    list.push(lesson);
    byDate.set(lesson.DateAt, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      data: [...data].sort((a, b) => a.TimeSlot.Position - b.TimeSlot.Position),
    }));
}

export default function ScheduleScreen() {
  const colors = useThemeColors();
  const { schedule, isLoading, isRefetching, error, refetch, hasActiveStudent } = useSchedule();
  const sections = useMemo(() => buildDaySections(schedule), [schedule]);

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
          {error instanceof Error ? error.message : 'Błąd ładowania planu lekcji'}
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
      renderItem={({ item }) => {
        const cancelled = item.Substitution?.ClassAbsence || item.Substitution?.NoRoom;
        return (
          <View style={styles.lessonRow}>
            <Text style={[styles.time, { color: colors.secondaryText }]}>{item.TimeSlot.Display}</Text>
            <View style={styles.lessonInfo}>
              <Text style={[styles.subjectName, { color: colors.text }, cancelled && { color: colors.danger, textDecorationLine: 'line-through' }]}>
                {item.Subject?.Name ?? item.Event ?? '—'}
              </Text>
              <Text style={[styles.details, { color: colors.secondaryText }]}>
                {item.TeacherPrimary?.DisplayName} {item.Room ? `· sala ${item.Room.Code}` : ''}
              </Text>
              {item.Substitution?.Reason && (
                <Text style={[styles.substitutionNote, { color: colors.danger }]}>{item.Substitution.Reason}</Text>
              )}
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak zajęć w tym okresie.</Text>
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
  lessonRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  time: { width: 56, fontSize: 12 },
  lessonInfo: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '600' },
  details: { fontSize: 13 },
  substitutionNote: { fontSize: 12, marginTop: 2 },
});
