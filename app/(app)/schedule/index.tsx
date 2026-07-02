import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import type { Schedule } from '@/src/api/hebe/types/schedule';
import { useSchedule } from '@/src/data/useSchedule';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate, formatWeekRangeLabel } from '@/src/utils/dates';

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

const SWIPE_MOVE_THRESHOLD = 20;
const SWIPE_COMMIT_THRESHOLD = 50;

export default function ScheduleScreen() {
  const colors = useThemeColors();
  const [weekOffset, setWeekOffset] = useState(0);
  const referenceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const { schedule, isLoading, isRefetching, error, refetch, hasActiveStudent } = useSchedule(referenceDate);
  const sections = useMemo(() => buildDaySections(schedule), [schedule]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > SWIPE_MOVE_THRESHOLD && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 2,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx <= -SWIPE_COMMIT_THRESHOLD) setWeekOffset((w) => w + 1);
        else if (gesture.dx >= SWIPE_COMMIT_THRESHOLD) setWeekOffset((w) => w - 1);
      },
    })
  ).current;

  const weekHeader = (
    <View style={[styles.weekHeader, { borderBottomColor: colors.border }]}>
      <Pressable style={styles.weekArrow} onPress={() => setWeekOffset((w) => w - 1)} hitSlop={12}>
        <Text style={[styles.weekArrowLabel, { color: colors.accent }]}>‹</Text>
      </Pressable>
      <Pressable onPress={() => setWeekOffset(0)}>
        <Text style={[styles.weekLabel, { color: colors.text }]}>{formatWeekRangeLabel(referenceDate)}</Text>
        {weekOffset !== 0 && <Text style={[styles.todayLabel, { color: colors.accent }]}>wróć do dziś</Text>}
      </Pressable>
      <Pressable style={styles.weekArrow} onPress={() => setWeekOffset((w) => w + 1)} hitSlop={12}>
        <Text style={[styles.weekArrowLabel, { color: colors.accent }]}>›</Text>
      </Pressable>
    </View>
  );

  if (!hasActiveStudent) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Brak zarejestrowanego ucznia.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} {...panResponder.panHandlers}>
      {weekHeader}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>
            {error instanceof Error ? error.message : 'Błąd ładowania planu lekcji'}
          </Text>
        </View>
      ) : (
        <SectionList
          style={styles.list}
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
                <Text style={[styles.time, { color: colors.secondaryText }]} numberOfLines={1}>
                  {item.TimeSlot.Display}
                </Text>
                <View style={styles.lessonInfo}>
                  <Text
                    style={[
                      styles.subjectName,
                      { color: colors.text },
                      cancelled && { color: colors.danger, textDecorationLine: 'line-through' },
                    ]}
                  >
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekArrow: { paddingHorizontal: 16, paddingVertical: 4 },
  weekArrowLabel: { fontSize: 24, fontWeight: '700' },
  weekLabel: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  todayLabel: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  dayName: { fontWeight: '700', fontSize: 15 },
  lessonRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  time: { width: 82, fontSize: 12 },
  lessonInfo: { flex: 1 },
  subjectName: { fontSize: 15, fontWeight: '600' },
  details: { fontSize: 13 },
  substitutionNote: { fontSize: 12, marginTop: 2 },
});
