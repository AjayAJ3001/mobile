import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { colors } from '../theme';

const emptyParty = { name: '', contactPerson: '', mobileNumber: '', address: '' };

export default function PartiesScreen() {
  const [parties, setParties] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [units, setUnits] = useState([]);
  const [partyForm, setPartyForm] = useState(emptyParty);
  const [editingPartyId, setEditingPartyId] = useState(null);
  const [unitName, setUnitName] = useState('');
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = parties.find((party) => party.id === selectedId) || null;

  const loadParties = useCallback((keepId) => api('/api/parties').then((data) => {
    const list = data.parties || [];
    setParties(list);
    setSelectedId((current) => keepId || current || list[0]?.id || null);
  }), []);

  const loadUnits = useCallback((partyId) => {
    if (!partyId) {
      setUnits([]);
      return Promise.resolve();
    }
    return api(`/api/parties/${partyId}/units`).then((data) => setUnits(data.units || []));
  }, []);

  useFocusEffect(useCallback(() => {
    loadParties().catch((err) => setError(err.message));
  }, [loadParties]));

  useEffect(() => {
    setUnitName('');
    setEditingUnitId(null);
    loadUnits(selectedId).catch((err) => setError(err.message));
  }, [loadUnits, selectedId]);

  async function saveParty() {
    if (!partyForm.name.trim()) return setError('Enter the party name.');
    setBusy(true);
    setError('');
    try {
      const savedId = editingPartyId
        ? (await api(`/api/parties/${editingPartyId}`, { method: 'PUT', body: partyForm }), editingPartyId)
        : (await api('/api/parties', { method: 'POST', body: partyForm })).party.id;
      setPartyForm(emptyParty);
      setEditingPartyId(null);
      await loadParties(savedId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveUnit() {
    if (!selectedId) return setError('Choose a party first.');
    if (!unitName.trim()) return setError('Enter the unit name.');
    setBusy(true);
    setError('');
    try {
      if (editingUnitId) await api(`/api/party-units/${editingUnitId}`, { method: 'PUT', body: { name: unitName } });
      else await api(`/api/parties/${selectedId}/units`, { method: 'POST', body: { name: unitName } });
      setUnitName('');
      setEditingUnitId(null);
      await Promise.all([loadUnits(selectedId), loadParties(selectedId)]);
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
        <Text style={styles.title}>{editingPartyId ? 'Edit party' : 'Add party'}</Text>
        <TextInput style={styles.input} value={partyForm.name} onChangeText={(name) => setPartyForm({ ...partyForm, name })} placeholder="Party name" placeholderTextColor={colors.muted} />
        <TextInput style={styles.input} value={partyForm.contactPerson} onChangeText={(contactPerson) => setPartyForm({ ...partyForm, contactPerson })} placeholder="Contact person" placeholderTextColor={colors.muted} />
        <TextInput style={styles.input} value={partyForm.mobileNumber} onChangeText={(mobileNumber) => setPartyForm({ ...partyForm, mobileNumber })} placeholder="Mobile" placeholderTextColor={colors.muted} keyboardType="phone-pad" />
        <TextInput style={styles.input} value={partyForm.address} onChangeText={(address) => setPartyForm({ ...partyForm, address })} placeholder="Address" placeholderTextColor={colors.muted} />
        <View style={styles.actions}>
          <Pressable style={styles.button} disabled={busy} onPress={saveParty}><Text style={styles.buttonText}>{busy ? 'Saving…' : editingPartyId ? 'Save party' : 'Add party'}</Text></Pressable>
          {editingPartyId ? <Pressable style={styles.ghost} onPress={() => { setEditingPartyId(null); setPartyForm(emptyParty); }}><Text style={styles.ghostText}>Cancel</Text></Pressable> : null}
        </View>
      </View>
      {parties.map((party) => (
        <Pressable key={party.id} style={[styles.card, party.id === selectedId && styles.selected]} onPress={() => setSelectedId(party.id)}>
          <View style={styles.row}>
            <View style={styles.body}>
              <Text style={styles.title}>{party.name}</Text>
              {party.contactPerson ? <Text style={styles.meta}>{party.contactPerson}{party.mobileNumber ? ` · ${party.mobileNumber}` : ''}</Text> : null}
              <Text style={styles.meta}>{party.unitCount} units</Text>
            </View>
            <Pressable onPress={() => { setSelectedId(party.id); setEditingPartyId(party.id); setPartyForm({ name: party.name, contactPerson: party.contactPerson, mobileNumber: party.mobileNumber, address: party.address, status: party.status }); }}>
              <Text style={styles.link}>Edit</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}
      <View style={styles.card}>
        <Text style={styles.title}>{selected ? `${selected.name} units` : 'Units'}</Text>
        <TextInput style={styles.input} value={unitName} onChangeText={setUnitName} placeholder="Unit name" placeholderTextColor={colors.muted} />
        <View style={styles.actions}>
          <Pressable style={styles.button} disabled={busy || !selected} onPress={saveUnit}><Text style={styles.buttonText}>{busy ? 'Saving…' : editingUnitId ? 'Save unit' : 'Add unit'}</Text></Pressable>
          {editingUnitId ? <Pressable style={styles.ghost} onPress={() => { setEditingUnitId(null); setUnitName(''); }}><Text style={styles.ghostText}>Cancel</Text></Pressable> : null}
        </View>
        {units.map((unit) => (
          <View key={unit.id} style={styles.unit}>
            <Text style={styles.unitName}>{unit.name}</Text>
            <Pressable onPress={() => { setEditingUnitId(unit.id); setUnitName(unit.name); }}><Text style={styles.link}>Edit</Text></Pressable>
          </View>
        ))}
        {selected && !units.length ? <Text style={styles.meta}>No units for this party.</Text> : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  selected: { borderColor: colors.greenDeep },
  title: { fontSize: 16, fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, color: colors.ink },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, backgroundColor: colors.green, borderRadius: 12, padding: 12, alignItems: 'center' },
  buttonText: { color: colors.onYellow, fontWeight: '700' },
  ghost: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  ghostText: { color: colors.ink, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  body: { flex: 1, gap: 2 },
  link: { color: colors.greenDeep, fontWeight: '700' },
  unit: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 },
  unitName: { fontWeight: '700', color: colors.ink },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
