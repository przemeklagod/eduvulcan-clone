import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import type { Schedule } from '@/src/api/hebe/types/schedule';
import { useSchedule } from '@/src/data/useSchedule';
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
  const { schedule, isLoading, isRefetching, error, refetch, hasActiveStudent } = useSchedule();
  const sections = useMemo(() => buildDaySections(schedule), [schedule]);

  if (!hasActiveStudent) {
    return (
      <View style={styles.center}>
        <Text>Brak zarejestrowanego ucznia.</Text>
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
        <Text style={styles.error}>{error instanceof Error ? error.message : 'Błąd ładowania planu lekcji'}</Text>
      </View>
    );
  }

  return (
    <SectionList
      style={styles.list}
      sections={sections}
      keyExtractor={(item) => String(item.Id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.dayName}>{formatHebeDate(section.date)}</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const cancelled = item.Substitution?.ClassAbsence || item.Substitution?.NoRoom;
        return (
          <View style={styles.lessonRow}>
            <Text style={styles.time}>{item.TimeSlot.Display}</Text>
            <View style={styles.lessonInfo}>
              <Text style={[styles.subjectName, cancelled && styles.cancelled]}>
                {item.Subject?.Name ?? item.Event ?? '—'}
              </Text>
              <Text style={styles.details}>
                {item.TeacherPrimary?.DisplayName} {item.Room ? `· sala ${item.Room.Code}` : ''}
              </Text>
              {item.Substitution?.Reason && <Text style={styles.substitutionNote}>{item.Substitution.Reason}</Text>}
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#d33', textAlign: 'center' },
  sectionHeader: { backgroundColor: '#f2f2f2', paddingHorizontal: 16, paddingVertical: 8 },
  dayName: { fontWeight: '700', fontSize: 15 },
  lessonRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  time: { width: 56, fontSize: 12, color: '#888' },
  lessonInfo: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '600' },
  cancelled: { color: '#d33', textDecorationLine: 'line-through' },
  details: { fontSize: 13, color: '#666' },
  substitutionNote: { fontSize: 12, color: '#d33', marginTop: 2 },
});
