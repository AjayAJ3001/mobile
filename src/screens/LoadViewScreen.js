import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { loadSlip } from '../loadStatement';

function Line() {
  return <View style={styles.line} />;
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function Pair({ left, right }) {
  return (
    <View style={styles.row}>
      <Text style={styles.pairText}>{left}</Text>
      <Text style={[styles.pairText, styles.pairEnd]}>{right}</Text>
    </View>
  );
}

export default function LoadViewScreen({ route }) {
  const slip = loadSlip(route.params.truck);

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.slip}>
        <Text style={styles.brand}>KSP</Text>
        <Text style={styles.place}>Railway Goods Shed Erode</Text>
        <Line />
        <View style={styles.meta}>
          <Text style={styles.metaText}>S.No {slip.sno}</Text>
          <Text style={[styles.metaText, styles.metaMid]}>Load Entry</Text>
          <Text style={[styles.metaText, styles.metaEnd]}>{slip.date}</Text>
        </View>
        <Line />
        <Text style={styles.truck}>{slip.truckNo}</Text>
        <Row label="Bags :" value={slip.bags} />
        <Row label="Delivery to :" value={slip.deliveryTo} />
        <Row label="Set No :" value={slip.setNo} />
        <Row label="Commodity :" value={slip.commodity} />
        <Row label="Party Name :" value={slip.partyName} />
        <Line />
        <Pair left={`RR No : ${slip.rrNo}`} right={`RR Date : ${slip.rrDate}`} />
        <Text style={styles.fnrText}>FNR : <Text style={styles.fnrValue}>{slip.fnr}</Text></Text>
        <Pair left={`From : ${slip.stationFrom}`} right={`To : ${slip.stationTo}`} />
        <Pair left={`Total Bags : ${slip.totalBags}`} right={`Wagon : ${slip.wagonNo}`} />
        <Row label="Balance Bags :" value={slip.balanceBags} />
        <View style={styles.auth}>
          <View style={styles.sign} />
          <Text style={styles.who}>KSP Authorised</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, alignItems: 'center' },
  slip: { width: '100%', maxWidth: 320, backgroundColor: '#fff', borderWidth: 1, borderColor: '#111', paddingHorizontal: 12, paddingVertical: 14 },
  brand: { textAlign: 'center', color: '#000', fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  place: { textAlign: 'center', color: '#000', fontSize: 13, fontWeight: '700', marginTop: 2 },
  line: { borderTopWidth: 1, borderTopColor: '#000', marginVertical: 8 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  metaText: { flex: 1, color: '#000', fontSize: 11, fontWeight: '700' },
  metaMid: { textAlign: 'center' },
  metaEnd: { textAlign: 'right' },
  truck: { textAlign: 'center', color: '#000', fontSize: 22, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, paddingVertical: 2 },
  label: { color: '#000', fontSize: 13 },
  value: { flex: 1, color: '#000', fontSize: 13, fontWeight: '800', textAlign: 'right' },
  pairText: { flex: 1, color: '#000', fontSize: 12, fontWeight: '700' },
  pairEnd: { textAlign: 'right' },
  fnrText: { color: '#000', fontSize: 12, fontWeight: '700', paddingVertical: 2 },
  fnrValue: { fontWeight: '800' },
  auth: { marginTop: 18, alignItems: 'center' },
  sign: { width: 160, borderTopWidth: 1, borderTopColor: '#000', marginBottom: 6 },
  who: { color: '#000', fontSize: 13, fontWeight: '800' },
});
