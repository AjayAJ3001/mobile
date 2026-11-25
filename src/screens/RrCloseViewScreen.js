import { ScrollView, StyleSheet, Text, View } from 'react-native';
import StatementHeader, { StatementFields } from '../StatementHeader';
import { colors } from '../theme';

export default function RrCloseViewScreen({ route }) {
  const report = route.params.report;
  return (
    <ScrollView contentContainerStyle={styles.page}>
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
          <View key={`${truck.sno}-${truck.truckNo}`} style={styles.truck}>
            <Text style={styles.truckTitle}>{truck.sno}. {truck.truckNo}</Text>
            <Text style={styles.muted}>Set {truck.setNo} · {truck.bags} bags · {truck.deliveryTo || '—'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 12 },
  closed: { alignSelf: 'flex-start', backgroundColor: colors.dangerSoft, color: colors.danger, fontWeight: '700', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  truck: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 2 },
  truckTitle: { fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted },
});
