import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { Message } from '@/src/api/hebe/types/message';
import { useActiveCredential } from '@/src/auth/accountsContext';
import { useMessages, type MessageFolder } from '@/src/data/useMessages';
import { ComposeMessageModal, type ComposeTarget } from '@/src/ui/ComposeMessageModal';
import { useThemeColors } from '@/src/ui/theme';
import { formatHebeDate } from '@/src/utils/dates';
import { htmlToPlainText } from '@/src/utils/richText';

const FOLDERS: { key: MessageFolder; label: string }[] = [
  { key: 'received', label: 'Odebrane' },
  { key: 'sent', label: 'Wysłane' },
  { key: 'deleted', label: 'Usunięte' },
];

export default function MessagesScreen() {
  const colors = useThemeColors();
  const activeInfo = useActiveCredential();
  const student = activeInfo?.students.find((s) => s.Pupil.Id === activeInfo.pupilId);
  const myBoxKey = student?.MessageBox?.GlobalKey;
  const myBoxName = student?.MessageBox?.Name;

  const [folder, setFolder] = useState<MessageFolder>('received');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composeTarget, setComposeTarget] = useState<ComposeTarget | null>(null);
  const { messages, isLoading, isRefetching, error, refetch, hasActiveStudent } = useMessages(folder);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.tabBar}>
          {FOLDERS.map((f) => (
            <Pressable key={f.key} style={[styles.tab, folder === f.key && { borderBottomWidth: 2, borderBottomColor: colors.accent }]} onPress={() => setFolder(f.key)}>
              <Text style={[styles.tabLabel, { color: folder === f.key ? colors.accent : colors.secondaryText }, folder === f.key && styles.tabLabelActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {myBoxKey && myBoxName && (
          <Pressable style={styles.newButton} onPress={() => setComposeTarget({ boxKey: myBoxKey, senderName: myBoxName })}>
            <Text style={[styles.newButtonLabel, { color: colors.accent }]}>Nowa wiadomość</Text>
          </Pressable>
        )}
      </View>

      {!hasActiveStudent ? (
        <View style={styles.center}>
          <Text style={{ color: colors.text }}>Brak zarejestrowanego ucznia.</Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.error, { color: colors.danger }]}>
            {error instanceof Error ? error.message : 'Błąd ładowania wiadomości'}
          </Text>
        </View>
      ) : (
        <FlatList<Message>
          data={messages}
          keyExtractor={(item) => item.Id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const expanded = expandedId === item.Id;
            return (
              <Pressable
                style={[styles.messageRow, { borderBottomColor: colors.border }]}
                onPress={() => setExpandedId(expanded ? null : item.Id)}
              >
                <View style={styles.messageHeader}>
                  <Text style={[styles.sender, { color: colors.text }]} numberOfLines={1}>
                    {item.Sender.Name}
                  </Text>
                  <Text style={[styles.date, { color: colors.secondaryText }]}>{formatHebeDate(item.SentAt)}</Text>
                </View>
                <Text style={[styles.subject, { color: colors.secondaryText }]} numberOfLines={expanded ? undefined : 1}>
                  {item.Subject}
                </Text>
                {expanded && (
                  <>
                    <Text style={[styles.content, { color: colors.text }]} selectable>
                      {htmlToPlainText(item.Content)}
                    </Text>
                    {myBoxKey && myBoxName && folder === 'received' && (
                      <Pressable
                        style={styles.replyButton}
                        onPress={() =>
                          setComposeTarget({
                            boxKey: myBoxKey,
                            senderName: myBoxName,
                            threadKey: item.ThreadKey,
                            initialSubject: item.Subject.startsWith('RE:') ? item.Subject : `RE: ${item.Subject}`,
                            recipient: { globalKey: item.Sender.GlobalKey, name: item.Sender.Name },
                          })
                        }
                      >
                        <Text style={[styles.replyButtonLabel, { color: colors.accent }]}>Odpowiedz</Text>
                      </Pressable>
                    )}
                  </>
                )}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.text }}>Brak wiadomości.</Text>
            </View>
          }
        />
      )}

      <ComposeMessageModal
        visible={composeTarget !== null}
        target={composeTarget}
        onClose={() => setComposeTarget(null)}
        onSent={() => setFolder('sent')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  error: { textAlign: 'center' },
  topBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabBar: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabLabel: { fontSize: 14 },
  tabLabelActive: { fontWeight: '600' },
  newButton: { alignItems: 'center', paddingVertical: 10 },
  newButtonLabel: { fontWeight: '600', fontSize: 13 },
  messageRow: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  messageHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  sender: { fontWeight: '600', flex: 1, marginRight: 8 },
  date: { fontSize: 12 },
  subject: { marginTop: 2 },
  content: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  replyButton: { marginTop: 12, alignSelf: 'flex-start' },
  replyButtonLabel: { fontWeight: '600', fontSize: 13 },
});
