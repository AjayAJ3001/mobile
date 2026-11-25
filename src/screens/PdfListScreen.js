import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { cachePdf, downloadPdfs, sharePdf, viewPdf } from '../pdfFile';
import { colors } from '../theme';

function dayKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function when(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '—', time: '—' };
  const options = { timeZone: 'Asia/Kolkata' };
  return {
    date: date.toLocaleDateString('en-IN', { ...options, day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { ...options, hour: '2-digit', minute: '2-digit' }),
  };
}

function Choice({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={styles.filterLabel}>{label}</Text>
      <Pressable style={styles.input} onPress={() => setOpen((current) => !current)}>
        <Text style={value ? styles.choiceOn : styles.choiceOff}>{value || `All ${label.toLowerCase()}`}</Text>
      </Pressable>
      {open ? options.map((option) => (
        <Pressable key={option || 'all'} style={styles.choice} onPress={() => { onChange(option); setOpen(false); }}>
          <Text style={styles.choiceOn}>{option || `All ${label.toLowerCase()}`}</Text>
        </Pressable>
      )) : null}
    </View>
  );
}

export default function PdfListScreen({ items, filePath, empty }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [rrNo, setRrNo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const names = useMemo(() => ['', ...new Set(items.map((item) => item.uploadedBy).filter(Boolean))].sort(), [items]);
  const rrNos = useMemo(() => ['', ...new Set(items.map((item) => item.rrNo).filter(Boolean))].sort(), [items]);

  const shown = useMemo(() => items.filter((item) => {
    const day = dayKey(item.uploadedAt);
    if (from && day < from) return false;
    if (to && day > to) return false;
    if (name && item.uploadedBy !== name) return false;
    if (rrNo && item.rrNo !== rrNo) return false;
    return true;
  }), [items, from, to, name, rrNo]);

  async function run(rows, action) {
    if (!rows.length || busy) return;
    setBusy(true);
    setError('');
    setNote('');
    try {
      if (action === 'download') {
        const files = [];
        for (const item of rows) files.push(await cachePdf(filePath(item), item.fileName));
        await downloadPdfs(files);
        setNote(rows.length > 1 ? 'Saved the shown PDFs.' : 'Saved the PDF.');
      } else if (action === 'share') {
        for (const item of rows) await sharePdf(filePath(item), item.fileName);
      } else if (rows.length === 1) {
        await viewPdf(filePath(rows[0]), rows[0].fileName);
      } else {
        await viewPdf(filePath(rows[0]), rows[0].fileName);
        setNote('Opened the first PDF. Each row below can open the rest.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={styles.actions}>
        <Pressable style={[styles.action, styles.solid, (!shown.length || busy) && styles.off]} disabled={!shown.length || busy} onPress={() => run(shown, 'view')}><Text style={styles.solidText}>View</Text></Pressable>
        <Pressable style={[styles.action, styles.hot, (!shown.length || busy) && styles.off]} disabled={!shown.length || busy} onPress={() => run(shown, 'share')}><Text style={styles.hotText}>Share</Text></Pressable>
        <Pressable style={[styles.action, styles.solid, (!shown.length || busy) && styles.off]} disabled={!shown.length || busy} onPress={() => run(shown, 'download')}><Text style={styles.solidText}>Download</Text></Pressable>
      </View>
      <View style={styles.filters}>
        <Text style={styles.filterLabel}>From</Text>
        <TextInput style={styles.input} value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" />
        <Text style={styles.filterLabel}>To</Text>
        <TextInput style={styles.input} value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} autoCapitalize="none" />
        <Choice label="Name" value={name} options={names} onChange={setName} />
        <Choice label="RR No" value={rrNo} options={rrNos} onChange={setRrNo} />
      </View>
      <Text style={styles.meta}>{shown.length === items.length ? `All PDFs (${shown.length})` : `Shown PDFs (${shown.length})`}</Text>
      {shown.map((item) => {
        const stamp = when(item.uploadedAt);
        return (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>{item.fileName}</Text>
            <Text style={styles.meta}>RR {item.rrNo || '—'} · {item.uploadedBy}</Text>
            <Text style={styles.meta}>{stamp.date} · {stamp.time}</Text>
            <View style={styles.actions}>
              <Pressable style={[styles.action, styles.solid]} disabled={busy} onPress={() => run([item], 'view')}><Text style={styles.solidText}>View</Text></Pressable>
              <Pressable style={[styles.action, styles.hot]} disabled={busy} onPress={() => run([item], 'share')}><Text style={styles.hotText}>Share</Text></Pressable>
              <Pressable style={[styles.action, styles.solid]} disabled={busy} onPress={() => run([item], 'download')}><Text style={styles.solidText}>Download</Text></Pressable>
            </View>
          </View>
        );
      })}
      {!shown.length ? <Text style={styles.meta}>{items.length ? 'No PDFs match these filters.' : empty}</Text> : null}
    </View>
  );
}

export function PdfPage({ children }) {
  return <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  wrap: { gap: 10 },
  filters: { gap: 8 },
  filterLabel: { fontWeight: '700', color: colors.ink },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, color: colors.ink },
  choice: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 10 },
  choiceOn: { color: colors.ink, fontWeight: '700' },
  choiceOff: { color: colors.muted },
  off: { opacity: 0.5 },
  navy: { backgroundColor: colors.greenDeep },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 4 },
  title: { fontWeight: '800', color: colors.ink },
  meta: { color: colors.muted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  action: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  solid: { backgroundColor: colors.greenDeep },
  solidText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  hot: { backgroundColor: '#FF2D87' },
  hotText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
  note: { backgroundColor: colors.okSoft, color: colors.ok, padding: 12, borderRadius: 12 },
});
