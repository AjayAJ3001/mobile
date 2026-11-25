import { StyleSheet, View } from 'react-native';

export function DashIcon({ color }) {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((item) => <View key={item} style={[styles.cell, { backgroundColor: color }]} />)}
    </View>
  );
}

export function UploadIcon({ color }) {
  return (
    <View style={styles.upload}>
      <View style={[styles.arrow, { borderBottomColor: color }]} />
      <View style={[styles.stem, { backgroundColor: color }]} />
      <View style={[styles.tray, { borderColor: color }]} />
    </View>
  );
}

export function TruckIcon({ color }) {
  return (
    <View style={styles.truck}>
      <View style={styles.truckBody}>
        <View style={[styles.cab, { borderColor: color }]} />
        <View style={[styles.bed, { backgroundColor: color }]} />
      </View>
      <View style={styles.wheels}>
        <View style={[styles.wheel, { backgroundColor: color }]} />
        <View style={[styles.wheel, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function LoadIcon({ color }) {
  return (
    <View style={styles.load}>
      <View style={[styles.box, styles.boxBack, { borderColor: color }]} />
      <View style={[styles.box, styles.boxFront, { borderColor: color, backgroundColor: '#fff' }]} />
    </View>
  );
}

export function DocIcon({ color }) {
  return (
    <View style={[styles.doc, { borderColor: color }]}>
      <View style={[styles.docLine, { backgroundColor: color }]} />
      <View style={[styles.docLine, styles.docShort, { backgroundColor: color }]} />
    </View>
  );
}

export function ChartIcon({ color }) {
  return (
    <View style={styles.chart}>
      <View style={[styles.bar, { height: 7, backgroundColor: color }]} />
      <View style={[styles.bar, { height: 13, backgroundColor: color }]} />
      <View style={[styles.bar, { height: 10, backgroundColor: color }]} />
    </View>
  );
}

export function UserIcon({ color }) {
  return (
    <View style={styles.user}>
      <View style={[styles.head, { backgroundColor: color }]} />
      <View style={[styles.shoulders, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: 18, height: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  cell: { width: 8, height: 8, borderRadius: 2 },
  upload: { width: 18, height: 18, alignItems: 'center' },
  arrow: { width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  stem: { width: 2, height: 5 },
  tray: { width: 16, height: 6, borderWidth: 1.6, borderTopWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, marginTop: 1 },
  truck: { width: 22, height: 16, justifyContent: 'flex-end' },
  truckBody: { flexDirection: 'row', alignItems: 'flex-end' },
  cab: { width: 7, height: 7, borderWidth: 1.6, borderBottomWidth: 0, borderTopLeftRadius: 3 },
  bed: { width: 13, height: 8, borderTopRightRadius: 2 },
  wheels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -3, paddingHorizontal: 1 },
  wheel: { width: 5, height: 5, borderRadius: 3 },
  load: { width: 20, height: 18 },
  box: { position: 'absolute', width: 12, height: 12, borderWidth: 1.6, borderRadius: 2 },
  boxBack: { top: 0, left: 4 },
  boxFront: { top: 5, left: 0 },
  doc: { width: 15, height: 18, borderWidth: 1.6, borderRadius: 2, padding: 3, gap: 3, justifyContent: 'center' },
  docLine: { height: 1.6, borderRadius: 1 },
  docShort: { width: '60%' },
  chart: { width: 18, height: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  bar: { width: 4, borderRadius: 1 },
  user: { width: 18, height: 18, alignItems: 'center' },
  head: { width: 7, height: 7, borderRadius: 4 },
  shoulders: { width: 14, height: 7, borderWidth: 1.6, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomWidth: 0, marginTop: 1 },
});
