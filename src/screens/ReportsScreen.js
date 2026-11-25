import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { colors } from '../theme';
import { downloadReport, shareReport } from '../reportFile';
import { REPORT_MODES, buildReport, reportChoices } from '../reportData';

function Drop({ label, value, placeholder, options, format = (item) => item, open, onToggle, onPick }) {
  return (
    <View style={styles.dropWrap}>
      {label ? <Text style={styles.dropLabel}>{label}</Text> : null}
      <Pressable style={styles.dropdown} onPress={onToggle}>
        <Text style={value ? styles.dropdownText : styles.dropdownPlaceholder}>{value ? format(value) : placeholder}</Text>
        <View style={[styles.chevron, open && styles.chevronUp]} />
      </Pressable>
      {open ? (
        <View style={styles.menu}>
          <Pressable style={styles.menuItem} onPress={() => onPick('')}>
            <Text style={styles.optionText}>{placeholder}</Text>
          </Pressable>
          {options.map((item) => (
            <Pressable key={item} style={[styles.menuItem, item === value && styles.optionOn]} onPress={() => onPick(item)}>
              <Text style={item === value ? styles.optionOnText : styles.optionText}>{format(item)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function ReportPanel({ navigation }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('rr');
  const [value, setValue] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState('');

  useFocusEffect(useCallback(() => {
    api('/api/reports')
      .then((data) => setRows(data.rows || []))
      .catch((err) => setError(err.message));
  }, []));

  const choices = useMemo(() => reportChoices(rows, mode), [rows, mode]);
  const report = useMemo(() => buildReport(rows, mode, { value, from, to }), [rows, mode, value, from, to]);
  const placeholder = { rr: 'All RR no', truck: 'All trucks', set: 'All sets', bags: 'All bags', date: 'Any date' }[mode];
  const allReport = { label: 'All reports', groups: report.groups };

  function changeMode(next) {
    setMode(next);
    setValue('');
    setFrom('');
    setTo('');
    setOpen('');
  }

  function openReport(one) {
    navigation.navigate('ReportView', { report: one });
  }

  function Actions({ report }) {
    return (
      <View style={styles.lineActions}>
        <Pressable style={styles.mini} onPress={() => navigation.navigate('ReportPreview', { report })}><Text style={styles.miniText}>View</Text></Pressable>
        <Pressable style={[styles.mini, styles.share]} onPress={() => shareReport(report).catch((err) => setError(err.message))}><Text style={styles.shareText}>Share</Text></Pressable>
        <Pressable style={styles.mini} onPress={() => downloadReport(report).catch((err) => setError(err.message))}><Text style={styles.miniText}>Download</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Text style={styles.lead}>Report</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {REPORT_MODES.map((item) => {
          const on = item.id === mode;
          return (
            <Pressable key={item.id} style={[styles.chip, on && styles.chipOn]} onPress={() => changeMode(item.id)}>
              <Text style={on ? styles.chipOnText : styles.chipText}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {mode === 'date' ? (
        <View style={styles.dateRow}>
          <Drop label="From" value={from} placeholder="From date" options={choices} open={open === 'from'} onToggle={() => setOpen(open === 'from' ? '' : 'from')} onPick={(item) => { setFrom(item); setOpen(''); }} />
          <Drop label="To" value={to} placeholder="To date" options={choices} open={open === 'to'} onToggle={() => setOpen(open === 'to' ? '' : 'to')} onPick={(item) => { setTo(item); setOpen(''); }} />
        </View>
      ) : (
        <Drop
          value={value}
          placeholder={placeholder}
          options={choices}
          format={(item) => (mode === 'set' ? `Set ${item}` : mode === 'bags' ? `${item} bags` : item)}
          open={open === 'value'}
          onToggle={() => setOpen(open === 'value' ? '' : 'value')}
          onPick={(item) => { setValue(item); setOpen(''); }}
        />
      )}
      {report.groups.length ? (
        <View style={styles.entry}>
          <Pressable style={styles.entryMain} onPress={() => openReport(allReport)}>
            <View style={styles.entryBody}>
              <Text style={styles.allTitle}>All reports</Text>
              <Text style={styles.wagon}>{report.trucksGone} trucks · {report.totalBags} bags</Text>
            </View>
            <View style={styles.chevronLight} />
          </Pressable>
          <Actions report={allReport} />
        </View>
      ) : null}
      {report.groups.map((group) => (
        <View key={group.title} style={styles.card}>
          <View style={styles.groupHead}>
            <Text style={styles.title}>{group.title}</Text>
            <Text style={styles.totals}>{group.trucks} · {group.bags} bags</Text>
          </View>
          {group.items.map((item) => {
            const one = { label: `${item.truckNo} · Wagon ${item.wagonNo || '—'}`, groups: [{ title: group.title, items: [item] }] };
            return (
              <View key={`${item.rrNo}-${item.truckNo}-${item.setNo}-${item.sno}`}>
                <Pressable style={styles.line} onPress={() => openReport(one)}>
                  <Text style={styles.truckNo} numberOfLines={1}>{item.truckNo}</Text>
                  <Text style={styles.wagonLine} numberOfLines={1}>Wagon {item.wagonNo || '—'}</Text>
                  <Text style={styles.bags}>{item.bags ?? '—'}</Text>
                  <View style={styles.chevronRight} />
                </Pressable>
                <Actions report={one} />
              </View>
            );
          })}
        </View>
      ))}
      {!report.groups.length && !error ? <Text style={styles.meta}>No trucks have taken bags yet.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 18, gap: 12 },
  lead: { fontSize: 18, fontWeight: '800', color: colors.ink },
  filters: { gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.panel, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { color: colors.ink, fontWeight: '700' },
  chipOnText: { color: colors.onYellow, fontWeight: '700' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dropWrap: { flex: 1, gap: 6 },
  dropLabel: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  dropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  dropdownText: { flex: 1, fontWeight: '700', color: colors.ink },
  dropdownPlaceholder: { flex: 1, color: colors.muted },
  chevron: { width: 9, height: 9, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.greenDeep, transform: [{ rotate: '45deg' }], marginTop: -4 },
  chevronUp: { transform: [{ rotate: '-135deg' }], marginTop: 4 },
  menu: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  menuItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  optionOn: { backgroundColor: colors.green },
  optionText: { color: colors.ink },
  optionOnText: { color: colors.onYellow, fontWeight: '700' },
  summary: { flexDirection: 'row', gap: 10 },
  summaryItem: { flex: 1, backgroundColor: colors.panel, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.line },
  summaryLabel: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  summaryValue: { color: colors.greenDeep, fontSize: 28, fontWeight: '800', marginTop: 4 },
  card: { backgroundColor: colors.panel, borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, backgroundColor: colors.greenDeep, paddingHorizontal: 14, paddingVertical: 10 },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: '#fff' },
  totals: { color: colors.gold, fontWeight: '700', fontSize: 12 },
  entry: { backgroundColor: colors.greenDeep, borderRadius: 16, padding: 14, gap: 10 },
  entryMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryBody: { flex: 1, gap: 4 },
  lineActions: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 12 },
  mini: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.greenDeep, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  share: { backgroundColor: '#FF2D87', borderColor: '#FF2D87' },
  miniText: { color: colors.greenDeep, fontWeight: '800', fontSize: 12 },
  shareText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  chevronLight: { width: 9, height: 9, borderRightWidth: 2, borderTopWidth: 2, borderColor: '#FFE9A0', transform: [{ rotate: '45deg' }] },
  line: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.line, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  allTitle: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  truckNo: { flex: 1.2, fontSize: 16, fontWeight: '800', color: colors.ink, letterSpacing: 0.3 },
  wagon: { color: '#FFE9A0', fontWeight: '700' },
  wagonLine: { flex: 1, color: colors.muted, fontWeight: '700' },
  bags: { width: 48, textAlign: 'right', color: colors.greenDeep, fontWeight: '800' },
  chevronRight: { width: 9, height: 9, borderRightWidth: 2, borderTopWidth: 2, borderColor: colors.greenDeep, transform: [{ rotate: '45deg' }] },
  meta: { color: colors.muted },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
