import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { exportFullData, importFullData } from "../database/backup";


export default function BackupScreen() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const data = await exportFullData();
      const jsonData = JSON.stringify(data, null, 2);
      
      const fileName = `kasir_backup_${new Date().getTime()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Simpan Backup Data',
          UTI: 'public.json'
        });
      } else {
        Alert.alert("Error", "Sharing tidak tersedia di perangkat ini");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal mengekspor data");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      "Peringatan",
      "Mengimpor data akan MENGHAPUS semua data yang ada saat ini dan menggantinya dengan data dari file backup. Lanjutkan?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Import",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: "application/json",
                copyToCacheDirectory: true,
              });

              if (result.canceled) return;

              setLoading(true);
              const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);



              const backupJson = JSON.parse(fileContent);

              await importFullData(backupJson);
              
              Alert.alert("Sukses", "Data berhasil dipulihkan. Mohon restart aplikasi untuk memuat ulang data.");
            } catch (error) {
              console.error(error);
              Alert.alert("Error", "Gagal mengimpor data. Pastikan format file benar.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>💾 Backup & Restore</Text>
      
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Tips Berbagi Data</Text>
        <Text style={styles.infoText}>
          Aplikasi ini sepenuhnya offline. Untuk berbagi data ke perangkat lain:
        </Text>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>1</Text></View>
          <Text style={styles.stepText}>Klik "Ekspor Data" di HP asal.</Text>
        </View>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2</Text></View>
          <Text style={styles.stepText}>Kirim file JSON tersebut (via WA/Email) ke HP baru.</Text>
        </View>
        <View style={styles.stepRow}>
          <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>3</Text></View>
          <Text style={styles.stepText}>Klik "Impor Data" di HP baru dan pilih file tersebut.</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" style={{ marginVertical: 30 }} />
        ) : (
          <>
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
              <Text style={styles.btnIcon}>📤</Text>
              <View>
                <Text style={styles.btnTitle}>Ekspor Data</Text>
                <Text style={styles.btnSubTitle}>Simpan file backup ke HP</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
              <Text style={styles.btnIcon}>📥</Text>
              <View>
                <Text style={[styles.btnTitle, { color: "#EF4444" }]}>Impor Data</Text>
                <Text style={styles.btnSubTitle}>Pulihkan data dari file backup</Text>
              </View>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.disclaimer}>
        * Pastikan Anda melakukan backup secara berkala untuk menghindari kehilangan data jika HP rusak atau hilang.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: "#EFF6FF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E40AF",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: "#1E40AF",
    marginBottom: 16,
    lineHeight: 20,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1E40AF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  stepBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  stepText: {
    fontSize: 14,
    color: "#3B82F6",
    flex: 1,
  },
  actionContainer: {
    gap: 12,
  },
  exportBtn: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  importBtn: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  btnIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  btnTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  btnSubTitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  disclaimer: {
    marginTop: 30,
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 18,
  },
});
