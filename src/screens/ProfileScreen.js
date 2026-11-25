import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, clearSession } from '../api';
import { APP_NAME } from '../brand';
import { useAuth } from '../auth';
import { colors } from '../theme';

function PasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setError('');
    setSaved('');
    if (newPassword !== confirmPassword) {
      setError('The new password and the confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/auth/password', { method: 'POST', body: { currentPassword, newPassword } });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved('Password changed.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>Change password</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {saved ? <Text style={styles.saved}>{saved}</Text> : null}
      <Text style={styles.label}>Current password</Text>
      <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry autoCapitalize="none" />
      <Text style={styles.label}>New password</Text>
      <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry autoCapitalize="none" />
      <Text style={styles.label}>Confirm new password</Text>
      <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
      <Pressable style={styles.save} disabled={busy} onPress={save}>
        <Text style={styles.saveText}>{busy ? 'Saving…' : 'Change password'}</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, setUser } = useAuth();

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // The session is cleared either way.
    }
    await clearSession();
    setUser(null);
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.name}>{user.role === 'owner' ? 'Admin' : user.name}</Text>
        <Text style={styles.role}>{user.role === 'owner' ? 'Admin' : 'Manager'}</Text>
        {user.username ? <Text style={styles.meta}>{user.username}</Text> : null}
      </View>
      {user.role === 'owner' ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Masters</Text>
          <Pressable onPress={() => navigation.navigate('Parties')}><Text style={styles.menu}>Parties and units</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('RrMaster')}><Text style={styles.menu}>RR Master</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('UploadedPdfs')}><Text style={styles.menu}>Uploaded PDFs</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('Managers')}><Text style={styles.menu}>Managers</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('Audit')}><Text style={styles.menu}>Audit log</Text></Pressable>
        </View>
      ) : null}
      <PasswordChange />
      <Pressable style={styles.button} onPress={logout}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 16 },
  form: { backgroundColor: colors.panel, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.line, gap: 6 },
  formTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 4 },
  menu: { color: colors.greenDeep, fontWeight: '800', paddingVertical: 6 },
  label: { marginTop: 8, fontWeight: '700', color: colors.ink },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, color: colors.ink },
  save: { marginTop: 12, backgroundColor: colors.green, borderRadius: 14, padding: 14, alignItems: 'center' },
  saveText: { color: colors.onYellow, fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
  saved: { backgroundColor: colors.okSoft, color: colors.ok, padding: 12, borderRadius: 12 },
  card: { backgroundColor: colors.greenDeep, borderRadius: 20, padding: 22, gap: 6 },
  brand: { color: colors.gold, fontWeight: '700', letterSpacing: 0.6 },
  name: { color: colors.paper, fontSize: 30, fontWeight: '700' },
  role: { alignSelf: 'flex-start', color: colors.greenDeep, backgroundColor: colors.gold, fontWeight: '700', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden', marginTop: 6 },
  meta: { color: '#EDE9FE', marginTop: 8 },
  button: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, alignItems: 'center' },
  buttonText: { color: colors.danger, fontWeight: '700' },
});
