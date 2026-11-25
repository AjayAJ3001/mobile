import { StyleSheet, Text, View } from 'react-native';
import { APP_NAME } from './brand';
import { colors } from './theme';

export default function StatementHeader({ title, reference }) {
  return (
    <View style={styles.head}>
      <View style={styles.band}>
        <Text style={styles.brand}>{APP_NAME}</Text>
      </View>
      <Text style={[styles.doc, !reference && styles.docAlone]}>{title}</Text>
      {reference ? <Text style={styles.ref}>{reference}</Text> : null}
    </View>
  );
}

export function StatementFields({ rows }) {
  const pairs = [];
  for (let index = 0; index < rows.length; index += 2) pairs.push(rows.slice(index, index + 2));
  return (
    <View style={styles.fields}>
      {pairs.map((pair) => (
        <View key={pair.map(([label]) => label).join('-')} style={styles.pair}>
          {pair.map(([label, value]) => (
            <View key={label} style={styles.field}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value || '—'}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { borderWidth: 1.5, borderColor: colors.green, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 4 },
  band: { backgroundColor: colors.greenDeep, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  brand: { color: colors.paper, fontSize: 18, fontWeight: '700', letterSpacing: 0.6 },
  doc: { textAlign: 'center', color: colors.greenDeep, letterSpacing: 1.6, fontSize: 12, fontWeight: '700', marginTop: 12 },
  docAlone: { marginBottom: 12 },
  ref: { textAlign: 'center', color: colors.ink, fontSize: 22, fontWeight: '700', marginTop: 4, marginBottom: 12 },
  fields: { gap: 10 },
  pair: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 2 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  value: { color: colors.ink, fontSize: 16, fontWeight: '700' },
});
