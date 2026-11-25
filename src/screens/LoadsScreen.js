import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { colors } from '../theme';

function Field({ label, value }) {
  return (
    <View style={styles.pairItem}>
      <Text style={styles.pairLabel}>{label}</Text>
      <Text style={styles.pairValue}>{value || '—'}</Text>
    </View>
  );
}

export default function LoadsScreen({ navigation }) {
  const [sources, setSources] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [closed, setClosed] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    api('/api/loads')
      .then((data) => {
        setSources(data.sources || []);
        setTrucks(data.trucks || []);
        setClosed(data.closed || []);
      })
      .catch((err) => setError(err.message));
  }, []));

  const opened = sources.find((source) => source.id === openId) || null;
  const openedTrucks = opened ? trucks.filter((truck) => truck.receiptId === opened.id) : [];

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {sources.length ? (
        <View style={styles.parallel}>
          {sources.map((source) => {
            const on = source.id === openId;
            return (
              <Pressable key={source.id} style={[styles.rrPick, on && styles.rrPickOn]} onPress={() => setOpenId(on ? null : source.id)}>
                <Text style={styles.pickLabel}>RR No</Text>
                <Text style={styles.pickNo}>{source.rrNo}</Text>
                <Text style={styles.pickRoute}>{source.stationFrom || '—'} → {source.stationTo || '—'}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : !error ? <Text style={styles.empty}>No open RR. An admin starts an uploaded RR before load entry.</Text> : null}
      {opened ? (
        <View style={styles.detail}>
          <Text style={styles.detailTitle}>RR No: {opened.rrNo}</Text>
          <View style={styles.pair}>
            <Field label="RR Date" value={opened.rrDate} />
            <Field label="FNR" value={opened.fnr} />
          </View>
          <View style={styles.pair}>
            <Field label="Station From" value={opened.stationFrom} />
            <Field label="Station To" value={opened.stationTo} />
          </View>
          <Field label="Commodity" value={opened.commodity} />
          <Field label="Party name" value={opened.partyName} />
          {openedTrucks.map((truck) => {
            const filled = Boolean(truck.load);
            return (
              <Pressable key={truck.id} style={[styles.entry, filled && styles.filled]} onPress={() => navigation.navigate('Load', { truck })}>
                <View style={styles.entryBody}>
                  <Text style={[styles.sno, filled && styles.filledText]}>S.no: {truck.sno}</Text>
                  <Text style={[styles.truckNo, filled && styles.filledText]}>{truck.truckNo}</Text>
                  <Text style={[styles.route, filled && styles.filledText]}>
                    {filled
                      ? `Bags ${truck.load.bags} · Set ${truck.load.setNo} · Wagon ${truck.load.wagonNo || '—'} · ${truck.deliveryTo || '—'}`
                      : `Bags — · Set — · Wagon — · ${truck.deliveryTo || '—'}`}
                  </Text>
                </View>
                <View style={[styles.chevronRight, filled && styles.filledChevron]} />
              </Pressable>
            );
          })}
          {!openedTrucks.length ? <Text style={styles.empty}>No truck entry for this RR.</Text> : null}
        </View>
      ) : null}
      {closed.length ? (
        <View style={styles.picks}>
          <Text style={styles.lead}>Closed RR</Text>
          {closed.map((item) => (
            <Pressable key={item.id} style={styles.entry} onPress={() => navigation.navigate('ClosedLoad', { id: item.id, rrNo: item.rrNo })}>
              <View style={styles.entryBody}>
                <Text style={styles.truckNo}>RR No: {item.rrNo}</Text>
                <Text style={styles.route}>{item.stationFrom || '—'} → {item.stationTo || '—'}</Text>
                <Text style={styles.route}>{item.partyName || 'Party not entered'}</Text>
              </View>
              <View style={styles.chevronRight} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  parallel: { flexDirection: 'row', gap: 10 },
  rrPick: { flex: 1, backgroundColor: colors.panel, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 4 },
  rrPickOn: { borderColor: colors.ok, backgroundColor: colors.okSoft },
  pickLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  pickNo: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  pickRoute: { color: colors.muted, fontSize: 12 },
  detail: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 10 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  pair: { flexDirection: 'row', gap: 12 },
  pairItem: { flex: 1, gap: 2 },
  pairLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  pairValue: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  picks: { gap: 8 },
  lead: { fontWeight: '800', color: colors.ink },
  entry: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 10 },
  filled: { backgroundColor: '#067647', borderColor: '#067647' },
  filledText: { color: '#ffffff' },
  filledChevron: { borderColor: '#ffffff' },
  entryBody: { flex: 1, gap: 4 },
  sno: { fontWeight: '700', color: colors.ink },
  truckNo: { fontSize: 18, fontWeight: '700', color: colors.ink, letterSpacing: 1 },
  route: { color: colors.muted },
  chevronRight: { width: 9, height: 9, borderRightWidth: 2, borderTopWidth: 2, borderColor: colors.green, transform: [{ rotate: '45deg' }] },
  empty: { color: colors.muted },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
