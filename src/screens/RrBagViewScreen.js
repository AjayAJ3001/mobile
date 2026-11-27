import { ScrollView, StyleSheet, Text, View } from 'react-native';
import StatementHeader, { StatementFields } from '../StatementHeader';
import { rrBagFields } from '../rrBagFile';
import { colors } from '../theme';

export default function RrBagViewScreen({ route }) {
  const rr = route.params.rr;
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <StatementHeader title="RR BAG STATEMENT" reference={`RR ${rr.rrNo}`} />
        <StatementFields rows={rrBagFields(rr)} />

        <Text style={styles.section}>Set-wise bags</Text>
        {(rr.sets || []).map((set) => (
          <View key={set.setNo} style={styles.line}>
            <Text style={styles.title}>Set {set.setNo}</Text>
            <Text style={styles.muted}>
              Total {set.totalBags} · Taken {set.bagsTaken} · Balance {set.balanceBags} · {set.vehicleCount} vehicles
            </Text>
          </View>
        ))}
        {!rr.sets?.length ? <Text style={styles.muted}>No sets.</Text> : null}

        <Text style={styles.section}>Vehicles</Text>
        {(rr.vehicles || []).map((v) => (
          <View key={`${v.sno}-${v.truckNo}`} style={styles.line}>
            <Text style={styles.title}>{v.sno}. {v.truckNo} · Trip {v.trip}</Text>
            <Text style={styles.muted}>
              Set {v.setNo} · Wagon {v.wagonNo || '—'} · {v.bags} bags · {v.deliveryTo || '—'}
            </Text>
          </View>
        ))}
        {!rr.vehicles?.length ? <Text style={styles.muted}>No vehicle has taken bags.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 10 },
  section: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 6 },
  line: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 2 },
  title: { fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted },
});
