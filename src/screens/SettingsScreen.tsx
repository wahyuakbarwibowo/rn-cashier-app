import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from "react-native";
import { getShopProfile, updateShopProfile } from "../database/settings";

export default function SettingsScreen() {
  const [name, setName] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await getShopProfile();
      if (profile) {
        setName(profile.name || "");
        setFooterNote(profile.footer_note || "");
        setCashierName(profile.cashier_name || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!name.trim()) {
        Alert.alert("Error", "Nama toko harus diisi");
        return;
      }
      await updateShopProfile({ name, footer_note: footerNote, cashier_name: cashierName });
      Alert.alert("Sukses", "Profil toko berhasil diperbarui");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal memperbarui profil toko");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.header}>⚙️ Pengaturan Toko</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nama Toko</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Contoh: Toko Berkah"
          />

          <Text style={styles.label}>Nama Kasir</Text>
          <TextInput
            style={styles.input}
            value={cashierName}
            onChangeText={setCashierName}
            placeholder="Contoh: Budi Santoso"
          />

          <Text style={styles.label}>Catatan Kaki Struk (Footnote)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={footerNote}
            onChangeText={setFooterNote}
            placeholder="Contoh: Terima kasih sudah belanja!"
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.info}>
          * Pengaturan ini akan muncul pada struk penjualan.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: "row",
    gap: 10,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 2,
    position: "relative",
  },
  themeText: {
    fontWeight: "600",
    fontSize: 13,
  },
  checkMark: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  info: {
    marginTop: 16,
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
  },
});
