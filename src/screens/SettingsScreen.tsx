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
import { useNavigation } from "@react-navigation/native";
import { getShopProfile, updateShopProfile, ShopProfile } from "../database/settings";

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [cashierName, setCashierName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // New state for phone number
  const [address, setAddress] = useState("");       // New state for address
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
        setPhoneNumber(profile.phone_number || ""); // Load phone number
        setAddress(profile.address || "");         // Load address
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
      // Prepare data for update, including new fields
      const updatedProfile: Partial<ShopProfile> = {
        name,
        footer_note: footerNote,
        cashier_name: cashierName,
        phone_number: phoneNumber, // Include phone number
        address: address,         // Include address
      };
      await updateShopProfile(updatedProfile as any);
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

          {/* New Phone Number Input */}
          <Text style={styles.label}>Nomor Telepon</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Contoh: 081234567890"
            keyboardType="phone-pad"
          />

          {/* New Address Input */}
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

        {/* Printer Settings Button */}
        <TouchableOpacity
          style={styles.printerButton}
          onPress={() => navigation.navigate('PrinterSettings')}
        >
          <Text style={styles.printerButtonIcon}>🖨️</Text>
          <View style={styles.printerButtonTextContainer}>
            <Text style={styles.printerButtonTitle}>Settings Printer Bluetooth</Text>
            <Text style={styles.printerButtonSubtitle}>Connect ke printer thermal 58mm</Text>
          </View>
          <Text style={styles.printerButtonArrow}>›</Text>
        </TouchableOpacity>

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
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10, // Adjusted padding for better vertical spacing
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
    paddingTop: 12, // Adjust padding for multiline inputs
  },
  saveButton: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8, // Added some margin top
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  printerButton: {
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  printerButtonIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  printerButtonTextContainer: {
    flex: 1,
  },
  printerButtonTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "bold",
  },
  printerButtonSubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginTop: 2,
  },
  printerButtonArrow: {
    color: "#9CA3AF",
    fontSize: 24,
    fontWeight: "300",
  },
  info: {
    marginTop: 16,
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
    textAlign: "center",
  },
});