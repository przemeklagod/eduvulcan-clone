import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Announcement } from '@/src/api/hebe/types/announcement';
import { useAnnouncements } from '@/src/data/useAnnouncements';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';
import { htmlToPlainText } from '@/src/utils/richText';

export default function AnnouncementsScreen() {
  const colors = useThemeColors();
  const { announcements, isLoading, isRefetching, error, refetch, hasActiveStudent } = useAnnouncements();

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
          {error instanceof Error ? error.message : 'Błąd ładowania ogłoszeń'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList<Announcement>
      style={[styles.list, { backgroundColor: colors.background }]}
      data={announcements}
      keyExtractor={(item) => String(item.Id)}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      renderItem={({ item }) => (
        <View style={[styles.card, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{item.Title}</Text>
          <Text style={[styles.meta, { color: colors.secondaryText }]}>
            {item.Sender.DisplayName} · {formatHebeDate(item.CreatedAt)}
          </Text>
          <Text style={[styles.content, { color: colors.text }]}>{htmlToPlainText(item.Content)}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak ogłoszeń.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  card: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 12, marginTop: 2, marginBottom: 8 },
  content: { fontSize: 14, lineHeight: 20 },
});
