import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { PresenceExtra, PresenceSubjectStats } from '@/src/api/hebe/types/presence';
import { useAttendance } from '@/src/data/useAttendance';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';

type SubTab = 'subjects' | 'unexcused';

function formatPercent(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

export default function AttendanceScreen() {
  const colors = useThemeColors();
  const [tab, setTab] = useState<SubTab>('subjects');
  const {
    monthStats,
    subjectStats,
    unexcusedAbsences,
    isLoading,
    isLoadingExtra,
    isRefetching,
    error,
    errorExtra,
    refetch,
    hasActiveStudent,
  } = useAttendance();

  if (!hasActiveStudent) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.text }}>Brak zarejestrowanego ucznia.</Text>
      </View>
    );
  }

  const overall = monthStats[monthStats.length - 1];

  const tabBar = (
    <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
      <Pressable
        style={[styles.tab, tab === 'subjects' && { borderBottomWidth: 2, borderBottomColor: colors.accent }]}
        onPress={() => setTab('subjects')}
      >
        <Text style={[styles.tabLabel, { color: tab === 'subjects' ? colors.accent : colors.secondaryText }]}>
          Wg przedmiotów
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, tab === 'unexcused' && { borderBottomWidth: 2, borderBottomColor: colors.accent }]}
        onPress={() => setTab('unexcused')}
      >
        <Text style={[styles.tabLabel, { color: tab === 'unexcused' ? colors.accent : colors.secondaryText }]}>
          Nieusprawiedliwione{unexcusedAbsences.length > 0 ? ` (${unexcusedAbsences.length})` : ''}
        </Text>
      </Pressable>
    </View>
  );

  if (tab === 'subjects') {
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
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {tabBar}
        <FlatList<PresenceSubjectStats>
          style={styles.list}
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
      </View>
    );
  }

  if (isLoadingExtra) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {tabBar}
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </View>
    );
  }

  if (errorExtra) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {tabBar}
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>
            {errorExtra instanceof Error ? errorExtra.message : 'Błąd ładowania nieobecności'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {tabBar}
      <FlatList<PresenceExtra>
        style={styles.list}
        data={unexcusedAbsences}
        keyExtractor={(item) => String(item.Id)}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <View style={[styles.absenceRow, { borderBottomColor: colors.border }]}>
            <View style={styles.absenceInfo}>
              <Text style={[styles.absenceDate, { color: colors.text }]}>{formatHebeDate(item.DayAt)}</Text>
              <Text style={[styles.absenceHour, { color: colors.secondaryText }]}>{item.TimeSlot.Display}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.text }}>Brak nieusprawiedliwionych nieobecności.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 13, fontWeight: '600' },
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
  absenceRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  absenceInfo: { flex: 1 },
  absenceDate: { fontSize: 15, fontWeight: '600' },
  absenceHour: { fontSize: 13, marginTop: 2 },
});
