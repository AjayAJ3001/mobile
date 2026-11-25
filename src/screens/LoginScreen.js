import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { api, loadSession, saveSession } from '../api';
import { APP_NAME } from '../brand';
import { colors } from '../theme';
import { useAuth } from '../auth';

const shed = require('../../assets/shed-bg.jpg');

export default function LoginScreen() {
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSession();
  }, []);

  async function login() {
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { username: username.trim(), password } });
      await saveSession(data.token, data.user);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Image source={shed} style={styles.photo} resizeMode="cover" />
      <View style={styles.card}>
        <Text style={styles.kicker}>RAILWAY GOODS OFFICE</Text>
        <Text style={styles.hero}>{APP_NAME}</Text>
        <Text style={styles.lead}>Sign in to the shed.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>Username</Text>
        <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} />
        <Pressable style={styles.button} disabled={busy} onPress={login}>
          <Text style={styles.buttonText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.greenDeep },
  photo: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  kicker: { color: colors.gold, letterSpacing: 1.6, fontSize: 12, fontWeight: '700' },
  hero: { color: colors.greenDeep, fontSize: 30, fontWeight: '800', marginTop: 4, marginBottom: 4 },
  card: {
    position: 'absolute',
    left: 22,
    right: 22,
    top: '22%',
    zIndex: 2,
    elevation: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    padding: 22,
  },
  lead: { color: colors.muted, marginBottom: 4 },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '700', color: colors.ink },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, color: colors.ink, fontSize: 16 },
  button: { marginTop: 18, backgroundColor: colors.green, borderRadius: 14, padding: 14, alignItems: 'center' },
  buttonText: { color: colors.onYellow, fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12, marginTop: 10 },
});
