import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, formatWhen, loadWorkingReceipt, saveWorkingReceipt } from '../api';
import EntryPrompt from '../EntryPrompt';
import { useAuth } from '../auth';
import { colors } from '../theme';

function stateOf(receipt) {
  if (receipt.closed) return 'Closed RR';
  if (receipt.status === 'submitted' && receipt.started) return 'Active RR';
  if (receipt.status === 'submitted') return 'Waiting';
  return 'Needs set no';
}

function Stat({ label, value, progress, tone }) {
  return (
    <Animated.View style={[styles.stat, {
      backgroundColor: tone.bg,
      borderColor: tone.line,
      opacity: progress,
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
    }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: tone.ink }]}>{value ?? '—'}</Text>
    </Animated.View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [open, setOpen] = useState('active');
  const cards = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useFocusEffect(useCallback(() => {
    Promise.all([api('/api/dashboard'), api('/api/receipts'), loadWorkingReceipt()])
      .then(([dash, list, saved]) => {
        const rows = list.receipts || [];
        const kept = rows.some((item) => item.active && item.id === saved) ? saved : null;
        if (saved && !kept) saveWorkingReceipt(null);
        setData(dash);
        setReceipts(rows);
        setWorkingId(kept);
      })
      .catch((err) => setError(err.message));
  }, []));

  useEffect(() => {
    if (!data) return;
    cards.forEach((card) => card.setValue(0));
    Animated.stagger(80, cards.map((card) => Animated.timing(card, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }))).start();
  }, [data, cards]);

  const stats = data?.stats;
  const total = stats ? Number(stats.submitted_count || 0) + Number(stats.draft_count || 0) : null;
  const active = receipts.filter((item) => item.active);
  const waiting = receipts.filter((item) => item.status === 'submitted' && !item.started && !item.closed);
  const manager = user.role !== 'owner';
  const current = active.find((item) => item.id === workingId) || null;

  function choose(id) {
    setWorkingId(id);
    saveWorkingReceipt(id);
  }

  function requestEntry(item) {
    if (!manager && active.length < 2) {
      choose(item.id);
      return;
    }
    setPrompt({ mode: current?.id === item.id ? 'close' : 'start', id: item.id, rrNo: item.rrNo });
  }

  function confirmEntry() {
    if (!prompt) return;
    if (prompt.mode === 'close') {
      setWorkingId(null);
      saveWorkingReceipt(null);
    } else {
      choose(prompt.id);
    }
    setPrompt(null);
  }

  function reopenReceipt(id) {
    setError('');
    api(`/api/receipts/${id}/open`, { method: 'POST' })
      .then(() => api('/api/receipts'))
      .then((list) => setReceipts(list.receipts || []))
      .catch((err) => setError(err.message));
  }

  function toggle(key) {
    setOpen((current) => (current === key ? '' : key));
  }

  function startReceipt(id) {
    setError('');
    api(`/api/receipts/${id}/start`, { method: 'POST' })
      .then(() => api('/api/receipts'))
      .then((list) => {
        setReceipts(list.receipts || []);
        if (!(list.receipts || []).some((item) => item.active && item.id !== id)) choose(id);
      })
      .catch((err) => setError(err.message));
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.hello}>{user.role === 'owner' ? 'Admin' : user.name}</Text>
      <Text style={styles.role}>{user.role === 'owner' ? 'Admin' : 'Manager'}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.stats}>
        <Stat label="Total RR upload" value={total} progress={cards[0]} tone={colors.toneBlue} />
        <Stat label="Today" value={stats?.today_count} progress={cards[1]} tone={colors.toneAmber} />
        <Stat label="Saved" value={stats?.submitted_count} progress={cards[2]} tone={colors.toneTeal} />
        <Stat label="Wagons" value={stats?.wagon_count} progress={cards[3]} tone={colors.toneGreen} />
      </View>

      <View style={styles.block}>
        <Pressable style={styles.blockHead} onPress={() => toggle('active')}>
          <Text style={styles.blockTitle}>Active RR</Text>
          <View style={[styles.dashChevron, open === 'active' && styles.dashChevronUp]} />
        </Pressable>
        {open === 'active' ? (<>
        {active.length ? active.map((item) => {
          const started = current?.id === item.id;
          return (
            <View key={item.id} style={[styles.pick, started && styles.pickOn]}>
              <Pressable onPress={() => requestEntry(item)} style={user.role === 'owner' ? styles.pickBody : null}>
                <Text style={styles.rowTitle}>{item.rrNo}</Text>
                <Text style={styles.meta}>{item.stationFrom} → {item.stationTo}</Text>
                <Text style={started ? styles.startedMark : styles.startMark}>{started ? 'Entry started' : 'Start the entry'}</Text>
              </Pressable>
              {user.role === 'owner' ? (
                <Pressable style={styles.closeCorner} onPress={() => navigation.navigate('RrClose', { id: item.id })}>
                  <Text style={styles.closeText}>RR closed</Text>
                </Pressable>
              ) : null}
            </View>
          );
        }) : null}
        {current ? (
          <View style={styles.startedBox}>
            <Pressable onPress={() => navigation.navigate('Receipt', { id: current.id })}>
              <Text style={styles.rr}>{current.rrNo}</Text>
              <Text style={styles.open}>Active RR</Text>
              <Text style={styles.line}>{current.stationFrom} → {current.stationTo}</Text>
              <Text style={styles.meta}>{current.commodityDescription}</Text>
              <Text style={styles.meta}>{current.partyName || 'Party not entered'} · {current.rrDate} · {current.wagonCount} wagons</Text>
            </Pressable>
          </View>
        ) : active.length ? (
          <Text style={styles.meta}>Choose the RR you want to start.</Text>
        ) : (
          <Text style={styles.meta}>No active RR. An admin starts an uploaded RR before truck and load entry.</Text>
        )}
        {user.role === 'owner' ? waiting.map((item) => (
          <View key={item.id} style={styles.pick}>
            <Text style={styles.rowTitle}>{item.rrNo}</Text>
            <Text style={styles.meta}>Waiting for the admin to start</Text>
            <Pressable style={styles.start} onPress={() => startReceipt(item.id)}>
              <Text style={styles.startText}>Start RR</Text>
            </Pressable>
          </View>
        )) : null}
        </>) : null}
      </View>

      <View style={styles.block}>
        <Pressable style={styles.blockHead} onPress={() => toggle('list')}>
          <Text style={styles.blockTitle}>List of RR</Text>
          <View style={[styles.dashChevron, open === 'list' && styles.dashChevronUp]} />
        </Pressable>
        {open === 'list' ? (<>
        <Pressable onPress={() => navigation.navigate('Receipts')}><Text style={styles.link}>Register</Text></Pressable>
        {receipts.slice(0, 6).map((item) => (
          <View key={item.id} style={styles.row}>
            <Pressable style={styles.rowBody} onPress={() => navigation.navigate('Receipt', { id: item.id })}>
              <Text style={styles.rowTitle}>{item.rrNo}</Text>
              <Text style={styles.meta}>{item.stationFrom} → {item.stationTo}</Text>
              <Text style={styles.meta}>{item.partyName || 'Party not entered'} · {formatWhen(item.uploadedAt)}</Text>
            </Pressable>
            {user.role === 'owner' && item.closed ? (
              <Pressable style={styles.reopen} onPress={() => reopenReceipt(item.id)}>
                <Text style={styles.reopenText}>Reopen</Text>
              </Pressable>
            ) : (
              <Text style={item.closed ? styles.closed : item.started ? styles.open : styles.waiting}>{stateOf(item)}</Text>
            )}
          </View>
        ))}
        {!receipts.length && !error ? <Text style={styles.meta}>No RR yet.</Text> : null}
        </>) : null}
      </View>

      {user.role === 'owner' ? (
        <View style={styles.block}>
          <Pressable style={styles.blockHead} onPress={() => toggle('report')}>
            <Text style={styles.blockTitle}>Report</Text>
            <View style={[styles.dashChevron, open === 'report' && styles.dashChevronUp]} />
          </Pressable>
          {open === 'report' ? (
            <Pressable onPress={() => navigation.navigate('Reports')}>
              <Text style={styles.meta}>Open the report to view, print, share, or download.</Text>
              <Text style={styles.link}>Open</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {user.role === 'owner' ? (
        <View style={styles.block}>
          <Pressable style={styles.blockHead} onPress={() => toggle('masters')}>
            <Text style={styles.blockTitle}>Masters</Text>
            <View style={[styles.dashChevron, open === 'masters' && styles.dashChevronUp]} />
          </Pressable>
          {open === 'masters' ? (<>
          <Pressable style={styles.master} onPress={() => navigation.navigate('Parties')}><Text style={styles.rowTitle}>Parties and units</Text><Text style={styles.link}>Open</Text></Pressable>
          <Pressable style={styles.master} onPress={() => navigation.navigate('RrMaster')}><Text style={styles.rowTitle}>RR Master</Text><Text style={styles.link}>Open</Text></Pressable>
          <Pressable style={styles.master} onPress={() => navigation.navigate('UploadedPdfs')}><Text style={styles.rowTitle}>Uploaded PDFs</Text><Text style={styles.link}>Open</Text></Pressable>
          <Pressable style={styles.master} onPress={() => navigation.navigate('Managers')}><Text style={styles.rowTitle}>Managers</Text><Text style={styles.link}>Open</Text></Pressable>
          <Pressable style={styles.master} onPress={() => navigation.navigate('Audit')}><Text style={styles.rowTitle}>Audit log</Text><Text style={styles.link}>Open</Text></Pressable>
          </>) : null}
        </View>
      ) : null}
      <EntryPrompt prompt={prompt} onExit={() => setPrompt(null)} onConfirm={confirmEntry} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  hello: { fontSize: 28, fontWeight: '800', color: colors.ink },
  role: { color: colors.muted, fontWeight: '700', marginTop: -6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47%', backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line },
  statLabel: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.greenDeep, marginTop: 4 },
  block: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  headToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  closeCorner: { position: 'absolute', top: 10, right: 10, zIndex: 1, backgroundColor: colors.danger, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  pickBody: { paddingRight: 96 },
  startedBox: { position: 'relative' },
  dashChevron: { width: 10, height: 10, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.greenDeep, transform: [{ rotate: '45deg' }], marginTop: -4 },
  dashChevronUp: { transform: [{ rotate: '-135deg' }], marginTop: 4 },
  blockTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  link: { color: colors.greenDeep, fontWeight: '700' },
  rr: { fontSize: 24, fontWeight: '800', color: colors.ink },
  line: { color: colors.ink, fontWeight: '700' },
  meta: { color: colors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { fontWeight: '800', color: colors.ink },
  master: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  pick: { position: 'relative', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, gap: 2 },
  pickOn: { borderColor: colors.ok, backgroundColor: colors.okSoft },
  startedMark: { alignSelf: 'flex-start', backgroundColor: colors.ok, color: '#fff', fontWeight: '800', borderRadius: 8, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4 },
  startMark: { alignSelf: 'flex-start', backgroundColor: colors.greenDeep, color: '#fff', fontWeight: '800', borderRadius: 8, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 4 },
  start: { marginTop: 8, backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  startText: { color: colors.onYellow, fontWeight: '800' },
  waiting: { color: colors.greenDeep, fontWeight: '700' },
  closeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  open: { color: colors.ok, fontWeight: '700' },
  reopen: { backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  reopenText: { color: colors.onYellow, fontWeight: '800', fontSize: 12 },
  closed: { color: colors.danger, fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
