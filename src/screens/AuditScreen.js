import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { colors } from '../theme';

function when(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '—' };
  const options = { timeZone: 'Asia/Kolkata' };
  return {
    date: date.toLocaleDateString('en-IN', { ...options, day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { ...options, hour: '2-digit', minute: '2-digit' }),
  };
}

function roleName(role) {
  if (role === 'owner') return 'Admin';
  if (role === 'manager') return 'Manager';
  return 'Unknown';
}

function kind(action) {
  return /signed|sign-in|viewed|opened/i.test(action) ? 'Accessed' : 'Used';
}

function LogList({ rows }) {
  if (!rows.length) return <Text style={styles.meta}>No activity yet.</Text>;
  return rows.map((item) => {
    const stamp = when(item.at);
    return (
      <View key={item.id} style={styles.row}>
        <Text style={styles.when}>{stamp.date} · {stamp.time}</Text>
        <Text style={styles.who}>{item.name} · {roleName(item.role)}</Text>
        <Text style={styles.kind}>{kind(item.action)}</Text>
        <Text style={styles.what}>{item.action}{item.detail ? ` — ${item.detail}` : ''}</Text>
      </View>
    );
  });
}

export default function AuditScreen() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');
  const [source, setSource] = useState('mobile');

  useFocusEffect(useCallback(() => {
    api('/api/audit-logs').then((data) => setLogs(data.logs || [])).catch((err) => setError(err.message));
  }, []));

  const admin = logs.filter((item) => item.source === 'admin');
  const mobile = logs.filter((item) => item.source !== 'admin');

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.lead}>Who signed in, and what the admin or a manager did, with the date and time.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.choices}>
        <Pressable style={[styles.choice, source === 'mobile' && styles.choiceOn]} onPress={() => setSource('mobile')}>
          <Text style={[styles.choiceText, source === 'mobile' && styles.choiceTextOn]}>Mobile app</Text>
        </Pressable>
        <Pressable style={[styles.choice, source === 'admin' && styles.choiceOn]} onPress={() => setSource('admin')}>
          <Text style={[styles.choiceText, source === 'admin' && styles.choiceTextOn]}>Admin panel</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>{source === 'mobile' ? 'Mobile app' : 'Admin panel'}</Text>
        <LogList rows={source === 'mobile' ? mobile : admin} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  lead: { color: colors.muted },
  choices: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  choiceOn: { backgroundColor: colors.greenDeep, borderColor: colors.greenDeep },
  choiceText: { color: colors.ink, fontWeight: '800' },
  choiceTextOn: { color: '#fff' },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 10 },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  row: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 2 },
  when: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  who: { color: colors.ink, fontWeight: '800' },
  kind: { color: colors.greenDeep, fontWeight: '700' },
  what: { color: colors.ink },
  meta: { color: colors.muted },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
