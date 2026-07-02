import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccounts } from '@/src/auth/accountsContext';
import { useThemeColors } from '@/src/ui/theme';

interface Row {
  tenant: string;
  pupilId: number;
  label: string;
  schoolName: string;
}

export default function SettingsScreen() {
  const colors = useThemeColors();
  const { tenants, active, setActive, logout } = useAccounts();
  const router = useRouter();

  const rows: Row[] = tenants.flatMap((t) =>
    t.students.map((s) => ({
      tenant: t.credential.tenant,
      pupilId: s.Pupil.Id,
      label: `${s.Pupil.FirstName} ${s.Pupil.Surname}`,
      schoolName: s.Unit.DisplayName,
    }))
  );

  const confirmLogout = (tenant: string) => {
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

  const confirmLogoutAll = () => {
    const uniqueTenants = [...new Set(tenants.map((t) => t.credential.tenant))];
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
      <FlatList<Row>
        style={styles.list}
        data={rows}
        keyExtractor={(item) => `${item.tenant}:${item.pupilId}`}
        renderItem={({ item }) => {
          const isActive = active?.tenant === item.tenant && active.pupilId === item.pupilId;
          return (
            <Pressable
              style={[styles.row, { borderBottomColor: colors.border }, isActive && { backgroundColor: colors.card }]}
              onPress={() => setActive({ tenant: item.tenant, pupilId: item.pupilId })}
            >
              <View style={styles.rowInfo}>
                <Text style={[styles.name, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.school, { color: colors.secondaryText }]}>{item.schoolName}</Text>
              </View>
              {isActive && <Text style={[styles.activeBadge, { color: colors.accent }]}>aktywne</Text>}
              <Pressable onPress={() => confirmLogout(item.tenant)} hitSlop={12}>
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
