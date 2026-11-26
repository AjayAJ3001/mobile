import { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../api';
import { expandedPartyName, partyChoices } from '../partyName';
import StatementHeader, { StatementFields } from '../StatementHeader';
import { colors } from '../theme';

function finishedSet(value) {
  const text = String(value || '').trim();
  if (!/^\d{1,2}$/.test(text)) return false;
  const number = Number(text);
  if (number < 1 || number > 18) return false;
  return text !== '1';
}

export default function UploadScreen({ navigation }) {
  const [receipt, setReceipt] = useState(null);
  const [partyName, setPartyName] = useState('');
  const [parties, setParties] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const setRefs = useRef({});
  const wagonsRef = useRef([]);
  const jumpTimer = useRef(null);

  useEffect(() => () => {
    if (jumpTimer.current) clearTimeout(jumpTimer.current);
  }, []);

  useEffect(() => {
    api('/api/parties').then((data) => setParties(data.parties || [])).catch(() => {});
  }, []);

  wagonsRef.current = receipt?.wagons || [];

  function focusSet(index) {
    const wagons = wagonsRef.current;
    if (index >= wagons.length) {
      Keyboard.dismiss();
      return;
    }
    const sno = wagons[index].sno;
    listRef.current?.scrollToIndex({ index, viewPosition: 0.35, animated: true });
    setTimeout(() => setRefs.current[sno]?.focus(), 180);
  }

  function queueNextSet(index, value) {
    if (jumpTimer.current) clearTimeout(jumpTimer.current);
    const text = String(value || '').trim();
    if (!text) return;
    if (text === '1') {
      jumpTimer.current = setTimeout(() => focusSet(index + 1), 650);
      return;
    }
    if (finishedSet(text)) focusSet(index + 1);
  }

  async function pickPdf() {
    setError('');
    const picked = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (picked.canceled) return;
    const file = picked.assets[0];
    setBusy(true);
    try {
      const body = new FormData();
      if (Platform.OS === 'web') {
        const local = await fetch(file.uri);
        const source = await local.blob();
        const pdf = source.type === 'application/pdf' ? source : new Blob([source], { type: 'application/pdf' });
        body.append('file', pdf, file.name || 'receipt.pdf');
      } else {
        body.append('file', {
          uri: file.uri,
          name: file.name || 'receipt.pdf',
          type: file.mimeType || 'application/pdf',
        });
      }
      const data = await api('/api/receipts/upload', { method: 'POST', body });
      setReceipt(data.receipt);
      setPartyName(data.receipt.partyName || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (receipt.wagons.some((wagon) => !String(wagon.shedNo || '').trim())) {
      setError('Enter the set no for each wagon.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/receipts/submit', {
        method: 'POST',
        body: {
          pendingId: receipt.pendingId,
          partyName: expandedPartyName(parties, partyName, partyName),
          sheds: receipt.wagons.map((wagon) => ({ sno: wagon.sno, shedNo: wagon.shedNo })),
        },
      });
      navigation.replace('Receipt', { id: data.receipt.id, receipt: data.receipt });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!receipt) {
    return (
      <View style={styles.page}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.lead}>Upload the RR PDF, then use that RR for truck entry and load entry. Close the RR when the loads are finished. Upload the next PDF only after it is closed.</Text>
        <Pressable style={styles.primary} disabled={busy} onPress={pickPdf}>
          <Text style={styles.primaryText}>{busy ? 'Reading PDF…' : 'Upload PDF'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={receipt.wagons}
      keyExtractor={(wagon) => String(wagon.sno)}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.page}
      onScrollToIndexFailed={(info) => {
        listRef.current?.scrollToOffset({ offset: Math.max(0, info.averageItemLength * info.index), animated: true });
      }}
      ListHeaderComponent={(
        <View style={styles.formCard}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <StatementHeader title="RAILWAY RECEIPT" reference={`RR ${receipt.rrNo}`} />
          <StatementFields rows={[
            ['RR No', receipt.rrNo],
            ['RR Date', receipt.rrDate],
            ['Station From', receipt.stationFrom],
            ['Station To', receipt.stationTo],
            ['FNR', receipt.fnr],
            ['Commodity', receipt.commodityDescription],
          ]} />
          <Text style={styles.label}>Party name</Text>
          <TextInput
            style={styles.input}
            value={partyName}
            onChangeText={(value) => setPartyName(expandedPartyName(parties, value, partyName))}
            placeholder="Enter party name"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => {
              setPartyName((current) => expandedPartyName(parties, current, current));
              focusSet(0);
            }}
          />
          {partyChoices(parties, partyName).map((party) => (
            <Pressable key={party.id} style={styles.suggestion} onPress={() => setPartyName(party.name)}>
              <Text style={styles.suggestionText}>{party.name}</Text>
            </Pressable>
          ))}
        </View>
      )}
      renderItem={({ item, index }) => (
        <View style={styles.wagon}>
          <Text style={styles.wagonTitle}>S.no {item.sno}</Text>
          <Text style={styles.wagonNo}>Wagon no  {item.wagonNo}</Text>
          <Text style={styles.muted}>{item.owningRly} · {item.wagonType} · {item.articleCount} articles</Text>
          <Text style={styles.label}>Set no</Text>
          <TextInput
            ref={(node) => { setRefs.current[item.sno] = node; }}
            style={styles.input}
            value={item.shedNo}
            placeholder="Set no for this wagon"
            keyboardType="number-pad"
            returnKeyType={index === receipt.wagons.length - 1 ? 'done' : 'next'}
            blurOnSubmit={index === receipt.wagons.length - 1}
            onSubmitEditing={() => focusSet(index + 1)}
            onChangeText={(value) => {
              setReceipt((current) => ({
                ...current,
                wagons: current.wagons.map((wagon) => wagon.sno === item.sno ? { ...wagon, shedNo: value } : wagon),
              }));
              queueNextSet(index, value);
            }}
          />
        </View>
      )}
      ListFooterComponent={(
        <View style={{ gap: 10, marginTop: 8 }}>
          <Pressable style={styles.primary} disabled={busy} onPress={save}>
            <Text style={styles.primaryText}>{busy ? 'Saving…' : 'Submit'}</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  formCard: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 8 },
  lead: { fontSize: 16, lineHeight: 22 },
  line: { fontSize: 16, lineHeight: 22 },
  label: { marginTop: 8, fontWeight: '700' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12 },
  primary: { backgroundColor: colors.green, borderRadius: 14, padding: 14, alignItems: 'center' },
  primaryText: { color: colors.onYellow, fontWeight: '700' },
  wagon: { backgroundColor: colors.panel, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 4, marginTop: 10 },
  wagonTitle: { fontWeight: '700', fontSize: 16 },
  wagonNo: { fontWeight: '700', fontSize: 16, color: colors.ink, letterSpacing: 0.3 },
  suggestion: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12 },
  suggestionText: { fontWeight: '700', color: colors.ink },
  muted: { color: colors.muted },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
