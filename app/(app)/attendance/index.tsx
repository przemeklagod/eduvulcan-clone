import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { PresenceExtra, PresenceSubjectStats } from '@/src/api/hebe/types/presence';
import { useActiveCredential } from '@/src/auth/accountsContext';
import { useAttendance } from '@/src/data/useAttendance';
import { useJustifyAbsence } from '@/src/data/useJustifyAbsence';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';

type SubTab = 'subjects' | 'unexcused';

function formatPercent(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

function JustifyAbsenceModal({
  absence,
  onClose,
  onJustified,
}: {
  absence: PresenceExtra | null;
  onClose: () => void;
  onJustified: () => void;
}) {
  const colors = useThemeColors();
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const { justify, isSubmitting, error, reset } = useJustifyAbsence();
  const [reason, setReason] = useState('');

  const close = () => {
    setReason('');
    reset();
    onClose();
  };

  const submit = async () => {
    if (!absence || !student || !reason.trim()) return;
    await justify({
      lessonClassId: absence.IdWeakRef ?? absence.Id,
      pupilId: student.Pupil.Id,
      loginId: student.Pupil.LoginId,
      reason: reason.trim(),
    });
    setReason('');
    onJustified();
  };

  return (
    <Modal visible={absence !== null} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Usprawiedliw nieobecność</Text>
          {absence && (
            <Text style={[styles.modalSubtitle, { color: colors.secondaryText }]}>
              {formatHebeDate(absence.DayAt)} · {absence.TimeSlot.Display}
            </Text>
          )}
          <TextInput
            style={[styles.reasonInput, { color: colors.text, borderColor: colors.border }]}
            placeholder="Powód nieobecności…"
            placeholderTextColor={colors.placeholder}
            value={reason}
            onChangeText={setReason}
            multiline
            textAlignVertical="top"
          />
          {error && (
            <Text style={[styles.modalError, { color: colors.danger }]} selectable>
              {error instanceof Error ? error.message : 'Nie udało się wysłać usprawiedliwienia'}
            </Text>
          )}
          <View style={styles.modalButtons}>
            <Pressable style={styles.modalButton} onPress={close}>
              <Text style={[styles.modalButtonLabel, { color: colors.secondaryText }]}>Anuluj</Text>
            </Pressable>
            <Pressable style={styles.modalButton} onPress={submit} disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? <ActivityIndicator /> : <Text style={[styles.modalButtonLabel, { color: colors.accent }]}>Wyślij</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function AttendanceScreen() {
  const colors = useThemeColors();
  const [tab, setTab] = useState<SubTab>('subjects');
  const [justifyTarget, setJustifyTarget] = useState<PresenceExtra | null>(null);
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
          <Pressable style={[styles.absenceRow, { borderBottomColor: colors.border }]} onPress={() => setJustifyTarget(item)}>
            <View style={styles.absenceInfo}>
              <Text style={[styles.absenceDate, { color: colors.text }]}>{formatHebeDate(item.DayAt)}</Text>
              <Text style={[styles.absenceHour, { color: colors.secondaryText }]}>{item.TimeSlot.Display}</Text>
            </View>
            <Text style={[styles.justifyLabel, { color: colors.accent }]}>Usprawiedliw</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.text }}>Brak nieusprawiedliwionych nieobecności.</Text>
          </View>
        }
      />

      <JustifyAbsenceModal
        absence={justifyTarget}
        onClose={() => setJustifyTarget(null)}
        onJustified={() => {
          setJustifyTarget(null);
          refetch();
        }}
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
  absenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  absenceInfo: { flex: 1 },
  absenceDate: { fontSize: 15, fontWeight: '600' },
  absenceHour: { fontSize: 13, marginTop: 2 },
  justifyLabel: { fontSize: 13, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 12, padding: 20, gap: 8 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalSubtitle: { fontSize: 13, marginBottom: 8 },
  reasonInput: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 100, fontSize: 15 },
  modalError: { fontSize: 13 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 8 },
  modalButton: { paddingVertical: 8, paddingHorizontal: 4 },
  modalButtonLabel: { fontSize: 15, fontWeight: '600' },
});
