import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReportTable } from '../ReportSheet';
import { colors } from '../theme';
import { downloadReport, printReport, shareReport } from '../reportFile';

export default function ReportViewScreen({ route, navigation }) {
  const report = route.params.report;
  const plain = route.name === 'ReportPreview';
  const items = (report.groups || []).flatMap((group) => group.items || []);
  const several = items.length > 1;
  const [error, setError] = useState('');

  async function run(action) {
    try {
      await action(report);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <View style={styles.page}>
      {plain ? null : (
        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={() => navigation.navigate('ReportPreview', { report })}><Text style={styles.actionText}>View</Text></Pressable>
            <Pressable style={styles.action} onPress={() => run(printReport)}><Text style={styles.actionText}>Print</Text></Pressable>
            <Pressable style={[styles.action, styles.share]} onPress={() => run(shareReport)}><Text style={styles.shareText}>Share</Text></Pressable>
            <Pressable style={styles.action} onPress={() => run(downloadReport)}><Text style={styles.actionText}>{several ? 'Download all' : 'Download'}</Text></Pressable>
          </View>
        </View>
      )}
      <ReportTable items={items} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 12, gap: 12 },
  card: { backgroundColor: colors.panel, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { flexGrow: 1, flexBasis: '22%', minWidth: 76, backgroundColor: colors.greenDeep, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  share: { backgroundColor: '#FF2D87' },
  shareText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
});
