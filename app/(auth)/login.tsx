import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useAccounts } from '@/src/auth/accountsContext';

export default function LoginScreen() {
  const { login } = useAccounts();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const colors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#111',
    border: isDark ? '#555' : '#ccc',
    placeholder: isDark ? '#888' : '#999',
  };

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      router.replace('/(app)/grades');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Logowanie nie powiodło się');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.title, { color: colors.text }]}>eduVulcan</Text>

      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Login"
        placeholderTextColor={colors.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
        editable={!submitting}
      />
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput, { color: colors.text, borderColor: colors.border }]}
          placeholder="Hasło"
          placeholderTextColor={colors.placeholder}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          value={password}
          onChangeText={setPassword}
          editable={!submitting}
        />
        <Pressable style={styles.showPasswordButton} onPress={() => setShowPassword((v) => !v)}>
          <Text style={styles.showPasswordText}>{showPassword ? 'Ukryj' : 'Pokaż'}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.button} onPress={onSubmit} disabled={submitting || !username || !password}>
        {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Zaloguj</Text>}
      </Pressable>

      {error && <Text style={styles.error} selectable>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 24, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 16 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  passwordInput: { flex: 1 },
  showPasswordButton: { paddingHorizontal: 12, paddingVertical: 12 },
  showPasswordText: { color: '#2f6fed', fontWeight: '600' },
  button: { backgroundColor: '#2f6fed', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { color: '#d33', textAlign: 'left', fontSize: 12, marginTop: 16 },
});
