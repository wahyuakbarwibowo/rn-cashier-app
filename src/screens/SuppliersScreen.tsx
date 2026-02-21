import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "../database/suppliers";
import { Supplier } from "../types/supplier";

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSuppliers = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSuppliers();
    }, [loadSuppliers])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSuppliers(true);
  }, [loadSuppliers]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Nama supplier wajib diisi");
      return;
    }

    try {
      if (editId) {
        await updateSupplier(editId, { name, phone, address });
        Alert.alert("Sukses", "Supplier berhasil diperbarui");
      } else {
        await addSupplier({ name, phone, address });
        Alert.alert("Sukses", "Supplier berhasil ditambahkan");
      }
      resetForm();
      loadSuppliers();
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

  const handleEdit = (item: Supplier) => {
    setEditId(item.id!);
    setName(item.name);
    setPhone(item.phone || "");
    setAddress(item.address || "");
  };

  const handleDelete = (id: number) => {
    Alert.alert("Hapus", "Yakin ingin menghapus supplier ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          await deleteSupplier(id);
          loadSuppliers();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.header}>🏭 Master Supplier</Text>

        <View style={styles.card}>
          <TextInput
            style={styles.input}
            placeholder="Nama Supplier"
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
            data={suppliers}
            keyExtractor={(item) => item.id!.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#E11D48']}
              />
            }
            renderItem={({ item }) => (
              <View style={styles.supplierItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.supplierName}>{item.name}</Text>
                  <Text style={styles.supplierPhone}>{item.phone || "-"}</Text>
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
            ListEmptyComponent={<Text style={styles.emptyText}>Belum ada data supplier</Text>}
          />
        )}
      </View>
    </KeyboardAvoidingView>
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
  supplierItem: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  supplierName: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  supplierPhone: { fontSize: 14, color: "#6B7280" },
  actions: { flexDirection: "row" },
  actionBtn: { padding: 8, marginLeft: 8 },
  emptyText: { textAlign: "center", marginTop: 20, color: "#6B7280" },
});
