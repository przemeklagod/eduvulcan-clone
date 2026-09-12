import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useAccounts } from '@/src/auth/accountsContext';
import type { ActiveSelection } from '@/src/auth/accountsContext';
import { librusChildKey } from '@/src/auth/credentialStore';
import { useThemeColors } from '@/src/ui/theme';

interface Row {
  key: string;
  visibilityKey: string;
  selection: ActiveSelection;
  label: string;
  schoolName: string;
  onRemove: () => void;
}

function isSameSelection(a: ActiveSelection | null, b: ActiveSelection): boolean {
  if (!a || a.provider !== b.provider) return false;
  if (a.provider === 'vulcan' && b.provider === 'vulcan') return a.tenant === b.tenant && a.pupilId === b.pupilId;
  if (a.provider === 'librus' && b.provider === 'librus') return a.portalEmail === b.portalEmail && a.childId === b.childId;
  return false;
}

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { tenants, librusAccounts, active, setActive, hiddenChildren, setChildHidden, logout, logoutLibrus } = useAccounts();
  const router = useRouter();

  const confirmLogoutTenant = (tenant: string) => {
    Alert.alert('Wyloguj', 'Usunąć to konto (i wszystkie powiązane z nim dzieci) z urządzenia?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await logout(tenant);
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const confirmLogoutLibrus = (portalEmail: string) => {
    Alert.alert('Wyloguj', 'Usunąć to konto Librus (i wszystkie powiązane z nim dzieci) z urządzenia?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await logoutLibrus(portalEmail);
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const rows: Row[] = [
    ...tenants.flatMap((t) =>
      t.students.map((s) => ({
        key: `vulcan:${t.credential.tenant}:${s.Pupil.Id}`,
        visibilityKey: `${t.credential.tenant}:${s.Pupil.Id}`,
        selection: { provider: 'vulcan' as const, tenant: t.credential.tenant, pupilId: s.Pupil.Id },
        label: `${s.Pupil.FirstName} ${s.Pupil.Surname}`,
        schoolName: s.Unit.DisplayName,
        onRemove: () => confirmLogoutTenant(t.credential.tenant),
      }))
    ),
    ...librusAccounts.flatMap((a) =>
      a.children.map((c) => ({
        key: `librus:${a.portalEmail}:${c.id}`,
        visibilityKey: librusChildKey(c.id),
        selection: { provider: 'librus' as const, portalEmail: a.portalEmail, childId: c.id },
        label: c.studentName,
        schoolName: 'Librus',
        onRemove: () => confirmLogoutLibrus(a.portalEmail),
      }))
    ),
  ];

  const confirmLogoutAll = () => {
    const uniqueTenants = [...new Set(tenants.map((t) => t.credential.tenant))];
    const uniqueLibrusEmails = [...new Set(librusAccounts.map((a) => a.portalEmail))];
    Alert.alert(
      'Wyloguj wszystkie konta',
      'Usuwa wszystkie zapisane konta z urządzenia. Po ponownym zalogowaniu dane (w tym lista dzieci) zostaną pobrane od nowa - przydatne po aktualizacji aplikacji.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyloguj wszystkie',
          style: 'destructive',
          onPress: async () => {
            for (const tenant of uniqueTenants) await logout(tenant);
            for (const email of uniqueLibrusEmails) await logoutLibrus(email);
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {rows.length > 0 && (
        <Pressable style={styles.logoutAllButton} onPress={confirmLogoutAll}>
          <Text style={[styles.logoutAllLabel, { color: colors.danger }]}>Wyloguj wszystkie konta i zaloguj ponownie</Text>
        </Pressable>
      )}
      <Pressable style={styles.addLibrusButton} onPress={() => router.push('/(auth)/librus-login')}>
        <Text style={[styles.addLibrusLabel, { color: colors.accent }]}>Dodaj konto Librus</Text>
      </Pressable>
      <FlatList<Row>
        style={styles.list}
        data={rows}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          rows.length > 0 ? (
            <Text style={[styles.sectionHint, { color: colors.secondaryText }]}>
              Ukryte dzieci znikają z przełącznika u góry ekranu, ale zostają tutaj do ponownego włączenia.
            </Text>
          ) : null
        }
        renderItem={({ item }) => {
          const isActive = isSameSelection(active, item.selection);
          const isHidden = hiddenChildren.has(item.visibilityKey);
          return (
            <Pressable
              style={[styles.row, { borderBottomColor: colors.border }, isActive && { backgroundColor: colors.card }]}
              onPress={() => setActive(item.selection)}
            >
              <View style={styles.rowInfo}>
                <Text style={[styles.name, { color: isHidden ? colors.secondaryText : colors.text }]}>{item.label}</Text>
                <Text style={[styles.school, { color: colors.secondaryText }]}>{item.schoolName}</Text>
              </View>
              {isActive && <Text style={[styles.activeBadge, { color: colors.accent }]}>aktywne</Text>}
              <Switch value={!isHidden} onValueChange={(visible) => setChildHidden(item.visibilityKey, !visible)} />
              <Pressable onPress={item.onRemove} hitSlop={12}>
                <Text style={[styles.removeLabel, { color: colors.danger }]}>Usuń</Text>
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.text }}>Brak zarejestrowanych kont.</Text>
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
  logoutAllButton: { padding: 16, alignItems: 'center' },
  logoutAllLabel: { fontWeight: '600' },
  addLibrusButton: { paddingHorizontal: 16, paddingBottom: 12, alignItems: 'center' },
  addLibrusLabel: { fontWeight: '600' },
  sectionHint: { fontSize: 12, paddingHorizontal: 16, paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  school: { fontSize: 12 },
  activeBadge: { fontSize: 12, fontWeight: '600' },
  removeLabel: { fontSize: 13 },
});
