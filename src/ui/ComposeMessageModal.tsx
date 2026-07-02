import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Address } from '../api/hebe/types/common';
import { useAddressBook } from '../data/useAddressBook';
import { useSendMessage } from '../data/useSendMessage';
import { useThemeColors } from './theme';

export interface ComposeTarget {
  boxKey: string;
  threadKey?: string;
  initialSubject?: string;
  /** Locked recipient (reply) - if omitted, the user picks one from the address book (compose). */
  recipient?: { globalKey: string; name: string };
}

interface Props {
  visible: boolean;
  target: ComposeTarget | null;
  onClose: () => void;
  onSent: () => void;
}

export function ComposeMessageModal({ visible, target, onClose, onSent }: Props) {
  const colors = useThemeColors();
  const { addresses, isLoading: loadingAddresses } = useAddressBook();
  const { send, isSending, error } = useSendMessage();

  const [recipient, setRecipient] = useState<{ globalKey: string; name: string } | null>(null);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const isReply = Boolean(target?.recipient);
  const effectiveRecipient = target?.recipient ?? recipient;

  const resetAndClose = () => {
    setRecipient(null);
    setSubject('');
    setContent('');
    setPickerOpen(false);
    onClose();
  };

  const onOpen = () => {
    setSubject(target?.initialSubject ?? '');
    setContent('');
    setRecipient(null);
  };

  const onSubmit = async () => {
    if (!target || !effectiveRecipient || !subject.trim() || !content.trim()) return;
    await send({
      boxKey: target.boxKey,
      threadKey: target.threadKey,
      subject: subject.trim(),
      content: content.trim(),
      receivers: [effectiveRecipient],
    });
    resetAndClose();
    onSent();
  };

  return (
    <Modal visible={visible} animationType="slide" onShow={onOpen} onRequestClose={resetAndClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={resetAndClose}>
            <Text style={[styles.headerButton, { color: colors.accent }]}>Anuluj</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{isReply ? 'Odpowiedz' : 'Nowa wiadomość'}</Text>
          <Pressable onPress={onSubmit} disabled={isSending || !effectiveRecipient || !subject.trim() || !content.trim()}>
            {isSending ? (
              <ActivityIndicator />
            ) : (
              <Text style={[styles.headerButton, { color: colors.accent }]}>Wyślij</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.body}>
          <Pressable
            style={[styles.field, { borderBottomColor: colors.border }]}
            onPress={() => !isReply && setPickerOpen(true)}
            disabled={isReply}
          >
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Do</Text>
            <Text style={[styles.fieldValue, { color: effectiveRecipient ? colors.text : colors.placeholder }]}>
              {effectiveRecipient?.name ?? 'Wybierz odbiorcę…'}
            </Text>
          </Pressable>

          <View style={[styles.field, { borderBottomColor: colors.border }]}>
            <Text style={[styles.fieldLabel, { color: colors.secondaryText }]}>Temat</Text>
            <TextInput
              style={[styles.fieldInput, { color: colors.text }]}
              value={subject}
              onChangeText={setSubject}
              editable={!isReply}
              placeholder="Temat wiadomości"
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <TextInput
            style={[styles.contentInput, { color: colors.text }]}
            value={content}
            onChangeText={setContent}
            placeholder="Treść wiadomości…"
            placeholderTextColor={colors.placeholder}
            multiline
            textAlignVertical="top"
          />

          {error && (
            <Text style={[styles.error, { color: colors.danger }]} selectable>
              {error instanceof Error ? error.message : 'Nie udało się wysłać wiadomości'}
            </Text>
          )}
        </View>

        <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setPickerOpen(false)}>
                <Text style={[styles.headerButton, { color: colors.accent }]}>Zamknij</Text>
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Wybierz odbiorcę</Text>
              <View style={{ width: 60 }} />
            </View>
            {loadingAddresses ? (
              <View style={styles.center}>
                <ActivityIndicator />
              </View>
            ) : (
              <FlatList<Address>
                data={addresses}
                keyExtractor={(item) => item.GlobalKey}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.recipientRow, { borderBottomColor: colors.border }]}
                    onPress={() => {
                      setRecipient({ globalKey: item.GlobalKey, name: item.Name });
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={[styles.recipientName, { color: colors.text }]}>{item.Name}</Text>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Text style={{ color: colors.text }}>Brak dostępnych odbiorców.</Text>
                  </View>
                }
              />
            )}
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  body: { flex: 1, padding: 16, gap: 4 },
  field: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  fieldLabel: { fontSize: 12, marginBottom: 2 },
  fieldValue: { fontSize: 15 },
  fieldInput: { fontSize: 15, padding: 0 },
  contentInput: { flex: 1, fontSize: 15, marginTop: 12, minHeight: 160 },
  error: { marginTop: 12, fontSize: 13 },
  recipientRow: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  recipientName: { fontSize: 15 },
});
