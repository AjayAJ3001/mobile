import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { colors } from '../theme';
import PdfListScreen, { PdfPage } from './PdfListScreen';

export default function RrMasterScreen() {
  const [masters, setMasters] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api('/api/rr-masters').then((data) => setMasters(data.masters || [])).catch((err) => setError(err.message));
  }, []);

  useFocusEffect(load);

  async function storeOriginal() {
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
        body.append('file', pdf, file.name || 'rr-master.pdf');
      } else {
        body.append('file', {
          uri: file.uri,
          name: file.name || 'rr-master.pdf',
          type: file.mimeType || 'application/pdf',
        });
      }
      await api('/api/rr-masters', { method: 'POST', body });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PdfPage>
      <Text style={styles.lead}>Store the original railway receipt PDF here, exactly as it is uploaded.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} disabled={busy} onPress={storeOriginal}>
        <Text style={styles.buttonText}>{busy ? 'Storing…' : 'Store original PDF'}</Text>
      </Pressable>
      <PdfListScreen items={masters} filePath={(item) => `/api/rr-masters/${item.id}/file`} empty="No original PDFs stored yet." />
    </PdfPage>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted },
  error: { backgroundColor: colors.dangerSoft, color: colors.danger, padding: 12, borderRadius: 12 },
  button: { backgroundColor: colors.green, borderRadius: 14, padding: 14, alignItems: 'center' },
  buttonText: { color: colors.onYellow, fontWeight: '700' },
});
