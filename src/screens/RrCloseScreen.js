import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { downloadClose, printClose, shareClose } from '../closeFile';
import StatementHeader, { StatementFields } from '../StatementHeader';
import { colors } from '../theme';

export default function RrCloseScreen({ route, navigation }) {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [missing, setMissing] = useState(null);
  const [error, setError] = useState('');

  function closeReceipt() {
    setError('');
    api(`/api/receipts/${route.params.id}/close`, { method: 'POST' })
      .then((data) => {
        setMissing(null);
        setReport(data.close);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    let cancel = false;
    api(`/api/receipts/${route.params.id}/close`)
      .then((data) => {
        if (cancel) return null;
        if (data.close.closed || !data.close.missingLoads?.length) {
          if (data.close.closed) {
            setReport(data.close);
            return null;
          }
          return api(`/api/receipts/${route.params.id}/close`, { method: 'POST' }).then((saved) => {
            if (!cancel) setReport(saved.close);
          });
        }
        setMissing(data.close.missingLoads);
        return null;
      })
      .catch((err) => {
        if (!cancel) setError(err.message);
      });
    return () => { cancel = true; };
  }, [route.params.id]);

  async function run(action) {
    setError('');
    try {
      await action(report);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!report) {
    return (
      <View style={styles.page}>
        {error ? <Text style={styles.error}>{error}</Text> : <Text>Loading…</Text>}
        {missing ? (
          <View style={styles.alert}>
            <Text style={styles.alertTitle}>Load entry is still not entered</Text>
            <Text style={styles.row}>This RR has a truck with no load entry.</Text>
            {missing.map((truck) => <Text key={truck.sno} style={styles.alertTruck}>{truck.truckNo}</Text>)}
            <Pressable style={styles.exit} onPress={() => navigation.goBack()}>
              <Text style={styles.exitText}>Exit</Text>
            </Pressable>
            <Pressable style={styles.closeAnyway} onPress={closeReceipt}>
              <Text style={styles.closeAnywayText}>Close anyway</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <StatementHeader title="RR CLOSED" reference={`RR ${report.rrNo}`} />
        <Text style={styles.closed}>Closed</Text>
        <StatementFields rows={[
          ['RR No', report.rrNo],
          ['RR Date', report.rrDate],
          ['FNR', report.fnr],
          ['Party name', report.partyName],
          ['Station From', report.stationFrom],
          ['Station To', report.stationTo],
          ['Commodity', report.commodity],
          ['Total bags taken', report.totalBagsTaken],
          ['Trucks taken', report.trucksTaken],
        ]} />
        {report.trucks.map((truck) => (
          <Text key={`${truck.sno}-${truck.truckNo}`} style={styles.row}>
            {truck.sno}. {truck.truckNo} · Set {truck.setNo} · {truck.bags} bags
          </Text>
        ))}
        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={() => navigation.navigate('RrCloseView', { report })}><Text style={styles.actionText}>View</Text></Pressable>
          <Pressable style={styles.action} onPress={() => run(printClose)}><Text style={styles.actionText}>Print</Text></Pressable>
          <Pressable style={styles.action} onPress={() => run(shareClose)}><Text style={styles.actionText}>Share</Text></Pressable>
          <Pressable style={styles.action} onPress={() => run(downloadClose)}><Text style={styles.actionText}>Download</Text></Pressable>
        </View>
        {user?.role === 'owner' ? (
          <Pressable style={styles.reopen} onPress={() => {
            setError('');
            api(`/api/receipts/${route.params.id}/open`, { method: 'POST' })
              .then(() => navigation.replace('Receipt', { id: route.params.id }))
              .catch((err) => setError(err.message));
          }}>
            <Text style={styles.reopenText}>Reopen RR</Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 10 },
  closed: { alignSelf: 'flex-start', backgroundColor: colors.dangerSoft, color: colors.danger, fontWeight: '700', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  row: { color: colors.ink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  action: { flexGrow: 1, flexBasis: '45%', backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionText: { color: colors.onYellow, fontWeight: '700' },
  reopen: { backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  reopenText: { color: colors.onYellow, fontWeight: '800' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12, marginBottom: 12 },
  alert: { backgroundColor: colors.panel, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 10 },
  alertTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  alertTruck: { fontWeight: '800', color: colors.ink, letterSpacing: 0.4 },
  exit: { borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  exitText: { color: colors.ink, fontWeight: '800' },
  closeAnyway: { backgroundColor: colors.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeAnywayText: { color: '#fff', fontWeight: '800' },
});
