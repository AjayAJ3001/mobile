import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { colors } from '../theme';

export default function TruckListScreen({ navigation }) {
  const [trucks, setTrucks] = useState([]);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    api('/api/trucks')
      .then((data) => setTrucks(data.trucks || []))
      .catch((err) => setError(err.message));
  }, []));

  return (
    <ScrollView contentContainerStyle={styles.page}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {trucks.map((truck) => (
        <Pressable key={truck.id} style={styles.entry} onPress={() => navigation.navigate('Truck', { truck })}>
          <View style={styles.entryBody}>
            <View style={styles.entryTop}>
              <Text style={styles.sno}>S.no: {truck.sno} · Trip {truck.trip || 1}</Text>
              <Text style={styles.rrNo}>RR No: {truck.rrNo}</Text>
            </View>
            <Text style={styles.entryTitle}>{truck.truckNo}</Text>
            <Text style={styles.route}>{truck.stationFrom || '—'} → {truck.stationTo || '—'}</Text>
          </View>
          <View style={styles.chevronRight} />
        </Pressable>
      ))}
      {!trucks.length && !error ? <Text style={styles.empty}>No truck saved yet</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  entry: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 10 },
  entryBody: { flex: 1, gap: 4 },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sno: { fontWeight: '700', color: colors.ink },
  entryTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, letterSpacing: 1 },
  route: { color: colors.muted },
  rrNo: { fontWeight: '700', color: colors.green },
  chevronRight: { width: 9, height: 9, borderRightWidth: 2, borderTopWidth: 2, borderColor: colors.green, transform: [{ rotate: '45deg' }] },
  empty: { color: colors.muted },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
