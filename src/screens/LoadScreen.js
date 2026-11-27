import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { downloadLoad, printLoad, shareLoad } from '../loadFile';
import { colors } from '../theme';

function setChoices(truck) {
  if (truck.sets?.length) return truck.sets;
  return Array.from({ length: 18 }, (_, index) => ({ setNo: String(index + 1), totalBags: null, balanceBags: null }));
}

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

function Field({ label, value }) {
  return (
    <View style={styles.pairItem}>
      <Text style={styles.pairLabel}>{label}</Text>
      <Text style={styles.pairValue}>{value || '—'}</Text>
    </View>
  );
}

function Details({ truck }) {
  return (
    <>
      <View style={styles.rrBlock}>
        <View style={styles.pair}>
          <Field label="RR No" value={truck.rrNo} />
          <Field label="RR Date" value={truck.rrDate} />
        </View>
        <Field label="FNR" value={truck.fnr} />
        <View style={styles.pair}>
          <Field label="Station From" value={truck.stationFrom} />
          <Field label="Station To" value={truck.stationTo} />
        </View>
      </View>
      <View style={styles.pair}>
        <Field label="S.no" value={truck.sno} />
        <Field label="Trip" value={`Trip ${truck.trip || 1}`} />
      </View>
      <Field label="Truck number" value={truck.truckNo} />
      <Field label="Commodity" value={truck.commodity} />
      <Field label="Party name" value={truck.partyName} />
      <View style={styles.pair}>
        <Field label="Delivery to" value={truck.deliveryTo} />
        <Field label="Date" value={truck.date} />
      </View>
    </>
  );
}

export default function LoadScreen({ route, navigation }) {
  const [truck, setTruck] = useState(route.params.truck);
  const [bags, setBags] = useState('');
  const [setNo, setSetNo] = useState(null);
  const [setOpen, setSetOpen] = useState(false);
  const [wagonId, setWagonId] = useState(null);
  const [wagonOpen, setWagonOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTruckNo, setEditTruckNo] = useState('');
  const [editUnitId, setEditUnitId] = useState(null);
  const [editDeliveryTo, setEditDeliveryTo] = useState('');
  const [editUnitOpen, setEditUnitOpen] = useState(false);
  const [partyUnits, setPartyUnits] = useState(route.params.truck?.partyUnits || []);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const cur = route.params.truck;
    setTruck(cur);
    setBags('');
    setSetNo(null);
    setSetOpen(false);
    setWagonId(null);
    setWagonOpen(false);
    setIsEditing(false);
    setEditTruckNo(cur.truckNo || '');
    setEditUnitId(cur.unitId || null);
    setEditDeliveryTo(cur.deliveryTo || '');
    setEditUnitOpen(false);
    setPartyUnits(cur.partyUnits || []);
    setError('');
  }, [route.params.truck]);

  // Load available delivery units reliably from api
  useEffect(() => {
    api('/api/trucks')
      .then((data) => {
        const allParties = data.parties || [];
        const party = matchParty(allParties, truck.partyName) || allParties.find((p) => p.id === truck.partyId);
        let units = party?.units || [];
        if (!units.length) {
          // Gather all active units across all parties as fallback
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
  }, [truck?.partyName, truck?.partyId, truck?.deliveryTo, editDeliveryTo]);

  const saved = Boolean(truck.load);
  const choices = setChoices(truck);
  const selectedSet = choices.find((item) => Number(item.setNo) === Number(setNo)) || (saved ? choices.find((item) => Number(item.setNo) === Number(truck.load.setNo)) : null);
  const wagons = selectedSet?.wagons || [];
  const selectedWagon = wagons.find((item) => item.id === wagonId) || (saved ? wagons.find((item) => item.id === truck.load?.wagonId) : null);
  const selectedUnit = partyUnits.find((u) => u.id === editUnitId) || null;

  function startEditing() {
    setEditTruckNo(truck.truckNo || '');
    setEditUnitId(truck.unitId || null);
    setEditDeliveryTo(truck.deliveryTo || '');
    setBags(truck.load?.bags ? String(truck.load.bags) : '');
    setSetNo(truck.load?.setNo ? Number(truck.load.setNo) : null);
    setWagonId(truck.load?.wagonId || null);
    setSetOpen(false);
    setWagonOpen(false);
    setEditUnitOpen(false);
    setError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    setEditTruckNo(truck.truckNo || '');
    setEditUnitId(truck.unitId || null);
    setEditDeliveryTo(truck.deliveryTo || '');
    setBags('');
    setSetNo(null);
    setWagonId(null);
    setSetOpen(false);
    setWagonOpen(false);
    setEditUnitOpen(false);
    setError('');
    setIsEditing(false);
  }

  async function submit() {
    const count = Number(bags);
    if (!Number.isInteger(count) || count < 1) {
      setError('Enter the number of bags.');
      return;
    }
    if (!setNo) {
      setError('Choose a set number.');
      return;
    }
    if (!selectedWagon) {
      setError('Choose the wagon number.');
      return;
    }
    if (count > selectedWagon.balanceBags) {
      setError(`Wagon ${selectedWagon.wagonNo} has ${selectedWagon.balanceBags} bags left.`);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/loads', { method: 'POST', body: { truckId: truck.id, bags: count, setNo, wagonId: selectedWagon.id } });
      setTruck({ ...data.truck, partyUnits: data.truck?.partyUnits?.length ? data.truck.partyUnits : partyUnits });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    const count = Number(bags);
    if (!editTruckNo.trim()) {
      const msg = 'Enter the truck number.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    if (!Number.isInteger(count) || count < 1) {
      const msg = 'Enter the number of bags.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    if (!setNo) {
      const msg = 'Choose a set number.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    if (!selectedWagon) {
      const msg = 'Choose the wagon number.';
      setError(msg);
      Alert.alert('Validation Error', msg);
      return;
    }
    const currentWagonBalance = selectedWagon.id === truck.load?.wagonId
      ? selectedWagon.balanceBags + Number(truck.load?.bags || 0)
      : selectedWagon.balanceBags;
    if (count > currentWagonBalance) {
      const msg = `Wagon ${selectedWagon.wagonNo} has ${currentWagonBalance} bags left.`;
      setError(msg);
      Alert.alert('Wagon Limit Exceeded', msg);
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
      bags: count,
      setNo,
      wagonId: selectedWagon.id,
    };
    try {
      let data;
      try {
        data = await api(`/api/loads/${truck.id}`, {
          method: 'PUT',
          body: payload,
        });
      } catch (putErr) {
        if (putErr.message && (putErr.message.includes('404') || putErr.message.includes('Cannot PUT'))) {
          data = await api('/api/loads', {
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
        partyUnits: data?.truck?.partyUnits?.length ? data.truck.partyUnits : partyUnits,
        load: {
          ...(truck.load || {}),
          ...(data?.truck?.load || {}),
          bags: count,
          setNo: setNo,
          wagonId: selectedWagon.id,
          wagonNo: selectedWagon.wagonNo || data?.truck?.load?.wagonNo || truck.load?.wagonNo || '',
        },
      };
      setTruck(updatedTruck);
      setIsEditing(false);
      Alert.alert('Success', 'Load details updated successfully!');
    } catch (err) {
      setError(err.message);
      Alert.alert('Update Error', err.message);
    } finally {
      setBusy(false);
    }
  }

  async function run(action) {
    setError('');
    try {
      await action(truck);
    } catch (err) {
      setError(err.message);
    }
  }

  const displayedDeliveryTo = selectedUnit?.name || editDeliveryTo || truck.deliveryTo;

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.card}>
        {isEditing ? (
          <>
            <View style={styles.editHeader}>
              <Text style={styles.editTitle}>Edit Load Entry</Text>
              <Text style={styles.editSub}>S.no: {truck.sno} · Trip {truck.trip || 1}</Text>
            </View>

            <View style={styles.rrBlock}>
              <View style={styles.pair}>
                <Field label="RR No" value={truck.rrNo} />
                <Field label="RR Date" value={truck.rrDate} />
              </View>
              <Field label="Party name" value={truck.partyName} />
              <Field label="Commodity" value={truck.commodity} />
            </View>

            <Text style={styles.label}>Truck number</Text>
            <TextInput
              style={styles.input}
              value={editTruckNo}
              autoCapitalize="characters"
              placeholder="Truck number"
              onChangeText={(value) => setEditTruckNo(value.toUpperCase())}
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

            <Text style={styles.label}>Bags</Text>
            <TextInput
              style={styles.input}
              value={bags}
              placeholder="Number of bags"
              keyboardType="number-pad"
              inputMode="numeric"
              onChangeText={(value) => setBags(value.replace(/[^0-9]/g, ''))}
            />

            <Text style={styles.label}>Set no</Text>
            <Pressable style={styles.dropdown} onPress={() => setSetOpen((open) => !open)}>
              <Text style={setNo ? styles.dropdownText : styles.dropdownPlaceholder}>
                {setNo ? `Set ${setNo}` : 'Choose set no'}
              </Text>
              <View style={[styles.chevron, setOpen && styles.chevronUp]} />
            </Pressable>
            {setOpen ? (
              <View style={styles.menu}>
                {choices.map((item) => (
                  <Pressable
                    key={item.setNo}
                    style={[styles.menuItem, Number(item.setNo) === setNo && styles.optionOn]}
                    onPress={() => {
                      setSetNo(Number(item.setNo));
                      setWagonId(null);
                      setSetOpen(false);
                      setWagonOpen(false);
                    }}
                  >
                    <Text style={Number(item.setNo) === setNo ? styles.optionOnText : styles.optionText}>
                      {item.balanceBags == null ? `Set ${item.setNo}` : `Set ${item.setNo} · balance ${item.balanceBags}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={styles.label}>Wagon no</Text>
            <Pressable
              style={styles.dropdown}
              disabled={!setNo}
              onPress={() => setNo && setWagonOpen((open) => !open)}
            >
              <Text style={selectedWagon ? styles.dropdownText : styles.dropdownPlaceholder}>
                {selectedWagon?.wagonNo || (setNo ? 'Choose wagon no' : 'Choose set no first')}
              </Text>
              <View style={[styles.chevron, wagonOpen && styles.chevronUp]} />
            </Pressable>
            {selectedWagon ? (
              <>
                <Text style={styles.row}><Text style={styles.rowLabel}>Articles: </Text>{selectedWagon.articleCount}</Text>
                <Text style={styles.row}>
                  <Text style={styles.rowLabel}>Available balance: </Text>
                  {selectedWagon.id === truck.load?.wagonId
                    ? selectedWagon.balanceBags + Number(truck.load?.bags || 0)
                    : selectedWagon.balanceBags}
                </Text>
              </>
            ) : null}
            {wagonOpen ? (
              <View style={styles.menu}>
                {wagons.map((item) => {
                  const avail = item.id === truck.load?.wagonId
                    ? item.balanceBags + Number(truck.load?.bags || 0)
                    : item.balanceBags;
                  return (
                    <Pressable
                      key={item.id}
                      style={[styles.menuItem, item.id === wagonId && styles.optionOn]}
                      onPress={() => {
                        setWagonId(item.id);
                        setWagonOpen(false);
                      }}
                    >
                      <Text style={item.id === wagonId ? styles.optionOnText : styles.optionText}>
                        {item.wagonNo} · {avail} left
                      </Text>
                    </Pressable>
                  );
                })}
                {!wagons.length ? <Text style={styles.menuItem}>This set has no wagons.</Text> : null}
              </View>
            ) : null}

            {error ? <Text style={[styles.error, { marginTop: 10 }]}>{error}</Text> : null}
            <Pressable style={styles.primary} disabled={busy} onPress={saveEdit}>
              <Text style={styles.primaryText}>{busy ? 'Saving changes…' : 'Save Changes'}</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} disabled={busy} onPress={cancelEditing}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Details truck={truck} />
            {truck.closed && !saved ? (
              <Text style={styles.pending}>Load not entered. This RR is closed.</Text>
            ) : saved ? (
              <>
                <Text style={styles.row}><Text style={styles.rowLabel}>Bags: </Text>{truck.load.bags}</Text>
                <Text style={styles.row}><Text style={styles.rowLabel}>Set no: </Text>{truck.load.setNo}</Text>
                <Text style={styles.row}><Text style={styles.rowLabel}>Wagon no: </Text>{truck.load.wagonNo || '—'}</Text>
                <Text style={styles.row}><Text style={styles.rowLabel}>Articles: </Text>{selectedWagon?.articleCount ?? '—'}</Text>
                <Text style={styles.row}><Text style={styles.rowLabel}>Balance bags: </Text>{selectedWagon?.balanceBags ?? '—'}</Text>
                <View style={styles.actions}>
                  <Pressable style={[styles.action, styles.editAction]} onPress={startEditing}>
                    <Text style={[styles.actionText, styles.editActionText]}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.action} onPress={() => navigation.navigate('LoadView', { truck })}>
                    <Text style={styles.actionText}>View</Text>
                  </Pressable>
                  <Pressable style={styles.action} onPress={() => run(printLoad)}>
                    <Text style={styles.actionText}>Print</Text>
                  </Pressable>
                  <Pressable style={styles.action} onPress={() => run(shareLoad)}>
                    <Text style={styles.actionText}>Share</Text>
                  </Pressable>
                  <Pressable style={styles.action} onPress={() => run(downloadLoad)}>
                    <Text style={styles.actionText}>Download</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.label}>Bags</Text>
                <TextInput
                  style={styles.input}
                  value={bags}
                  placeholder="Number of bags"
                  keyboardType="number-pad"
                  inputMode="numeric"
                  onChangeText={(value) => setBags(value.replace(/[^0-9]/g, ''))}
                />
                <Text style={styles.label}>Set no</Text>
                <Pressable style={styles.dropdown} onPress={() => setSetOpen((open) => !open)}>
                  <Text style={setNo ? styles.dropdownText : styles.dropdownPlaceholder}>{setNo || 'Choose set no'}</Text>
                  <View style={[styles.chevron, setOpen && styles.chevronUp]} />
                </Pressable>
                {setOpen ? (
                  <View style={styles.menu}>
                    {choices.map((item) => (
                      <Pressable
                        key={item.setNo}
                        style={[styles.menuItem, Number(item.setNo) === setNo && styles.optionOn]}
                        onPress={() => {
                          setSetNo(Number(item.setNo));
                          setWagonId(null);
                          setSetOpen(false);
                          setWagonOpen(false);
                        }}
                      >
                        <Text style={Number(item.setNo) === setNo ? styles.optionOnText : styles.optionText}>
                          {item.balanceBags == null ? item.setNo : `${item.setNo} · balance ${item.balanceBags}`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                <Text style={styles.label}>Wagon no</Text>
                <Pressable
                  style={styles.dropdown}
                  disabled={!setNo}
                  onPress={() => setNo && setWagonOpen((open) => !open)}
                >
                  <Text style={selectedWagon ? styles.dropdownText : styles.dropdownPlaceholder}>
                    {selectedWagon?.wagonNo || (setNo ? 'Choose wagon no' : 'Choose set no first')}
                  </Text>
                  <View style={[styles.chevron, wagonOpen && styles.chevronUp]} />
                </Pressable>
                {selectedWagon ? (
                  <>
                    <Text style={styles.row}><Text style={styles.rowLabel}>Articles: </Text>{selectedWagon.articleCount}</Text>
                    <Text style={styles.row}><Text style={styles.rowLabel}>Balance bags: </Text>{selectedWagon.balanceBags}</Text>
                  </>
                ) : null}
                {wagonOpen ? (
                  <View style={styles.menu}>
                    {wagons.map((item) => (
                      <Pressable
                        key={item.id}
                        style={[styles.menuItem, item.id === wagonId && styles.optionOn]}
                        onPress={() => {
                          setWagonId(item.id);
                          setWagonOpen(false);
                        }}
                      >
                        <Text style={item.id === wagonId ? styles.optionOnText : styles.optionText}>
                          {item.wagonNo} · {item.balanceBags} left
                        </Text>
                      </Pressable>
                    ))}
                    {!wagons.length ? <Text style={styles.menuItem}>This set has no wagons.</Text> : null}
                  </View>
                ) : null}
                <Pressable style={styles.primary} disabled={busy} onPress={submit}>
                  <Text style={styles.primaryText}>{busy ? 'Submitting…' : 'Submit'}</Text>
                </Pressable>
              </>
            )}
          </>
        )}
        <View style={styles.buttonRow}>
          <Pressable style={styles.navButton} onPress={() => navigation.goBack()}>
            <Text style={styles.navText}>Back</Text>
          </Pressable>
          <Pressable style={styles.navButton} onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.navText}>Home</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  rrBlock: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, gap: 10 },
  pair: { flexDirection: 'row', gap: 12 },
  pairItem: { flex: 1, gap: 2 },
  pairLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  pairValue: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  row: { color: colors.ink },
  rowLabel: { fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  navButton: { flex: 1, borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  navText: { color: colors.ink, fontWeight: '700' },
  label: { marginTop: 8, fontWeight: '700' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, fontWeight: '700', color: colors.ink },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { flex: 1, fontWeight: '700', color: colors.ink },
  dropdownPlaceholder: { flex: 1, color: colors.muted },
  chevron: { width: 9, height: 9, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.green, transform: [{ rotate: '45deg' }], marginTop: -4, marginLeft: 8 },
  chevronUp: { transform: [{ rotate: '-135deg' }], marginTop: 4 },
  menu: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  menuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  optionOn: { backgroundColor: colors.green, borderColor: colors.green },
  optionText: { color: colors.ink },
  optionOnText: { color: colors.onYellow, fontWeight: '700' },
  primary: { backgroundColor: colors.green, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 12 },
  primaryText: { color: colors.onYellow, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  action: { flexGrow: 1, flexBasis: '45%', backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionText: { color: colors.onYellow, fontWeight: '700' },
  editAction: { backgroundColor: '#1d4ed8' },
  editActionText: { color: '#ffffff', fontWeight: '800' },
  editHeader: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, padding: 12, marginBottom: 4 },
  editTitle: { color: '#1d4ed8', fontSize: 18, fontWeight: '800' },
  editSub: { color: '#3b82f6', fontSize: 13, fontWeight: '700', marginTop: 2 },
  cancelButton: { borderWidth: 1, borderColor: colors.line, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: colors.ink, fontWeight: '700' },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12, marginBottom: 12 },
  pending: { backgroundColor: colors.dangerSoft, color: colors.danger, fontWeight: '700', padding: 12, borderRadius: 12 },
});
