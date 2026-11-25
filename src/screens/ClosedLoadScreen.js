import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../api';
import { downloadClosedLoad, printClosedLoad, shareClosedLoad } from '../closedLoadFile';
import { colors } from '../theme';

function Field({ label, value }) {
  return (
    <View style={styles.pairItem}>
      <Text style={styles.pairLabel}>{label}</Text>
      <Text style={styles.pairValue}>{value ?? '—'}</Text>
    </View>
  );
}

export default function ClosedLoadScreen({ route, navigation }) {
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  async function run(action) {
    setError('');
    try {
      await action(report);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    api(`/api/loads/closed/${route.params.id}`)
      .then((data) => setReport(data.report))
      .catch((err) => setError(err.message));
  }, [route.params.id]);

  if (!report) {
    return <View style={styles.page}>{error ? <Text style={styles.error}>{error}</Text> : <Text>Loading…</Text>}</View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        <Text style={styles.rr}>RR No: {report.rrNo}</Text>
        <View style={styles.pair}>
          <Field label="RR Date" value={report.rrDate} />
          <Field label="FNR" value={report.fnr} />
        </View>
        <View style={styles.pair}>
          <Field label="Station From" value={report.stationFrom} />
          <Field label="Station To" value={report.stationTo} />
        </View>
        <Field label="Commodity" value={report.commodity} />
        <Field label="Party name" value={report.partyName} />
        <View style={styles.summary}>
          <Field label="Trucks gone" value={String(report.trucksGone)} />
          <Field label="Total bags" value={String(report.totalBags)} />
          <Field label="Bags taken" value={String(report.bagsTaken)} />
          <Field label="Balance bags" value={String(report.balanceBags)} />
        </View>
        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={() => navigation.navigate('ClosedLoadView', { report })}><Text style={styles.actionText}>View</Text></Pressable>
          <Pressable style={styles.action} onPress={() => run(printClosedLoad)}><Text style={styles.actionText}>Print</Text></Pressable>
          <Pressable style={styles.action} onPress={() => run(shareClosedLoad)}><Text style={styles.actionText}>Share</Text></Pressable>
          <Pressable style={styles.action} onPress={() => run(downloadClosedLoad)}><Text style={styles.actionText}>Download</Text></Pressable>
        </View>
      </View>
      {(report.sets || []).map((set) => (
        <View key={set.setNo} style={styles.card}>
          <Text style={styles.setTitle}>Set no: {set.setNo}</Text>
          <Text style={styles.line}>Total bags: {set.totalBags}</Text>
          <Text style={styles.line}>Balance bags: {set.balanceBags}</Text>
          {(set.wagons || []).map((wagon) => (
            <Text key={wagon.id} style={styles.muted}>{wagon.wagonNo} · articles {wagon.articleCount} · balance {wagon.balanceBags}</Text>
          ))}
        </View>
      ))}
      <View style={styles.card}>
        <Text style={styles.setTitle}>Trucks</Text>
        {(report.trucks || []).map((truck) => (
          <View key={`${truck.sno}-${truck.truckNo}`} style={styles.truck}>
            <Text style={styles.line}>{truck.sno}. {truck.truckNo}</Text>
            {truck.entered ? (
              <Text style={styles.muted}>Set {truck.setNo} · {truck.wagonNo || 'wagon'} · {truck.bags} bags · {truck.deliveryTo || '—'}</Text>
            ) : (
              <Text style={styles.pending}>Load not entered</Text>
            )}
          </View>
        ))}
        {!report.trucks.length ? <Text style={styles.muted}>No trucks on this RR.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  rr: { fontSize: 22, fontWeight: '800', color: colors.ink },
  pair: { flexDirection: 'row', gap: 12 },
  pairItem: { flex: 1, gap: 2 },
  pairLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  pairValue: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  setTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  line: { color: colors.ink, fontWeight: '700' },
  muted: { color: colors.muted },
  truck: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 2 },
  pending: { color: colors.danger, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  action: { flexGrow: 1, flexBasis: '45%', backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionText: { color: colors.onYellow, fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
