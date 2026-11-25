import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { REPORT_WIDTHS, reportColumns } from './reportFile';
import { colors } from './theme';

function show(value) {
  return value === 0 || value ? String(value) : '—';
}

export function ReportTable({ items }) {
  const labels = reportColumns().map(([label]) => label);
  const rows = items || [];
  return (
    <View style={styles.sheet}>
      <ScrollView style={styles.scroll} nestedScrollEnabled>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator directionalLockEnabled>
        <View>
          <View style={styles.headRow}>
            {labels.map((label) => (
              <Text key={label} style={[styles.cell, styles.head, { width: REPORT_WIDTHS[label] || 110 }]}>{label}</Text>
            ))}
          </View>
          {rows.map((item, index) => (
            <View key={`${item.rrNo}-${item.truckNo}-${item.setNo}-${index}`} style={[styles.dataRow, index % 2 === 1 && styles.zebra]}>
              {reportColumns(item).map(([label, value]) => (
                <Text key={label} style={[styles.cell, { width: REPORT_WIDTHS[label] || 110 }]} numberOfLines={2}>{show(value)}</Text>
              ))}
            </View>
          ))}
          {!rows.length ? <Text style={styles.empty}>No trucks have taken bags yet.</Text> : null}
        </View>
        </ScrollView>
      </ScrollView>
      <Text style={styles.hint}>Slide sideways for the rest of the columns.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  scroll: { flex: 1 },
  headRow: { flexDirection: 'row', backgroundColor: colors.greenDeep },
  dataRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.line, minHeight: 48 },
  zebra: { backgroundColor: colors.paper },
  cell: { paddingHorizontal: 10, paddingVertical: 12, color: colors.ink, fontSize: 13, fontWeight: '700' },
  head: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
  empty: { padding: 16, color: colors.muted },
  hint: { paddingHorizontal: 12, paddingVertical: 8, color: colors.muted, fontSize: 12, fontWeight: '700', backgroundColor: colors.paper },
});
