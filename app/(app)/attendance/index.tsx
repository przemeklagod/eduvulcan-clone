import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { PresenceSubjectStats } from '@/src/api/hebe/types/presence';
import { useAttendance } from '@/src/data/useAttendance';

function formatPercent(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

export default function AttendanceScreen() {
  const { monthStats, subjectStats, isLoading, isRefetching, error, refetch, hasActiveStudent } = useAttendance();

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
        <Text style={styles.error}>{error instanceof Error ? error.message : 'Błąd ładowania frekwencji'}</Text>
      </View>
    );
  }

  const overall = monthStats[monthStats.length - 1];

  return (
    <FlatList<PresenceSubjectStats>
      style={styles.list}
      data={subjectStats}
      keyExtractor={(item) => String(item.SubjectId)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      ListHeaderComponent={
        overall ? (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryPercent}>{formatPercent(overall.PresencePercentage)}</Text>
            <Text style={styles.summaryLabel}>frekwencja ogółem</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryDetail}>Nieobecności: {overall.Absences}</Text>
              <Text style={styles.summaryDetail}>Usprawiedliwione: {overall.AbsencesJustified}</Text>
              <Text style={styles.summaryDetail}>Spóźnienia: {overall.LateArrivals}</Text>
            </View>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <View style={styles.subjectRow}>
          <Text style={styles.subjectName}>{item.SubjectName}</Text>
          <Text style={styles.subjectPercent}>{formatPercent(item.PresencePercentage)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#d33', textAlign: 'center' },
  summaryCard: { alignItems: 'center', padding: 24, backgroundColor: '#f2f2f2' },
  summaryPercent: { fontSize: 36, fontWeight: '700' },
  summaryLabel: { color: '#666', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  summaryDetail: { fontSize: 12, color: '#555' },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  subjectName: { fontSize: 15 },
  subjectPercent: { fontSize: 15, fontWeight: '600' },
});
