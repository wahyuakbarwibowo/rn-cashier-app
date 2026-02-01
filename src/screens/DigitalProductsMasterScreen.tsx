import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { 
  getDigitalProducts, 
  addDigitalProduct, 
  updateDigitalProduct, 
  deleteDigitalProduct,
  DigitalProductMaster 
} from "../database/digital_products";

const CATEGORIES = ["PULSA", "PLN", "PDAM", "TRANSFER", "BPJS", "E-WALLET", "GAME"];

export default function DigitalProductsMasterScreen() {
  const [products, setProducts] = useState<DigitalProductMaster[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProductMaster | null>(null);

  // Form State
  const [category, setCategory] = useState("PULSA");
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [nominal, setNominal] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getDigitalProducts();
    setProducts(data);
  };

  const handleSave = async () => {
    if (!provider || !name || !nominal || !sellingPrice) {
      Alert.alert("Error", "Mohon lengkapi data");
      return;
    }

    const payload = {
      category,
      provider,
      name,
      nominal: parseFloat(nominal),
      cost_price: parseFloat(costPrice) || 0,
      selling_price: parseFloat(sellingPrice),
    };

    try {
      if (editingProduct) {
        await updateDigitalProduct(editingProduct.id!, payload);
      } else {
        await addDigitalProduct(payload);
      }
      setModalVisible(false);
      resetForm();
      loadProducts();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal menyimpan data");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setCategory("PULSA");
    setProvider("");
    setName("");
    setNominal("");
    setCostPrice("");
    setSellingPrice("");
  };

  const openEdit = (product: DigitalProductMaster) => {
    setEditingProduct(product);
    setCategory(product.category);
    setProvider(product.provider);
    setName(product.name);
    setNominal(product.nominal.toString());
    setCostPrice(product.cost_price.toString());
    setSellingPrice(product.selling_price.toString());
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Hapus", "Yakin ingin menghapus produk ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          await deleteDigitalProduct(id);
          loadProducts();
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 Master Produk Digital</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>+ Tambah</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
              <Text style={styles.providerLabel}>{item.provider}</Text>
            </View>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Modal</Text>
                <Text style={styles.priceValue}>Rp {item.cost_price.toLocaleString("id-ID")}</Text>
              </View>
              <View>
                <Text style={styles.priceLabel}>Jual</Text>
                <Text style={[styles.priceValue, { color: '#1D4ED8' }]}>Rp {item.selling_price.toLocaleString("id-ID")}</Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id!)} style={styles.iconBtn}>
                  <Text>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Belum ada master produk</Text>}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingProduct ? "Edit Produk" : "Tambah Produk"}</Text>
            <ScrollView>
              <Text style={styles.inputLabel}>Kategori</Text>
              <View style={styles.pickerRow}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity 
                    key={cat} 
                    onPress={() => setCategory(cat)}
                    style={[styles.pickerPill, category === cat && styles.pickerPillActive]}
                  >
                    <Text style={[styles.pickerText, category === cat && styles.pickerTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Provider (Misal: Telkomsel, Token PLN)</Text>
              <TextInput style={styles.input} value={provider} onChangeText={setProvider} placeholder="Masukkan provider" />

              <Text style={styles.inputLabel}>Nama Produk (Misal: Pulsa 10rb)</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Masukkan nama produk" />

              <View style={styles.formRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Nominal</Text>
                  <TextInput style={styles.input} value={nominal} onChangeText={setNominal} keyboardType="numeric" placeholder="0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Harga Modal</Text>
                  <TextInput style={styles.input} value={costPrice} onChangeText={setCostPrice} keyboardType="numeric" placeholder="0" />
                </View>
              </View>

              <Text style={styles.inputLabel}>Harga Jual Otomatis</Text>
              <TextInput style={styles.input} value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" placeholder="0" />

              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                  <Text style={{ fontWeight: 'bold' }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badge: { backgroundColor: '#E5E7EB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#4B5563' },
  providerLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceLabel: { fontSize: 11, color: '#9CA3AF' },
  priceValue: { fontSize: 14, fontWeight: 'bold', color: '#4B5563' },
  actions: { flexDirection: 'row' },
  iconBtn: { marginLeft: 12, padding: 4 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 50 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#4B5563', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap' },
  pickerPill: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 15, marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  pickerPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  pickerText: { fontSize: 11, color: '#4B5563', fontWeight: '600' },
  pickerTextActive: { color: '#FFF' },
  formRow: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', marginTop: 24, gap: 12 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F3F4F6' },
  saveBtn: { backgroundColor: '#111827' },
});
