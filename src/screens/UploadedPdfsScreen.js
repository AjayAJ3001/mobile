import { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { colors } from '../theme';
import PdfListScreen, { PdfPage } from './PdfListScreen';

export default function UploadedPdfsScreen() {
  const [pdfs, setPdfs] = useState([]);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    api('/api/uploaded-pdfs').then((data) => setPdfs(data.pdfs || [])).catch((err) => setError(err.message));
  }, []));

  return (
    <PdfPage>
      <Text style={styles.lead}>PDFs uploaded from the phone, with the date, the name, and the RR number.</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PdfListScreen items={pdfs} filePath={(item) => `/api/uploaded-pdfs/${item.id}/file`} empty="No PDFs have been uploaded yet." />
    </PdfPage>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted },
  error: { color: colors.danger },
});
