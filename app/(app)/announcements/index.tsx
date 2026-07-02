import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Announcement } from '@/src/api/hebe/types/announcement';
import { useAnnouncements } from '@/src/data/useAnnouncements';
import { formatHebeDate } from '@/src/utils/dates';

export default function AnnouncementsScreen() {
  const { announcements, isLoading, isRefetching, error, refetch, hasActiveStudent } = useAnnouncements();

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
        <Text style={styles.error}>{error instanceof Error ? error.message : 'Błąd ładowania ogłoszeń'}</Text>
      </View>
    );
  }

  return (
    <FlatList<Announcement>
      style={styles.list}
      data={announcements}
      keyExtractor={(item) => String(item.Id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.Title}</Text>
          <Text style={styles.meta}>
            {item.Sender.DisplayName} · {formatHebeDate(item.CreatedAt)}
          </Text>
          <Text style={styles.content}>{item.Content}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text>Brak ogłoszeń.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#d33', textAlign: 'center' },
  card: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12, color: '#888', marginTop: 2, marginBottom: 8 },
  content: { fontSize: 14, color: '#333' },
});
