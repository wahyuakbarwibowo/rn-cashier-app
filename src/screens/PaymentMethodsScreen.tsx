import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { getPaymentMethods, addPaymentMethod, deletePaymentMethod } from "../database/payment_methods";
import { PaymentMethod } from "../types/database";

export default function PaymentMethodsScreen() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    const data = await getPaymentMethods();
    setMethods(data);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addPaymentMethod(newName);
    setNewName("");
    loadMethods();
  };

  const handleDelete = (id: number) => {
    Alert.alert("Hapus", "Hapus cara bayar ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive", onPress: async () => {
          await deletePaymentMethod(id);
          loadMethods();
        }
      }
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.header}>💳 Atur Cara Bayar</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Cara Bayar Baru..."
            value={newName}
            onChangeText={setNewName}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Text style={styles.addBtnText}>Tambah</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={methods}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleDelete(item.id!)}>
                <Text style={{ color: "#EF4444" }}>Hapus</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  inputRow: { flexDirection: "row", marginBottom: 20, gap: 8 },
  input: { flex: 1, backgroundColor: "#FFF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E7EB" },
  addBtn: { backgroundColor: "#111827", paddingHorizontal: 20, justifyContent: "center", borderRadius: 12 },
  addBtnText: { color: "#FFF", fontWeight: "bold" },
  item: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemText: { fontSize: 16, fontWeight: "600" },
});
