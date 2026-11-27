import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import StatementHeader, { StatementFields } from '../StatementHeader';
import { api } from '../api';
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

export default function TruckDetailScreen({ route, navigation }) {
  const [truck, setTruck] = useState(route.params.truck);
  const [isEditing, setIsEditing] = useState(Boolean(route.params?.autoEdit));
  const [editTruckNo, setEditTruckNo] = useState(route.params.truck?.truckNo || '');
  const [editUnitId, setEditUnitId] = useState(route.params.truck?.unitId || null);
  const [editDeliveryTo, setEditDeliveryTo] = useState(route.params.truck?.deliveryTo || '');
  const [partyUnits, setPartyUnits] = useState([]);
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const cur = route.params.truck;
    setTruck(cur);
    setEditTruckNo(cur?.truckNo || '');
    setEditUnitId(cur?.unitId || null);
    setEditDeliveryTo(cur?.deliveryTo || '');
  }, [route.params.truck]);

  useEffect(() => {
    api('/api/trucks')
      .then((data) => {
        const allParties = data.parties || [];
        const party = matchParty(allParties, truck.partyName) || allParties.find((p) => p.id === truck.partyId);
        let units = party?.units || [];
        if (!units.length) {
          const seen = new Set();
          const list = [];
          for (const p of allParties) {
            for (const u of (p.units || [])) {
              const key = u.name.trim().toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                list.push(u);
              }
            }
          }
          units = list;
        }
        if (units.length) {
          setPartyUnits(units);
          const currentName = (editDeliveryTo || truck.deliveryTo || '').trim().toLowerCase();
          if (currentName) {
            const matched = units.find((u) => u.name.trim().toLowerCase() === currentName);
            if (matched) {
              setEditUnitId(matched.id);
              if (!editDeliveryTo) setEditDeliveryTo(matched.name);
            }
          }
        }
      })
      .catch(() => {});
  }, [truck?.partyName, truck?.partyId, truck?.deliveryTo]);

  const selectedUnit = partyUnits.find((u) => u.id === editUnitId) || null;
  const displayedDeliveryTo = selectedUnit?.name || editDeliveryTo || truck.deliveryTo;

  function startEditing() {
    setEditTruckNo(truck.truckNo || '');
    setEditUnitId(truck.unitId || null);
    setEditDeliveryTo(truck.deliveryTo || '');
    setEditUnitOpen(false);
    setError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditTruckNo(truck.truckNo || '');
    setEditUnitId(truck.unitId || null);
    setEditDeliveryTo(truck.deliveryTo || '');
    setEditUnitOpen(false);
    setError('');
    setIsEditing(false);
  }

  async function saveEdit() {
    if (!editTruckNo.trim()) {
      const msg = 'Enter the truck number.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    setBusy(true);
    setError('');
    const resolvedDelivery = selectedUnit?.name || editDeliveryTo || truck.deliveryTo;
    const payload = {
      truckId: truck.id,
      truckNo: editTruckNo.trim().toUpperCase(),
      unitId: editUnitId,
      deliveryTo: resolvedDelivery,
    };
    try {
      let data;
      try {
        data = await api(`/api/trucks/${truck.id}`, {
          method: 'PUT',
          body: payload,
        });
      } catch (putErr) {
        if (putErr.status === 404 || (putErr.message && (putErr.message.includes('404') || putErr.message.includes('Cannot PUT')))) {
          data = await api(`/api/trucks/${truck.id}`, {
            method: 'POST',
            body: payload,
          });
        } else {
          throw putErr;
        }
      }
      const updatedTruck = {
        ...truck,
        ...(data?.truck || {}),
        truckNo: editTruckNo.trim().toUpperCase(),
        deliveryTo: resolvedDelivery || data?.truck?.deliveryTo || truck.deliveryTo,
      };
      setTruck(updatedTruck);
      setIsEditing(false);
      Alert.alert('Success', 'Truck details updated successfully!');
    } catch (err) {
      setError(err.message);
      Alert.alert('Update Error', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}
      <View style={styles.card}>
        {isEditing ? (
          <>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Truck Details</Text>
              <Text style={styles.editSub}>S.no: {truck.sno} · Trip {truck.trip || 1}</Text>
            </View>

            <View style={styles.readonlyBlock}>
              <View style={styles.pair}>
                <View style={styles.pairItem}>
                  <Text style={styles.pairLabel}>RR No</Text>
                  <Text style={styles.pairValue}>{truck.rrNo}</Text>
                </View>
                <View style={styles.pairItem}>
                  <Text style={styles.pairLabel}>RR Date</Text>
                  <Text style={styles.pairValue}>{truck.rrDate || '—'}</Text>
                </View>
              </View>
              <View style={styles.pair}>
                <View style={styles.pairItem}>
                  <Text style={styles.pairLabel}>Party name</Text>
                  <Text style={styles.pairValue}>{truck.partyName || '—'}</Text>
                </View>
                <View style={styles.pairItem}>
                  <Text style={styles.pairLabel}>Commodity</Text>
                  <Text style={styles.pairValue}>{truck.commodity || '—'}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Truck number</Text>
            <TextInput
              style={styles.input}
              value={editTruckNo}
              autoCapitalize="characters"
              placeholder="Truck number"
              onChangeText={(val) => setEditTruckNo(val.toUpperCase())}
            />

            <Text style={styles.label}>Delivery to</Text>
            <Pressable
              style={styles.dropdown}
              onPress={() => setEditUnitOpen((open) => !open)}
            >
              <Text style={displayedDeliveryTo ? styles.dropdownText : styles.dropdownPlaceholder}>
                {displayedDeliveryTo || 'Choose delivery to'}
              </Text>
              <View style={[styles.chevron, editUnitOpen && styles.chevronUp]} />
            </Pressable>
            {editUnitOpen ? (
              <View style={styles.menu}>
                {partyUnits.map((item) => {
                  const isSelected = item.id === editUnitId || item.name.toLowerCase() === (displayedDeliveryTo || '').toLowerCase();
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.menuItem, isSelected && styles.optionOn]}
                      onPress={() => {
                        setEditUnitId(item.id);
                        setEditDeliveryTo(item.name);
                        setEditUnitOpen(false);
                      }}
                    >
                      <Text style={isSelected ? styles.optionOnText : styles.optionText}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
                {!partyUnits.length ? (
                  <Text style={[styles.menuItem, { color: colors.muted }]}>Loading delivery units…</Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.buttonRow}>
              <Pressable style={styles.saveButton} disabled={busy} onPress={saveEdit}>
                <Text style={styles.saveButtonText}>{busy ? 'Saving…' : 'Save Changes'}</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} disabled={busy} onPress={cancelEditing}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
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

            <View style={styles.buttonRow}>
              <Pressable style={styles.editButton} onPress={startEditing}>
                <Text style={styles.editButtonText}>Edit Truck</Text>
              </Pressable>
              {navigation?.canGoBack?.() ? (
                <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
                  <Text style={styles.backButtonText}>Back</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 12 },
  errorBanner: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12, fontWeight: '700' },
  editHeader: { borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 10, marginBottom: 4 },
  editTitle: { fontSize: 18, fontWeight: '800', color: colors.ink },
  editSub: { fontSize: 13, color: colors.muted, marginTop: 2, fontWeight: '600' },
  readonlyBlock: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, gap: 10 },
  pair: { flexDirection: 'row', gap: 12 },
  pairItem: { flex: 1, gap: 2 },
  pairLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  pairValue: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  label: { fontWeight: '700', marginTop: 4, color: colors.ink },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, fontWeight: '700', letterSpacing: 1 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { flex: 1, fontWeight: '700', color: colors.ink },
  dropdownPlaceholder: { flex: 1, color: colors.muted },
  chevron: { width: 9, height: 9, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.green, transform: [{ rotate: '45deg' }], marginTop: -4, marginLeft: 8 },
  chevronUp: { transform: [{ rotate: '-135deg' }], marginTop: 4 },
  menu: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  menuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  optionOn: { backgroundColor: colors.goldSoft },
  optionOnText: { fontWeight: '800', color: colors.greenDeep },
  optionText: { color: colors.ink },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  editButton: { flex: 1, backgroundColor: '#1d4ed8', borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  editButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  saveButton: { flex: 1, backgroundColor: colors.green, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  cancelButton: { flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  backButton: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
});
