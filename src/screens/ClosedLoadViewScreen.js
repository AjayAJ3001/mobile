import { ScrollView, StyleSheet, Text, View } from 'react-native';
import StatementHeader, { StatementFields } from '../StatementHeader';
import { colors } from '../theme';

export default function ClosedLoadViewScreen({ route }) {
  const report = route.params.report;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <StatementHeader title="CLOSED RR LOAD" reference={`RR ${report.rrNo}`} />
        <StatementFields rows={[
          ['RR No', report.rrNo],
          ['RR Date', report.rrDate],
          ['FNR', report.fnr],
          ['Party name', report.partyName],
          ['Station From', report.stationFrom],
          ['Station To', report.stationTo],
          ['Commodity', report.commodity],
          ['Trucks gone', String(report.trucksGone)],
          ['Total bags', String(report.totalBags)],
          ['Bags taken', String(report.bagsTaken)],
          ['Balance bags', String(report.balanceBags)],
        ]} />
        {(report.trucks || []).map((truck) => (
          <View key={`${truck.sno}-${truck.truckNo}`} style={styles.truck}>
            <Text style={styles.truckTitle}>{truck.sno}. {truck.truckNo} (Trip {truck.trip || 1})</Text>
            <Text style={styles.muted}>
              {truck.entered ? `Set ${truck.setNo} · ${truck.wagonNo || 'wagon'} · ${truck.bags} bags · ${truck.deliveryTo || '—'}` : 'Load not entered'}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 12 },
  truck: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 2 },
  truckTitle: { fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted },
});
