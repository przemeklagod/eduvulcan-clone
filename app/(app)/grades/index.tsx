import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import type { Grade, GradeAverage, GradeSummary } from '@/src/api/hebe/types/grade';
import type { Period } from '@/src/api/hebe/types/account';
import { useGrades } from '@/src/data/useGrades';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';

interface SummaryLine {
  periodLabel: string;
  proposed?: string;
  final?: string;
}

interface Section {
  subjectId: number;
  title: string;
  average?: string;
  data: Grade[];
  summaryLines: SummaryLine[];
}

interface LegendEntry {
  key: string;
  label: string;
  color: string;
}

function colorHex(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}

function periodLabel(period: Period): string {
  return period.Last ? 'Ocena roczna' : `Semestr ${period.Number}`;
}

function buildSections(grades: Grade[], averages: GradeAverage[], summaries: GradeSummary[], periods: Period[]): Section[] {
  const bySubject = new Map<number, Section>();

  for (const grade of grades) {
    const subject = grade.Column.Subject;
    let section = bySubject.get(subject.Id);
    if (!section) {
      section = { subjectId: subject.Id, title: subject.Name, data: [], summaryLines: [] };
      bySubject.set(subject.Id, section);
    }
    section.data.push(grade);
  }

  for (const average of averages) {
    const section = bySubject.get(average.Subject.Id);
    if (section && average.Average) section.average = average.Average;
  }

  const periodsById = new Map(periods.map((p) => [p.Id, p]));
  for (const summary of summaries) {
    if (!summary.Entry_1 && !summary.Entry_2) continue;
    const subject = summary.Subject;
    let section = bySubject.get(subject.Id);
    if (!section) {
      section = { subjectId: subject.Id, title: subject.Name, data: [], summaryLines: [] };
      bySubject.set(subject.Id, section);
    }
    const period = periodsById.get(summary.PeriodId);
    section.summaryLines.push({
      periodLabel: period ? periodLabel(period) : `Okres ${summary.PeriodId}`,
      proposed: summary.Entry_1,
      final: summary.Entry_2,
    });
  }

  return [...bySubject.values()].sort((a, b) => a.title.localeCompare(b.title));
}

function buildLegend(grades: Grade[]): LegendEntry[] {
  const seen = new Map<string, LegendEntry>();
  for (const grade of grades) {
    const label = grade.Column.Category?.Name ?? grade.Column.Name;
    const key = `${label}__${grade.Column.Color}`;
    if (!seen.has(key)) seen.set(key, { key, label, color: colorHex(grade.Column.Color) });
  }
  return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label));
}

// Numeric/letter grades ("5", "4+", "bdb", "ndst-") are short and fit the badge.
// Descriptive grades (common in early primary years) are full sentences and need
// their own wrapped, expandable text instead of being crammed into a 32x32 square.
const DESCRIPTIVE_LENGTH_THRESHOLD = 6;

export default function GradesScreen() {
  const colors = useThemeColors();
  const { grades, averages, summaries, periods, isLoading, isRefetching, error, refetch, hasActiveStudent } = useGrades();
  const sections = useMemo(() => buildSections(grades, averages, summaries, periods), [grades, averages, summaries, periods]);
  const legend = useMemo(() => buildLegend(grades), [grades]);
  const [showLegend, setShowLegend] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
        <Text style={[styles.error, { color: colors.danger }]}>{error instanceof Error ? error.message : 'Błąd ładowania ocen'}</Text>
      </View>
    );
  }

  return (
    <SectionList
      style={[styles.list, { backgroundColor: colors.background }]}
      sections={sections}
      keyExtractor={(item) => String(item.Id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListHeaderComponent={
        legend.length > 0 ? (
          <View>
            <Pressable style={styles.legendToggle} onPress={() => setShowLegend((v) => !v)}>
              <Text style={[styles.legendToggleLabel, { color: colors.accent }]}>
                {showLegend ? 'Ukryj legendę kolorów' : 'Pokaż legendę kolorów'}
              </Text>
            </Pressable>
            {showLegend && (
              <View style={[styles.legendBox, { borderColor: colors.border }]}>
                {legend.map((entry) => (
                  <View key={entry.key} style={styles.legendRow}>
                    <View style={[styles.legendSwatch, { backgroundColor: entry.color }]} />
                    <Text style={[styles.legendLabel, { color: colors.text }]}>{entry.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null
      }
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionHeader, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeaderTop}>
            <Text style={[styles.subjectName, { color: colors.text }]}>{section.title}</Text>
            {section.average && <Text style={[styles.average, { color: colors.secondaryText }]}>śr. {section.average}</Text>}
          </View>
          {section.summaryLines.length > 0 && (
            <View style={styles.summaryLines}>
              {section.summaryLines.map((line, i) => (
                <Text key={i} style={[styles.summaryLine, { color: colors.secondaryText }]}>
                  {line.periodLabel}: {line.proposed ? `proponowana ${line.proposed}` : ''}
                  {line.proposed && line.final ? ' · ' : ''}
                  {line.final ? `ustalona ${line.final}` : ''}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
      renderItem={({ item }) => {
        const isDescriptive = item.Content.length > DESCRIPTIVE_LENGTH_THRESHOLD;
        const expanded = expandedIds.has(item.Id);
        return (
          <View style={styles.gradeRow}>
            {isDescriptive ? (
              <View style={[styles.gradeDot, { backgroundColor: colorHex(item.Column.Color) }]} />
            ) : (
              <View style={[styles.gradeBadge, { backgroundColor: colorHex(item.Column.Color) }]}>
                <Text style={styles.gradeValue}>{item.Content}</Text>
              </View>
            )}
            <View style={styles.gradeInfo}>
              <Text style={[styles.gradeColumnName, { color: colors.text }]}>{item.Column.Name}</Text>
              <Text style={[styles.gradeDate, { color: colors.secondaryText }]}>{formatHebeDate(item.CreatedAt)}</Text>
              {isDescriptive &&
                (expanded ? (
                  <Pressable onPress={() => toggleExpanded(item.Id)}>
                    <Text style={[styles.descriptiveContent, { color: colors.text }]} selectable>
                      {item.Content}
                    </Text>
                    <Text style={[styles.expandToggle, { color: colors.accent }]}>Zwiń</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => toggleExpanded(item.Id)}>
                    <Text style={[styles.descriptiveContent, { color: colors.text }]} numberOfLines={3}>
                      {item.Content}
                    </Text>
                    <Text style={[styles.expandToggle, { color: colors.accent }]}>Pokaż całość</Text>
                  </Pressable>
                ))}
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak ocen w tym okresie.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  legendToggle: { paddingHorizontal: 16, paddingVertical: 10 },
  legendToggleLabel: { fontWeight: '600', fontSize: 13 },
  legendBox: { marginHorizontal: 16, marginBottom: 8, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendSwatch: { width: 16, height: 16, borderRadius: 4 },
  legendLabel: { fontSize: 13 },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 8, gap: 4 },
  sectionHeaderTop: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectName: { fontWeight: '700', fontSize: 15 },
  average: {},
  summaryLines: { gap: 2 },
  summaryLine: { fontSize: 12 },
  gradeRow: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  gradeBadge: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  gradeDot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
  gradeValue: { color: '#fff', fontWeight: '700' },
  gradeInfo: { flex: 1 },
  gradeColumnName: { fontSize: 14 },
  gradeDate: { fontSize: 12 },
  descriptiveContent: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  expandToggle: { fontSize: 12, fontWeight: '600', marginTop: 4 },
});
