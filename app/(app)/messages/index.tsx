import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Message } from '@/src/api/hebe/types/message';
import { useMessages, type MessageFolder } from '@/src/data/useMessages';
import { formatHebeDate } from '@/src/utils/dates';

const FOLDERS: { key: MessageFolder; label: string }[] = [
  { key: 'received', label: 'Odebrane' },
  { key: 'sent', label: 'Wysłane' },
  { key: 'deleted', label: 'Usunięte' },
];

export default function MessagesScreen() {
  const [folder, setFolder] = useState<MessageFolder>('received');
  const { messages, isLoading, isRefetching, error, refetch, hasActiveStudent } = useMessages(folder);

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {FOLDERS.map((f) => (
          <Pressable key={f.key} style={[styles.tab, folder === f.key && styles.tabActive]} onPress={() => setFolder(f.key)}>
            <Text style={[styles.tabLabel, folder === f.key && styles.tabLabelActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      {!hasActiveStudent ? (
        <View style={styles.center}>
          <Text>Brak zarejestrowanego ucznia.</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error instanceof Error ? error.message : 'Błąd ładowania wiadomości'}</Text>
        </View>
      ) : (
        <FlatList<Message>
          data={messages}
          keyExtractor={(item) => item.Id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => (
            <View style={styles.messageRow}>
              <View style={styles.messageHeader}>
                <Text style={styles.sender} numberOfLines={1}>
                  {item.Sender.Name}
                </Text>
                <Text style={styles.date}>{formatHebeDate(item.SentAt)}</Text>
              </View>
              <Text style={styles.subject} numberOfLines={1}>
                {item.Subject}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text>Brak wiadomości.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { color: '#d33', textAlign: 'center' },
  tabBar: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2f6fed' },
  tabLabel: { color: '#888' },
  tabLabelActive: { color: '#2f6fed', fontWeight: '600' },
  messageRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sender: { fontWeight: '600', flex: 1, marginRight: 8 },
  date: { fontSize: 12, color: '#888' },
  subject: { color: '#444', marginTop: 2 },
});
