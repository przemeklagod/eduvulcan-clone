import { useMemo } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import type { Grade, GradeAverage } from '@/src/api/hebe/types/grade';
import { useGrades } from '@/src/data/useGrades';
import { formatHebeDate } from '@/src/utils/dates';

interface Section {
  subjectId: number;
  title: string;
  average?: string;
  data: Grade[];
}

function buildSections(grades: Grade[], averages: GradeAverage[]): Section[] {
  const bySubject = new Map<number, Section>();

  for (const grade of grades) {
    const subject = grade.Column.Subject;
    let section = bySubject.get(subject.Id);
    if (!section) {
      section = { subjectId: subject.Id, title: subject.Name, data: [] };
      bySubject.set(subject.Id, section);
    }
    section.data.push(grade);
  }

  for (const average of averages) {
    const section = bySubject.get(average.Subject.Id);
    if (section) section.average = average.Average;
  }

  return [...bySubject.values()].sort((a, b) => a.title.localeCompare(b.title));
}

export default function GradesScreen() {
  const { grades, averages, isLoading, isRefetching, error, refetch, hasActiveStudent } = useGrades();
  const sections = useMemo(() => buildSections(grades, averages), [grades, averages]);

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
        <Text style={styles.error}>{error instanceof Error ? error.message : 'Błąd ładowania ocen'}</Text>
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
          <Text style={styles.subjectName}>{section.title}</Text>
          {section.average && <Text style={styles.average}>śr. {section.average}</Text>}
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.gradeRow}>
          <View style={[styles.gradeBadge, { backgroundColor: `#${item.Column.Color.toString(16).padStart(6, '0')}` }]}>
            <Text style={styles.gradeValue}>{item.Content}</Text>
          </View>
          <View style={styles.gradeInfo}>
            <Text style={styles.gradeColumnName}>{item.Column.Name}</Text>
            <Text style={styles.gradeDate}>{formatHebeDate(item.CreatedAt)}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#d33', textAlign: 'center' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  subjectName: { fontWeight: '700', fontSize: 15 },
  average: { color: '#555' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  gradeBadge: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  gradeValue: { color: '#fff', fontWeight: '700' },
  gradeInfo: { flex: 1 },
  gradeColumnName: { fontSize: 14 },
  gradeDate: { fontSize: 12, color: '#888' },
});
