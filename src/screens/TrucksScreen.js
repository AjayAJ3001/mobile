import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, loadWorkingReceipt, saveWorkingReceipt } from '../api';
import { colors } from '../theme';

function matchParty(parties, typed) {
  const query = String(typed || '').trim().toLowerCase();
  if (!query) return null;
  const exact = parties.find((item) => item.name.toLowerCase() === query);
  if (exact) return exact;
  return parties.find((item) => {
    const name = item.name.toLowerCase();
    return name.includes(query) || query.includes(name);
  }) || null;
}

function defaultUnitId(party) {
  const units = party?.units || [];
  if (units.length === 1) return units[0].id;
  if (!party?.name.toLowerCase().includes('krishi')) return null;
  return units.find((item) => item.name.toLowerCase() === 'sipcot')?.id ?? null;
}

export default function TrucksScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [receiptId, setReceiptId] = useState(null);
  const [unitId, setUnitId] = useState(null);
  const [unitOpen, setUnitOpen] = useState(false);
  const [truckNo, setTruckNo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [openSuggestions, setOpenSuggestions] = useState(false);

  const suggestions = [...new Set((data?.trucks || []).map((truck) => truck.truckNo))]
    .filter((number) => {
      const typed = truckNo.trim().toUpperCase();
      return typed && number.toUpperCase().includes(typed) && number.toUpperCase() !== typed;
    });

  const load = useCallback(() => {
    Promise.all([api('/api/trucks'), loadWorkingReceipt()])
      .then(([next, saved]) => {
        setData(next);
        const sources = next.sources || [];
        const kept = sources.some((source) => source.id === saved) ? saved : null;
        if (saved && !kept) saveWorkingReceipt(null);
        setReceiptId(kept);
      })
      .catch((err) => setError(err.message));
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const selected = data?.sources.find((source) => source.id === receiptId) || null;
  const party = matchParty(data?.parties || [], selected?.partyName);
  const unit = party?.units.find((item) => item.id === unitId) || null;

  const typedTruck = truckNo.trim().toUpperCase();
  const currentTrip = selected && typedTruck
    ? (data?.trucks || []).filter(
        (t) => (t.receiptId === selected.id || t.rrNo === selected.rrNo) && t.truckNo.trim().toUpperCase() === typedTruck
      ).length + 1
    : 1;

  useEffect(() => {
    setUnitId(defaultUnitId(party));
    setUnitOpen(false);
  }, [selected?.id, party?.id]);

  async function save() {
    if (!truckNo.trim()) {
      setError('Enter the truck number.');
      return;
    }
    if (!selected) {
      setError(data?.sources?.length ? 'Start the entry on the dashboard, then open truck entry.' : 'The admin has to start an RR before truck entry.');
      return;
    }
    if (!party || !unit) {
      setError('Choose a delivery unit for this party.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/api/trucks', { method: 'POST', body: { receiptId: selected.id, truckNo, partyId: party.id, unitId: unit.id } });
      setUnitId(defaultUnitId(party));
      setTruckNo('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        {data && !data.sources.length ? <Text style={styles.line}>No active RR. An admin starts an uploaded RR before truck entry.</Text> : null}
        {data?.sources.length && !selected ? <Text style={styles.line}>Start the entry on the dashboard, then open truck entry.</Text> : null}
        {selected ? (
          <>
        <View style={styles.rrBlock}>
          <View style={styles.pair}>
            <View style={styles.pairItem}>
              <Text style={styles.pairLabel}>RR No</Text>
              <Text style={styles.pairValue}>{selected.rrNo}</Text>
            </View>
            <View style={styles.pairItem}>
              <Text style={styles.pairLabel}>RR Date</Text>
              <Text style={styles.pairValue}>{selected.rrDate || '—'}</Text>
            </View>
          </View>
          <View style={styles.pairItem}>
            <Text style={styles.pairLabel}>FNR</Text>
            <Text style={styles.pairValue}>{selected.fnr || '—'}</Text>
          </View>
          <View style={styles.pair}>
            <View style={styles.pairItem}>
              <Text style={styles.pairLabel}>Station From</Text>
              <Text style={styles.pairValue}>{selected.stationFrom || '—'}</Text>
            </View>
            <View style={styles.pairItem}>
              <Text style={styles.pairLabel}>Station To</Text>
              <Text style={styles.pairValue}>{selected.stationTo || '—'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.pair}>
          <View style={styles.pairItem}>
            <Text style={styles.label}>S.no</Text>
            <Text style={styles.readonly}>{selected ? (data?.nextByReceipt?.[selected.id] ?? 1) : '—'}</Text>
          </View>
          <View style={styles.pairItem}>
            <Text style={styles.label}>Trip</Text>
            <Text style={styles.readonly}>{`Trip ${currentTrip}`}</Text>
          </View>
        </View>
        <Text style={styles.label}>Date</Text>
        <Text style={styles.readonly}>{data?.date ?? '—'}</Text>
        <Text style={styles.label}>Truck number</Text>
        <TextInput
          key="truck-number-text"
          style={styles.input}
          value={truckNo}
          placeholder="Enter the truck no"
          maxLength={15}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          importantForAutofill="no"
          secureTextEntry={false}
          keyboardType="default"
          inputMode="text"
          onChangeText={(value) => {
            setTruckNo(value.toUpperCase());
            setOpenSuggestions(true);
          }}
          onFocus={() => setOpenSuggestions(true)}
        />
        {openSuggestions && suggestions.map((number) => (
          <Pressable
            key={number}
            style={styles.suggestion}
            onPress={() => {
              setTruckNo(number);
              setOpenSuggestions(false);
            }}
          >
            <Text style={styles.suggestionText}>{number}</Text>
          </Pressable>
        ))}
        <Text style={styles.label}>Commodity</Text>
        <Text style={styles.readonly}>{selected.commodity || '—'}</Text>
        <Text style={styles.label}>Party name</Text>
        <Text style={styles.readonly}>{party?.name || selected?.partyName || '—'}</Text>
        <Text style={styles.label}>Delivery to</Text>
        {party?.units.length === 1 ? (
          <Text style={styles.readonly}>{party.units[0].name}</Text>
        ) : (
          <>
            <Pressable style={styles.dropdown} onPress={() => party && setUnitOpen((open) => !open)} disabled={!party}>
              <Text style={unit ? styles.dropdownText : styles.dropdownPlaceholder}>
                {unit?.name || (party ? 'Choose unit' : '—')}
              </Text>
              <View style={[styles.chevron, unitOpen && styles.chevronUp]} />
            </Pressable>
            {unitOpen ? (
              <View style={styles.menu}>
                {(party?.units || []).map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.menuItem, item.id === unitId && styles.optionOn]}
                    onPress={() => {
                      setUnitId(item.id);
                      setUnitOpen(false);
                    }}
                  >
                    <Text style={item.id === unitId ? styles.optionOnText : styles.optionText}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        )}
        <Pressable style={styles.primary} disabled={busy} onPress={save}>
          <Text style={styles.primaryText}>{busy ? 'Saving…' : 'Save truck'}</Text>
        </Pressable>
          </>
        ) : null}
        <View style={styles.buttonRow}>
          <Pressable style={styles.dashboard} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.dashboardText}>Home</Text>
          </Pressable>
          <Pressable style={styles.dashboard} onPress={() => navigation.navigate('TruckList')}>
            <Text style={styles.dashboardText}>Truck details</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 6 },
  line: { fontSize: 16, lineHeight: 22 },
  rrBlock: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, gap: 10 },
  pair: { flexDirection: 'row', gap: 12 },
  pairItem: { flex: 1, gap: 2 },
  pairLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  pairValue: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  label: { marginTop: 8, fontWeight: '700' },
  readonly: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, fontWeight: '700', letterSpacing: 1 },
  suggestion: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12 },
  suggestionText: { fontWeight: '700', letterSpacing: 1 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { flex: 1, fontWeight: '700', color: colors.ink },
  dropdownPlaceholder: { flex: 1, color: colors.muted },
  chevron: { width: 9, height: 9, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.green, transform: [{ rotate: '45deg' }], marginTop: -4, marginLeft: 8 },
  chevronUp: { transform: [{ rotate: '-135deg' }], marginTop: 4 },
  menu: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  menuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  option: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  optionOn: { backgroundColor: colors.green, borderColor: colors.green },
  optionText: { color: colors.ink },
  optionOnText: { color: colors.onYellow, fontWeight: '700' },
  primary: { backgroundColor: colors.green, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12 },
  primaryText: { color: colors.onYellow, fontWeight: '700' },
  dashboard: { flex: 1, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  dashboardText: { color: colors.ink, fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
