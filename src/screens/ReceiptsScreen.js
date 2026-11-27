import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, formatWhen } from '../api';
import { useAuth } from '../auth';
import { colors } from '../theme';
import { downloadRrBags, printRrBags, shareRrBags } from '../rrBagFile';

function stateOf(item) {
  if (item.closed) return 'Closed RR';
  if (item.status === 'submitted' && item.started) return 'Active RR';
  if (item.status === 'submitted') return 'Waiting';
  return 'Needs set no';
}

export default function ReceiptsScreen({ navigation }) {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run(action, item) {
    setError('');
    setBusy(true);
    try {
      await action(item);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const load = useCallback((query) => {
    const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    api(`/api/receipts${suffix}`).then((data) => setReceipts(data.receipts)).catch((err) => setError(err.message));
  }, []);

  useFocusEffect(useCallback(() => { load(q); }, [load, q]));

  async function startReceipt(id) {
    setError('');
    try {
      await api(`/api/receipts/${id}/start`, { method: 'POST' });
      load(q);
    } catch (err) {
      setError(err.message);
    }
  }

  async function openReceipt(id) {
    setError('');
    try {
      await api(`/api/receipts/${id}/open`, { method: 'POST' });
      load(q);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <FlatList
      data={receipts}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.page}
      ListHeaderComponent={(
        <View>
          <Text style={styles.kicker}>Railway receipts</Text>
          <Text style={styles.heading}>RR register</Text>
          <Text style={styles.lead}>Open and closed railway receipts, with the date each one was uploaded.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput style={styles.input} value={q} onChangeText={setQ} placeholder="Search RR, party, commodity" />
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Pressable onPress={() => navigation.navigate('Receipt', { id: item.id })}>
            <View style={styles.titleRow}>
              <Text style={styles.rr}>{item.rrNo}</Text>
              <Text style={item.closed ? styles.closed : item.started ? styles.live : styles.waiting}>{stateOf(item)}</Text>
            </View>
            <Text>{item.commodityDescription}</Text>
            <Text style={styles.muted}>{item.stationFrom} → {item.stationTo} · {item.wagonCount} wagons</Text>
            <Text style={styles.muted}>{item.partyName || 'Party not entered'} · {formatWhen(item.uploadedAt)}</Text>
          </Pressable>
          <View style={styles.bags}>
            <View style={styles.bagBox}>
              <Text style={styles.bagLabel}>Total bags</Text>
              <Text style={styles.bagValue}>{item.totalBags ?? 0}</Text>
            </View>
            <View style={styles.bagBox}>
              <Text style={styles.bagLabel}>Bags taken</Text>
              <Text style={[styles.bagValue, { color: colors.ok }]}>{item.bagsTaken ?? 0}</Text>
            </View>
            <View style={styles.bagBox}>
              <Text style={styles.bagLabel}>Balance</Text>
              <Text style={[styles.bagValue, (item.balanceBags ?? 0) < 0 && { color: colors.danger }]}>{item.balanceBags ?? 0}</Text>
            </View>
          </View>
          <Pressable style={styles.vehicleHead} onPress={() => setOpenId(openId === item.id ? null : item.id)}>
            <Text style={styles.vehicleTitle}>{item.vehicleCount || 0} vehicles took bags</Text>
            <Text style={styles.vehicleToggle}>{openId === item.id ? 'Hide' : 'Show'}</Text>
          </Pressable>
          {openId === item.id ? (
            <>
              <Text style={styles.subHead}>Set-wise bags</Text>
              {item.sets?.length ? (
                <View style={styles.vehicleList}>
                  {item.sets.map((set) => (
                    <View key={set.setNo} style={styles.vehicleRow}>
                      <Text style={styles.vehicleNo}>Set {set.setNo} <Text style={styles.muted}>· {set.vehicleCount} vehicles</Text></Text>
                      <Text style={styles.setNums}>{set.bagsTaken} / {set.totalBags} · Bal {set.balanceBags}</Text>
                    </View>
                  ))}
                </View>
              ) : <Text style={styles.muted}>No sets.</Text>}
              <Text style={styles.subHead}>Vehicles</Text>
              {item.vehicles?.length ? (
                <View style={styles.vehicleList}>
                  {item.vehicles.map((v) => (
                    <View key={`${v.sno}-${v.truckNo}`} style={styles.vehicleRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleNo}>{v.sno}. {v.truckNo} <Text style={styles.muted}>· Trip {v.trip}</Text></Text>
                        <Text style={styles.muted}>Set {v.setNo} · Wagon {v.wagonNo || '—'}{v.deliveryTo ? ` · ${v.deliveryTo}` : ''}</Text>
                      </View>
                      <Text style={styles.vehicleBags}>{v.bags} bags</Text>
                    </View>
                  ))}
                </View>
              ) : <Text style={styles.muted}>No vehicle has taken bags yet.</Text>}
            </>
          ) : null}
          <View style={styles.actions}>
            <Pressable style={styles.action} disabled={busy} onPress={() => navigation.navigate('RrBagView', { rr: item })}>
              <Text style={styles.actionText}>View</Text>
            </Pressable>
            <Pressable style={styles.action} disabled={busy} onPress={() => run(printRrBags, item)}>
              <Text style={styles.actionText}>Print</Text>
            </Pressable>
            <Pressable style={styles.action} disabled={busy} onPress={() => run(shareRrBags, item)}>
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
            <Pressable style={styles.action} disabled={busy} onPress={() => run(downloadRrBags, item)}>
              <Text style={styles.actionText}>Download</Text>
            </Pressable>
          </View>
          {user?.role === 'owner' && item.status === 'submitted' && !item.closed && !item.started ? (
            <Pressable style={styles.start} onPress={() => startReceipt(item.id)}>
              <Text style={styles.startText}>Start RR</Text>
            </Pressable>
          ) : null}
          {item.started && !item.closed ? (
            <Pressable style={styles.close} onPress={() => navigation.navigate('RrClose', { id: item.id })}>
              <Text style={styles.closeText}>RR closed</Text>
            </Pressable>
          ) : null}
          {user?.role === 'owner' && item.closed ? (
            <Pressable style={styles.open} onPress={() => openReceipt(item.id)}>
              <Text style={styles.openText}>Reopen RR</Text>
            </Pressable>
          ) : null}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.muted}>No RR in the register.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  kicker: { color: colors.greenDeep, fontSize: 12, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  heading: { color: colors.ink, fontSize: 28, fontWeight: '800', marginTop: 2 },
  lead: { color: colors.muted, lineHeight: 20, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, marginBottom: 8 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  rr: { fontSize: 18, fontWeight: '700', flex: 1 },
  closed: { color: colors.danger, fontWeight: '700' },
  live: { color: colors.ok, fontWeight: '700' },
  muted: { color: colors.muted },
  waiting: { color: colors.greenDeep, fontWeight: '700' },
  start: { marginTop: 10, backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  startText: { color: colors.onYellow, fontWeight: '800' },
  close: { marginTop: 10, backgroundColor: colors.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: '800' },
  open: { marginTop: 10, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  openText: { color: colors.ink, fontWeight: '700' },
  bags: { flexDirection: 'row', gap: 8, backgroundColor: colors.okSoft, borderRadius: 12, padding: 10, marginTop: 8 },
  bagBox: { flex: 1, alignItems: 'center' },
  bagLabel: { fontSize: 11, fontWeight: '700', color: colors.muted },
  bagValue: { fontSize: 16, fontWeight: '800', color: colors.ink },
  vehicleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  vehicleTitle: { fontWeight: '800', color: colors.ink },
  vehicleToggle: { fontWeight: '700', color: colors.greenDeep },
  vehicleList: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden' },
  vehicleNo: { fontWeight: '700', color: colors.ink, flex: 1 },
  vehicleBags: { fontWeight: '800', color: colors.ok },
  setNums: { fontWeight: '800', color: colors.ink },
  subHead: { fontWeight: '800', color: colors.greenDeep, marginTop: 4 },
  vehicleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  actions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  action: { flex: 1, backgroundColor: colors.green, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionText: { color: colors.onYellow, fontWeight: '800', fontSize: 13 },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12, marginBottom: 8 },
});
