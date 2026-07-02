import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccounts } from '@/src/auth/accountsContext';

interface Row {
  tenant: string;
  pupilId: number;
  label: string;
  schoolName: string;
}

export default function SettingsScreen() {
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
    Alert.alert('Wyloguj', 'Usunąć to konto z urządzenia?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await logout(tenant);
          if (tenants.length <= 1) router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <FlatList<Row>
      style={styles.list}
      data={rows}
      keyExtractor={(item) => `${item.tenant}:${item.pupilId}`}
      renderItem={({ item }) => {
        const isActive = active?.tenant === item.tenant && active.pupilId === item.pupilId;
        return (
          <Pressable
            style={[styles.row, isActive && styles.rowActive]}
            onPress={() => setActive({ tenant: item.tenant, pupilId: item.pupilId })}
          >
            <View style={styles.rowInfo}>
              <Text style={styles.name}>{item.label}</Text>
              <Text style={styles.school}>{item.schoolName}</Text>
            </View>
            {isActive && <Text style={styles.activeBadge}>aktywne</Text>}
            <Pressable onPress={() => confirmLogout(item.tenant)} hitSlop={12}>
              <Text style={styles.removeLabel}>Usuń</Text>
            </Pressable>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text>Brak zarejestrowanych kont.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowActive: { backgroundColor: '#eef4ff' },
  rowInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  school: { fontSize: 12, color: '#888' },
  activeBadge: { fontSize: 12, color: '#2f6fed', fontWeight: '600' },
  removeLabel: { fontSize: 13, color: '#d33' },
});
