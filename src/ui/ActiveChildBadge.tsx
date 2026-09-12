import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccounts } from '../auth/accountsContext';
import type { ActiveSelection } from '../auth/accountsContext';
import { librusChildKey } from '../auth/credentialStore';
import { useThemeColors } from './theme';

interface Row {
  key: string;
  selection: ActiveSelection;
  label: string;
  schoolName: string;
}

function isSameSelection(a: ActiveSelection | null, b: ActiveSelection): boolean {
  if (!a || a.provider !== b.provider) return false;
  if (a.provider === 'vulcan' && b.provider === 'vulcan') return a.tenant === b.tenant && a.pupilId === b.pupilId;
  if (a.provider === 'librus' && b.provider === 'librus') return a.portalEmail === b.portalEmail && a.childId === b.childId;
  return false;
}

export function ActiveChildBadge() {
  const colors = useThemeColors();
  const { tenants, librusAccounts, active, setActive, hiddenChildren } = useAccounts();
  const [open, setOpen] = useState(false);

  const vulcanRows: Row[] = tenants.flatMap((t) =>
    t.students
      .filter((s) => !hiddenChildren.has(`${t.credential.tenant}:${s.Pupil.Id}`))
      .map((s) => ({
        key: `vulcan:${t.credential.tenant}:${s.Pupil.Id}`,
        selection: { provider: 'vulcan' as const, tenant: t.credential.tenant, pupilId: s.Pupil.Id },
        label: `${s.Pupil.FirstName} ${s.Pupil.Surname}`,
        schoolName: s.Unit.DisplayName,
      }))
  );

  const librusRows: Row[] = librusAccounts.flatMap((a) =>
    a.children
      .filter((c) => !hiddenChildren.has(librusChildKey(c.id)))
      .map((c) => ({
        key: `librus:${a.portalEmail}:${c.id}`,
        selection: { provider: 'librus' as const, portalEmail: a.portalEmail, childId: c.id },
        label: c.studentName,
        schoolName: 'Librus',
      }))
  );

  const rows = [...vulcanRows, ...librusRows];

  if (rows.length === 0) return null;

  const activeRow = rows.find((r) => isSameSelection(active, r.selection));

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
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const isActive = isSameSelection(active, item.selection);
                return (
                  <Pressable
                    style={[styles.row, { borderBottomColor: colors.border }, isActive && { backgroundColor: colors.card }]}
                    onPress={() => {
                      setActive(item.selection);
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
