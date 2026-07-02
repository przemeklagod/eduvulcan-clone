import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { PresenceSubjectStats } from '@/src/api/hebe/types/presence';
import { useAttendance } from '@/src/data/useAttendance';
import { useThemeColors } from '@/src/ui/theme';

function formatPercent(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

export default function AttendanceScreen() {
  const colors = useThemeColors();
  const { monthStats, subjectStats, isLoading, isRefetching, error, refetch, hasActiveStudent } = useAttendance();

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
          {error instanceof Error ? error.message : 'Błąd ładowania frekwencji'}
        </Text>
      </View>
    );
  }

  const overall = monthStats[monthStats.length - 1];

  return (
    <FlatList<PresenceSubjectStats>
      style={[styles.list, { backgroundColor: colors.background }]}
      data={subjectStats}
      keyExtractor={(item) => String(item.SubjectId)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListHeaderComponent={
        overall ? (
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.summaryPercent, { color: colors.text }]}>{formatPercent(overall.PresencePercentage)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.secondaryText }]}>frekwencja ogółem</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryDetail, { color: colors.secondaryText }]}>Nieobecności: {overall.Absences}</Text>
              <Text style={[styles.summaryDetail, { color: colors.secondaryText }]}>
                Usprawiedliwione: {overall.AbsencesJustified}
              </Text>
              <Text style={[styles.summaryDetail, { color: colors.secondaryText }]}>Spóźnienia: {overall.LateArrivals}</Text>
            </View>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={[styles.subjectRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.subjectName, { color: colors.text }]}>{item.SubjectName}</Text>
          <Text style={[styles.subjectPercent, { color: colors.text }]}>{formatPercent(item.PresencePercentage)}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak danych o frekwencji.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  summaryCard: { alignItems: 'center', padding: 24 },
  summaryPercent: { fontSize: 36, fontWeight: '700' },
  summaryLabel: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  summaryDetail: { fontSize: 12 },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subjectName: { fontSize: 15 },
  subjectPercent: { fontSize: 15, fontWeight: '600' },
});
