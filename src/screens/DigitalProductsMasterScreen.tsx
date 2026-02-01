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
  DigitalProductMaster,
  getDigitalCategories,
  addDigitalCategory,
  updateDigitalCategory,
  deleteDigitalCategory,
  DigitalCategory
} from "../database/digital_products";

export default function DigitalProductsMasterScreen() {
  const [products, setProducts] = useState<DigitalProductMaster[]>([]);
  const [categories, setCategories] = useState<DigitalCategory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProductMaster | null>(null);
  const [editingCat, setEditingCat] = useState<DigitalCategory | null>(null);

  // Form State
  const [category, setCategory] = useState("PULSA");
  const [provider, setProvider] = useState("");
  const [name, setName] = useState("");
  const [nominal, setNominal] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");

  // New Category State
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("✨");

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    const data = await getDigitalProducts();
    setProducts(data);
  };

  const loadCategories = async () => {
    const data = await getDigitalCategories();
    setCategories(data);
    if (data.length > 0 && !category) {
      setCategory(data[0].name);
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      if (editingCat) {
        await updateDigitalCategory(editingCat.id, newCatName, newCatIcon);
      } else {
        await addDigitalCategory(newCatName, newCatIcon);
      }
      setNewCatName("");
      setNewCatIcon("✨");
      setEditingCat(null);
      loadCategories();
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan kategori");
    }
  };

  const openEditCategory = (cat: DigitalCategory) => {
    setEditingCat(cat);
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
  };

  const handleDeleteCategory = async (id: number) => {
    Alert.alert("Hapus", "Hapus kategori ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        await deleteDigitalCategory(id);
        loadCategories();
      }}
    ]);
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
        <Text style={[styles.title, { marginRight: 10 }]}>📦 Produk Digital</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: '#3B82F6', marginRight: 8 }]} 
            onPress={() => {
              setEditingCat(null);
              setNewCatName("");
              setNewCatIcon("✨");
              setCatModalVisible(true);
            }}
          >
            <Text style={styles.addBtnText}>📁 Kategori</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
            <Text style={styles.addBtnText}>+ Produk</Text>
          </TouchableOpacity>
        </View>
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
                  {categories.map(cat => (
                    <TouchableOpacity 
                      key={cat.id} 
                      onPress={() => setCategory(cat.name)}
                      style={[styles.pickerPill, category === cat.name && styles.pickerPillActive]}
                    >
                      <Text style={[styles.pickerText, category === cat.name && styles.pickerTextActive]}>{cat.icon} {cat.name}</Text>
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
                  <Text style={{ color: '#111827', fontWeight: 'bold' }}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Simpan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Management Modal */}
      <Modal visible={catModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manajemen Kategori</Text>
            
            <View style={styles.addCatForm}>
              <View style={{ flex: 1 }}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Nama Kategori" 
                  value={newCatName} 
                  onChangeText={setNewCatName} 
                />
              </View>
              <TextInput 
                style={[styles.input, { width: 45, marginLeft: 5 }]} 
                placeholder="Icon" 
                value={newCatIcon} 
                onChangeText={setNewCatIcon} 
              />
              <TouchableOpacity style={styles.miniAddBtn} onPress={handleAddCategory}>
                <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
                  {editingCat ? "Update" : "Tambah"}
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              style={{ maxHeight: 300, marginTop: 10 }}
              renderItem={({ item }) => (
                <View style={styles.catItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={{ fontSize: 18, marginRight: 10 }}>{item.icon}</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{item.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => openEditCategory(item)} style={{ padding: 8 }}>
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteCategory(item.id)} style={{ padding: 8 }}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />

            <TouchableOpacity 
              style={{ 
                backgroundColor: '#111827', 
                padding: 16, 
                borderRadius: 12, 
                alignItems: 'center', 
                marginTop: 20 
              }} 
              onPress={() => setCatModalVisible(false)}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Tutup</Text>
            </TouchableOpacity>
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
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  headerBtns: { flexDirection: 'row' },
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
  
  addCatForm: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  miniAddBtn: { backgroundColor: '#10B981', height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15 },
  catItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
});
