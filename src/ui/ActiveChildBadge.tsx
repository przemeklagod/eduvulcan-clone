import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccounts } from '../auth/accountsContext';
import { useThemeColors } from './theme';

interface Row {
  tenant: string;
  pupilId: number;
  label: string;
  schoolName: string;
}

export function ActiveChildBadge() {
  const colors = useThemeColors();
  const { tenants, active, setActive } = useAccounts();
  const [open, setOpen] = useState(false);

  const rows: Row[] = tenants.flatMap((t) =>
    t.students.map((s) => ({
      tenant: t.credential.tenant,
      pupilId: s.Pupil.Id,
      label: `${s.Pupil.FirstName} ${s.Pupil.Surname}`,
      schoolName: s.Unit.DisplayName,
    }))
  );

  if (rows.length === 0) return null;

  const activeRow = rows.find((r) => r.tenant === active?.tenant && r.pupilId === active?.pupilId);

  return (
    <>
      <Pressable style={styles.badge} onPress={() => setOpen(true)} hitSlop={8}>
        <Text style={[styles.badgeLabel, { color: colors.accent }]} numberOfLines={1}>
          {activeRow?.label.split(' ')[0] ?? 'Wybierz dziecko'}
        </Text>
        <Text style={[styles.chevron, { color: colors.accent }]}>▾</Text>
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <Text style={[styles.sheetTitle, { color: colors.secondaryText }]}>Wybierz dziecko</Text>
            <FlatList<Row>
              data={rows}
              keyExtractor={(item) => `${item.tenant}:${item.pupilId}`}
              renderItem={({ item }) => {
                const isActive = item.tenant === active?.tenant && item.pupilId === active?.pupilId;
                return (
                  <Pressable
                    style={[styles.row, { borderBottomColor: colors.border }, isActive && { backgroundColor: colors.card }]}
                    onPress={() => {
                      setActive({ tenant: item.tenant, pupilId: item.pupilId });
                      setOpen(false);
                    }}
                  >
                    <View style={styles.rowInfo}>
                      <Text style={[styles.rowName, { color: colors.text }]}>{item.label}</Text>
                      <Text style={[styles.rowSchool, { color: colors.secondaryText }]}>{item.schoolName}</Text>
                    </View>
                    {isActive && <Text style={[styles.checkmark, { color: colors.accent }]}>✓</Text>}
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 12, maxWidth: 140 },
  badgeLabel: { fontSize: 15, fontWeight: '600' },
  chevron: { fontSize: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-start', alignItems: 'flex-end' },
  sheet: { marginTop: 90, marginRight: 12, borderRadius: 12, width: 240, maxHeight: 360, paddingVertical: 8, overflow: 'hidden' },
  sheetTitle: { fontSize: 12, fontWeight: '600', paddingHorizontal: 14, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600' },
  rowSchool: { fontSize: 11, marginTop: 1 },
  checkmark: { fontSize: 14, fontWeight: '700' },
});
