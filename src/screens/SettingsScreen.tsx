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
  Switch, // Import Switch
} from "react-native";
import { getShopProfile, updateShopProfile } from "../database/settings";
import { ShopProfile } from "../types/database";

export default function SettingsScreen() {
  const [name, setName] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [poinEnabled, setPoinEnabled] = useState(false); // New state for points, default to false
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
        setPhoneNumber(profile.phone_number || "");
        setAddress(profile.address || "");
        // Explicitly set to false if 0, true if 1. Defaults to false if undefined/null
        setPoinEnabled(profile.poin_enabled === 1); 
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal memuat profil toko");
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
      const updatedProfile: Partial<ShopProfile> = {
        name,
        footer_note: footerNote,
        cashier_name: cashierName,
        phone_number: phoneNumber,
        address: address,
        poin_enabled: poinEnabled ? 1 : 0, // Convert boolean to number
      };
      await updateShopProfile(updatedProfile);
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
            autoCapitalize="words"
          />

          <Text style={styles.label}>Nama Kasir</Text>
          <TextInput
            style={styles.input}
            value={cashierName}
            onChangeText={setCashierName}
            placeholder="Contoh: Budi Santoso"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Nomor Telepon</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Contoh: 081234567890"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Alamat Toko</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Contoh: Jl. Merdeka No. 10, Jakarta Pusat"
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
          />

          {/* New Poin Switch */}
          <View style={styles.switchRow}>
            <Text style={styles.label}>Tampilkan Info Poin di Struk</Text>
            <Switch
              trackColor={{ false: "#D1D5DB", true: "#60A5FA" }}
              thumbColor={poinEnabled ? "#1E40AF" : "#F9FAFB"}
              onValueChange={setPoinEnabled}
              value={poinEnabled}
            />
          </View>

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    flexShrink: 1,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  saveButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
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