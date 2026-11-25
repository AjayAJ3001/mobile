import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export default function EntryPrompt({ prompt, onExit, onConfirm }) {
  if (!prompt) return null;
  const closing = prompt.mode === 'close';
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onExit}>
      <View style={styles.mask}>
        <View style={styles.card}>
          <Text style={styles.title}>{closing ? 'Close the entry' : 'Start the entry'}</Text>
          <Text style={styles.message}>
            {closing ? `Close the entry for RR ${prompt.rrNo}?` : `Start the entry for RR ${prompt.rrNo}?`}
          </Text>
          <Pressable style={styles.exit} onPress={onExit}>
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
          <Pressable style={closing ? styles.close : styles.start} onPress={onConfirm}>
            <Text style={closing ? styles.closeText : styles.startText}>{closing ? 'Close the entry' : 'Start the entry'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: { flex: 1, backgroundColor: 'rgba(26, 20, 48, 0.45)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, gap: 12, borderWidth: 1, borderColor: colors.line },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  message: { color: colors.ink, fontWeight: '700', lineHeight: 22 },
  exit: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  exitText: { color: colors.ink, fontWeight: '800' },
  start: { backgroundColor: colors.green, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  startText: { color: colors.onYellow, fontWeight: '800' },
  close: { backgroundColor: colors.danger, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  closeText: { color: '#fff', fontWeight: '800' },
});
