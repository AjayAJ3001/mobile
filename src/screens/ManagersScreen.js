import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, formatWhen } from '../api';
import { colors } from '../theme';

const empty = { name: '', username: '', password: '' };

export default function ManagersScreen() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api('/api/users').then((data) => setUsers(data.users || [])).catch((err) => setError(err.message));
  }, []);

  useFocusEffect(load);

  async function createUser() {
    setBusy(true);
    setError('');
    try {
      await api('/api/users', { method: 'POST', body: form });
      setForm(empty);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setError('');
    try {
      await api(`/api/users/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>Managers can log in on the admin panel and the mobile app.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <TextInput style={styles.input} value={form.name} onChangeText={(name) => setForm({ ...form, name })} placeholder="Name" placeholderTextColor={colors.muted} autoComplete="off" textContentType="none" importantForAutofill="no" />
        <TextInput style={styles.input} value={form.username} onChangeText={(username) => setForm({ ...form, username })} placeholder="Username" placeholderTextColor={colors.muted} autoCapitalize="none" autoComplete="off" textContentType="none" importantForAutofill="no" />
        <TextInput style={styles.input} value={form.password} onChangeText={(password) => setForm({ ...form, password })} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" autoComplete="off" textContentType="none" importantForAutofill="no" />
        <Pressable style={styles.button} disabled={busy} onPress={createUser}><Text style={styles.buttonText}>{busy ? 'Adding…' : 'Add manager'}</Text></Pressable>
      </View>
      {users.map((person) => (
        <View key={person.id} style={styles.card}>
          <Text style={styles.name}>{person.role === 'owner' ? 'Admin' : person.name}</Text>
          <Text style={styles.meta}>{person.username} · {person.role === 'owner' ? 'Admin' : 'Manager'}</Text>
          <Text style={styles.meta}>{person.receipt_count} RR · {formatWhen(person.created_at)}</Text>
          {person.role === 'manager' ? (
            <Pressable style={styles.remove} onPress={() => remove(person.id)}><Text style={styles.removeText}>Remove</Text></Pressable>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  lead: { color: colors.muted },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, color: colors.ink },
  button: { backgroundColor: colors.green, borderRadius: 12, padding: 12, alignItems: 'center' },
  buttonText: { color: colors.onYellow, fontWeight: '700' },
  name: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  meta: { color: colors.muted },
  remove: { alignSelf: 'flex-start', backgroundColor: colors.danger, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  removeText: { color: '#fff', fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
