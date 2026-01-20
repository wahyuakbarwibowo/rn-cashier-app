import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { getCustomers, addCustomer, updateCustomer, deleteCustomer } from "../database/customers";
import { Customer } from "../types/database";

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Nama pelanggan wajib diisi");
      return;
    }

    try {
      if (editId) {
        await updateCustomer(editId, { name, phone, address });
        Alert.alert("Sukses", "Pelanggan berhasil diperbarui");
      } else {
        await addCustomer({ name, phone, address });
        Alert.alert("Sukses", "Pelanggan berhasil ditambahkan");
      }
      resetForm();
      loadCustomers();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal menyimpan data");
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setAddress("");
    setEditId(null);
  };

  const handleEdit = (item: Customer) => {
    setEditId(item.id!);
    setName(item.name);
    setPhone(item.phone || "");
    setAddress(item.address || "");
  };

  const handleDelete = (id: number) => {
    Alert.alert("Hapus", "Yakin ingin menghapus pelanggan ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteCustomer(id);
          loadCustomers();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>👥 Atur Pelanggan</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Nama Pelanggan"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Nomor Telepon"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Alamat (Opsional)"
          value={address}
          onChangeText={setAddress}
        />
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
            <Text style={styles.btnText}>{editId ? "Update" : "Simpan"}</Text>
          </TouchableOpacity>
          {editId && (
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={resetForm}>
              <Text style={styles.btnText}>Batal</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id!.toString()}
          renderItem={({ item }) => (
            <View style={styles.customerItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerPhone}>{item.phone || "-"}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionBtn}>
                  <Text style={{ color: "#3B82F6" }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id!)} style={styles.actionBtn}>
                  <Text style={{ color: "#EF4444" }}>Hapus</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#111827" },
  card: { backgroundColor: "#FFF", padding: 16, borderRadius: 16, elevation: 4, marginBottom: 20 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, marginBottom: 12 },
  row: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  saveBtn: { backgroundColor: "#111827" },
  cancelBtn: { backgroundColor: "#6B7280" },
  btnText: { color: "#FFF", fontWeight: "bold" },
  customerItem: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  customerName: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  customerPhone: { fontSize: 14, color: "#6B7280" },
  actions: { flexDirection: "row" },
  actionBtn: { padding: 8, marginLeft: 8 },
});
