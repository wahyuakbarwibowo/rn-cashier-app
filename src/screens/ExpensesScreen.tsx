import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getExpenses, addExpense, deleteExpense, Expense } from "../database/expenses";

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const loadExpenses = async () => {
    const data = await getExpenses();
    setExpenses(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const handleAddExpense = async () => {
    if (!category || !amount) {
      Alert.alert("Error", "Kategori dan jumlah wajib diisi");
      return;
    }

    try {
      await addExpense({
        category,
        amount: parseFloat(amount),
        notes,
      });
      setModalVisible(false);
      setCategory("");
      setAmount("");
      setNotes("");
      loadExpenses();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal menyimpan pengeluaran");
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert("Hapus", "Yakin ingin menghapus pengeluaran ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteExpense(id);
          loadExpenses();
        },
      },
    ]);
  };

  const categories = ["Listrik", "Makan", "Transport", "Sewa", "Gaji", "Lainnya"];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>💸 Pengeluaran</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Input Baru</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.category}>{item.category}</Text>
                <Text style={styles.date}>
                  {new Date(item.created_at!).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </Text>
                {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              </View>
              <View style={styles.amountContainer}>
                <Text style={styles.amount}>
                  Rp {item.amount.toLocaleString("id-ID")}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id!)}>
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Belum ada catatan pengeluaran</Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: '100%' }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Catat Pengeluaran Baru</Text>

              <Text style={styles.label}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.catPill,
                      category === cat && styles.activeCatPill,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.catPillText,
                        category === cat && styles.activeCatPillText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                placeholder="Atau ketik kategori baru..."
                value={category}
                onChangeText={setCategory}
                style={styles.input}
              />

              <Text style={styles.label}>Jumlah (Rp)</Text>
              <TextInput
                placeholder="0"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}
              />

              <Text style={styles.label}>Catatan (Opsional)</Text>
              <TextInput
                placeholder="Misal: Bayar listrik Januari"
                value={notes}
                onChangeText={setNotes}
                style={styles.input}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleAddExpense}
                >
                  <Text style={styles.saveBtnText}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  addBtn: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: { color: "#FFF", fontWeight: "bold" },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  category: { fontSize: 16, fontWeight: "bold", color: "#374151" },
  date: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  notes: { fontSize: 13, color: "#9CA3AF", marginTop: 4, fontStyle: "italic" },
  amountContainer: { alignItems: "flex-end", gap: 8 },
  amount: { fontSize: 16, fontWeight: "bold", color: "#EF4444" },
  deleteIcon: { fontSize: 18 },
  empty: { textAlign: "center", marginTop: 40, color: "#9CA3AF" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },
  label: { fontSize: 14, fontWeight: "bold", color: "#374151", marginBottom: 8 },
  input: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
    fontSize: 15,
  },
  catScroll: { marginBottom: 12 },
  catPill: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeCatPill: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  catPillText: { color: "#4B5563", fontWeight: "500" },
  activeCatPillText: { color: "#FFF" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  cancelBtnText: { color: "#4B5563", fontWeight: "bold" },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#EF4444",
  },
  saveBtnText: { color: "#FFF", fontWeight: "bold" },
});
