import { ScrollView, StyleSheet, View } from 'react-native';
import StatementHeader, { StatementFields } from '../StatementHeader';
import { colors } from '../theme';

export default function TruckDetailScreen({ route }) {
  const truck = route.params.truck;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.card}>
        <StatementHeader title="TRUCK DETAILS" reference={truck.truckNo} />
        <StatementFields rows={[
          ['RR No', truck.rrNo],
          ['RR Date', truck.rrDate],
          ['FNR', truck.fnr],
          ['Date', truck.date],
          ['Station From', truck.stationFrom],
          ['Station To', truck.stationTo],
          ['Serial no', truck.sno],
          ['Trip', `Trip ${truck.trip || 1}`],
          ['Truck number', truck.truckNo],
          ['Commodity', truck.commodity],
          ['Party name', truck.partyName],
          ['Delivery to', truck.deliveryTo],
        ]} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 12 },
});
