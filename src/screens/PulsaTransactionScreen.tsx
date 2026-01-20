import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import { addPhoneHistory, getDistinctPhoneNumbers } from "../database/pulsa";
import { addSale } from "../database/sales";

export default function PulsaTransactionScreen() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [amount, setAmount] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [history, setHistory] = useState<{phone_number: string}[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getDistinctPhoneNumbers();
    setHistory(data);
  };

  const providers = ["Telkomsel", "Indosat", "XL", "Axis", "Tri", "Smartfren"];

  const handleTransaction = async () => {
    if (!phoneNumber || !provider || !amount || !sellingPrice) {
      Alert.alert("Error", "Mohon lengkapi data");
      return;
    }

    const costValue = parseFloat(costPrice) || 0;
    const sellValue = parseFloat(sellingPrice) || 0;
    const profitValue = sellValue - costValue;

    try {
      // 1. Record Phone History
      await addPhoneHistory({
        phone_number: phoneNumber,
        provider,
        amount: parseFloat(amount),
        cost_price: costValue,
        selling_price: sellValue,
        profit: profitValue,
      });

      // 2. Record Sale (for general reporting)
      // Since pulsa doesn't have a product ID in standard way, we can use a dummy or skip
      // For now, let's just record phone history for specific pulsa reporting.
      
      Alert.alert("Sukses", "Transaksi Pulsa Berhasil Dicatat");
      resetForm();
      loadHistory();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal mencatat transaksi");
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setProvider("");
    setAmount("");
    setCostPrice("");
    setSellingPrice("");
  };

  const selectFromHistory = (num: string) => {
    setPhoneNumber(num);
    setShowHistoryModal(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📱 Transaksi Pulsa</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Nomor HP"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistoryModal(true)}>
            <Text style={{ color: "#FFF" }}>Riwayat</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Provider</Text>
        <ScrollView horizontal style={styles.providerScroll} showsHorizontalScrollIndicator={false}>
          {providers.map((p) => (
            <TouchableOpacity 
              key={p} 
              style={[styles.providerPill, provider === p && styles.activePill]}
              onPress={() => setProvider(p)}
            >
              <Text style={[styles.pillText, provider === p && styles.activePillText]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder="Nominal (Contoh: 5000)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="Harga Modal"
            value={costPrice}
            onChangeText={setCostPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Harga Jual"
            value={sellingPrice}
            onChangeText={setSellingPrice}
            keyboardType="numeric"
          />
        </View>

        <TouchableOpacity style={styles.buyBtn} onPress={handleTransaction}>
          <Text style={styles.buyBtnText}>Proses Transaksi</Text>
        </TouchableOpacity>
      </View>

      {/* History Modal */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nomor Terakhir</Text>
            <FlatList
              data={history}
              keyExtractor={(item) => item.phone_number}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.historyItem} 
                  onPress={() => selectFromHistory(item.phone_number)}
                >
                  <Text style={styles.historyItemText}>{item.phone_number}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowHistoryModal(false)}>
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

import { ScrollView } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, elevation: 4 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: "#374151" },
  providerScroll: { marginBottom: 16 },
  providerPill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#E5E7EB", borderRadius: 20, marginRight: 8 },
  activePill: { backgroundColor: "#3B82F6" },
  pillText: { color: "#4B5563", fontWeight: "600" },
  activePillText: { color: "#FFF" },
  historyBtn: { backgroundColor: "#111827", padding: 12, borderRadius: 12, marginLeft: 8, height: 50, justifyContent: "center" },
  buyBtn: { backgroundColor: "#111827", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buyBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFF", borderRadius: 20, padding: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  historyItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  historyItemText: { fontSize: 16, color: "#111827" },
  closeBtn: { backgroundColor: "#EF4444", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 16 }
});
