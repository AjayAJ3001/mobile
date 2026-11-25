import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, formatWhen } from '../api';
import { expandedPartyName, partyChoices } from '../partyName';
import { downloadReceipt, printReceipt, shareReceipt } from '../receiptFile';
import StatementHeader, { StatementFields } from '../StatementHeader';
import { colors } from '../theme';
import { useAuth } from '../auth';

function groupsFor(wagons) {
  const grouped = new Map();
  for (const wagon of wagons || []) {
    const setNo = String(wagon.shedNo || '').trim() || '—';
    if (!grouped.has(setNo)) grouped.set(setNo, []);
    grouped.get(setNo).push(wagon);
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([setNo, items]) => ({ setNo, wagons: items }));
}

export default function ReceiptDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const [receipt, setReceipt] = useState(route.params.receipt || null);
  const [partyName, setPartyName] = useState('');
  const [parties, setParties] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/parties').then((data) => setParties(data.parties || [])).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => {
    api(`/api/receipts/${route.params.id}`)
      .then((data) => {
        setReceipt(data.receipt);
        setPartyName(data.receipt.partyName || '');
      })
      .catch((err) => setError(err.message));
  }, [route.params.id]));

  if (!receipt) {
    return <View style={styles.page}>{error ? <Text style={styles.error}>{error}</Text> : <Text>Loading…</Text>}</View>;
  }

  const saved = receipt.status === 'submitted';
  const canEdit = user.role === 'owner' || user.id === receipt.uploadedBy.id;

  async function save() {
    setBusy(true);
    setError('');
    try {
      const data = await api(`/api/receipts/${receipt.id}/submit`, {
        method: 'POST',
        body: {
          partyName: expandedPartyName(parties, partyName, partyName),
          sheds: receipt.wagons.map((wagon) => ({ id: wagon.id, shedNo: wagon.shedNo })),
        },
      });
      setReceipt(data.receipt);
      setPartyName(data.receipt.partyName || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function run(action) {
    setError('');
    try {
      await action(receipt);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <FlatList
      data={saved ? groupsFor(receipt.wagons) : receipt.wagons}
      keyExtractor={(item) => saved ? `set-${item.setNo}` : String(item.id)}
      contentContainerStyle={styles.page}
      ListHeaderComponent={(
        <View style={styles.sheet}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <StatementHeader title="RAILWAY RECEIPT" reference={`RR ${receipt.rrNo}`} />
          {receipt.closed ? <Text style={styles.closed}>Closed</Text> : null}
          <StatementFields rows={[
            ['RR No', receipt.rrNo],
            ['RR Date', receipt.rrDate],
            ['Station From', receipt.stationFrom],
            ['Station To', receipt.stationTo],
            ['FNR', receipt.fnr],
            ['Commodity', receipt.commodityDescription],
            ...(saved ? [['Party name', receipt.partyName]] : []),
          ]} />
          <Text style={styles.muted}>Uploaded {formatWhen(receipt.uploadedAt)} by {receipt.uploadedBy.name}</Text>
          {saved && (
            <>
              <View style={styles.actions}>
                <Pressable style={styles.action} onPress={() => run(printReceipt)}><Text style={styles.actionText}>Print</Text></Pressable>
                <Pressable style={styles.action} onPress={() => run(shareReceipt)}><Text style={styles.actionText}>Share</Text></Pressable>
                <Pressable style={styles.action} onPress={() => run(downloadReceipt)}><Text style={styles.actionText}>Download</Text></Pressable>
              </View>
              {!receipt.closed ? (
                <Pressable style={styles.close} onPress={() => navigation.navigate('RrClose', { id: receipt.id })}>
                  <Text style={styles.closeText}>RR closed</Text>
                </Pressable>
              ) : null}
              {user?.role === 'owner' && receipt.closed ? (
                <Pressable style={styles.reopen} onPress={() => {
                  setError('');
                  api(`/api/receipts/${receipt.id}/open`, { method: 'POST' })
                    .then((data) => setReceipt(data.receipt))
                    .catch((err) => setError(err.message));
                }}>
                  <Text style={styles.reopenText}>Reopen RR</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.dashboard} onPress={() => navigation.navigate('Dashboard')}>
                <Text style={styles.dashboardText}>Home</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
      renderItem={({ item }) => saved ? (
        <View style={styles.setCard}>
          <Text style={styles.shed}>Set no: {item.setNo}</Text>
          <Text style={styles.row}><Text style={styles.rowLabel}>Total bags: </Text>{(receipt.sets || []).find((set) => String(set.setNo) === String(item.setNo))?.totalBags ?? item.wagons.reduce((sum, wagon) => sum + Number(wagon.articleCount || 0), 0)}</Text>
          <Text style={styles.row}><Text style={styles.rowLabel}>Balance bags: </Text>{(receipt.sets || []).find((set) => String(set.setNo) === String(item.setNo))?.balanceBags ?? item.wagons.reduce((sum, wagon) => sum + Number(wagon.articleCount || 0), 0)}</Text>
          {item.wagons.map((wagon) => (
            <View key={wagon.id} style={styles.wagonLine}>
              <Text style={styles.wagonTitle}>S.no {wagon.sno}</Text>
              <Text style={styles.wagonNo}>Wagon no  {wagon.wagonNo}</Text>
              <Text style={styles.muted}>{wagon.owningRly} · {wagon.wagonType} · {wagon.articleCount} bags</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.wagon}>
          <Text style={styles.wagonTitle}>S.no {item.sno}</Text>
          <Text style={styles.wagonNo}>Wagon no  {item.wagonNo}</Text>
          <Text style={styles.muted}>{item.owningRly} · {item.wagonType} · {item.articleCount} bags</Text>
          <TextInput
            style={styles.input}
            value={item.shedNo}
            placeholder="Set no"
            onChangeText={(value) => setReceipt((current) => ({
              ...current,
              wagons: current.wagons.map((wagon) => wagon.id === item.id ? { ...wagon, shedNo: value } : wagon),
            }))}
          />
        </View>
      )}
      ListFooterComponent={saved ? (
        <Pressable style={styles.dashboard} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.dashboardText}>Home</Text>
        </Pressable>
      ) : canEdit ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text style={styles.label}>Party name</Text>
          <TextInput
            style={styles.input}
            value={partyName}
            onChangeText={(value) => setPartyName(expandedPartyName(parties, value, partyName))}
          />
          {partyChoices(parties, partyName).map((party) => (
            <Pressable key={party.id} style={styles.suggestion} onPress={() => setPartyName(party.name)}>
              <Text style={styles.suggestionText}>{party.name}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.primary} disabled={busy} onPress={save}>
            <Text style={styles.primaryText}>{busy ? 'Saving…' : 'Submit'}</Text>
          </Pressable>
        </View>
      ) : null}
    />
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 10 },
  sheet: { backgroundColor: colors.panel, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 10 },
  closed: { alignSelf: 'flex-start', backgroundColor: colors.dangerSoft, color: colors.danger, fontWeight: '700', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  shed: { fontSize: 20, fontWeight: '700', marginTop: 6 },
  row: { color: colors.ink },
  rowLabel: { fontWeight: '700' },
  label: { fontWeight: '700', marginTop: 8 },
  muted: { color: colors.muted },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12 },
  suggestion: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12 },
  suggestionText: { fontWeight: '700', color: colors.ink },
  setCard: { backgroundColor: colors.panel, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 8 },
  wagonLine: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 2 },
  wagon: { backgroundColor: colors.panel, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 4 },
  wagonTitle: { fontWeight: '700' },
  wagonNo: { fontWeight: '700', color: colors.ink, letterSpacing: 0.3 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  action: { flexGrow: 1, flexBasis: '30%', backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionText: { color: colors.onYellow, fontWeight: '700' },
  close: { backgroundColor: colors.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: '800' },
  reopen: { backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  reopenText: { color: colors.onYellow, fontWeight: '800' },
  dashboard: { marginTop: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  dashboardText: { color: colors.ink, fontWeight: '700' },
  primary: { backgroundColor: colors.green, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 8 },
  primaryText: { color: colors.onYellow, fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
