import React, { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
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
  const [nominal, setNominal] = useState("0");
  const [costPrice, setCostPrice] = useState("0");
  const [sellingPrice, setSellingPrice] = useState("0");

  // New Category State
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("✨");

  // Loading States
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingSaveCat, setLoadingSaveCat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string | null>(null); // null = all
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const PAGE_SIZE = 20;

  const loadProductsAsync = useCallback(async (page: number = 0) => {
    try {
      const isInitialLoad = page === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const offset = page * PAGE_SIZE;
      const data = await getDigitalProducts(selectedFilterCategory || undefined, undefined, PAGE_SIZE, offset);

      if (isInitialLoad) {
        setProducts(data);
        setCurrentPage(0);
      } else {
        setProducts(prev => [...prev, ...data]);
        setCurrentPage(page);
      }

      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProductsAsync(0);
      loadCategories();
    }, [loadProductsAsync, selectedFilterCategory])
  );

  const loadCategories = useCallback(async () => {
    const data = await getDigitalCategories();
    setCategories(data);
    if (data.length > 0 && !category) {
      setCategory(data[0].name);
    }
  }, [category]);

  const handleEndReached = () => {
    if (!loadingMore && !loading && hasMore) {
      loadProductsAsync(currentPage + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProductsAsync(0);
  };

  const handleAddCategory = async () => {
    if (!newCatName) return;
    setLoadingSaveCat(true);
    try {
      if (editingCat) {
        await updateDigitalCategory(editingCat.id, newCatName, newCatIcon);
      } else {
        await addDigitalCategory(newCatName, newCatIcon);
      }
      setNewCatName("");
      setNewCatIcon("✨");
      setEditingCat(null);
      await loadCategories();
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan kategori");
    } finally {
      setLoadingSaveCat(false);
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
      {
        text: "Hapus", style: "destructive", onPress: async () => {
          await deleteDigitalCategory(id);
          await loadCategories();
        }
      }
    ]);
  };

  const handleSave = async () => {
    if (!provider.trim() || !name.trim() || nominal === "" || sellingPrice === "") {
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

    setLoadingSave(true);
    try {
      if (editingProduct) {
        await updateDigitalProduct(editingProduct.id!, payload);
      } else {
        await addDigitalProduct(payload);
      }
      await loadProductsAsync(0);
      resetForm();
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal menyimpan data");
    } finally {
      setLoadingSave(false);
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setCategory("PULSA");
    setProvider("");
    setName("");
    setNominal("0");
    setCostPrice("0");
    setSellingPrice("0");
  };

  const openEdit = (product: DigitalProductMaster) => {
    setEditingProduct(product);
    setCategory(product.category);
    setProvider(product.provider);
    setName(product.name);
    setNominal((product.nominal ?? 0).toString());
    setCostPrice((product.cost_price ?? 0).toString());
    setSellingPrice((product.selling_price ?? 0).toString());
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Hapus", "Yakin ingin menghapus produk ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus", style: "destructive", onPress: async () => {
          await deleteDigitalProduct(id);
          await loadProductsAsync(0);
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.filterBtn, showCategoryFilter && styles.filterBtnActive]}
          onPress={() => setShowCategoryFilter(!showCategoryFilter)}
        >
          <Text style={[styles.filterBtnText, showCategoryFilter && styles.filterBtnTextActive]}>
            📦 {selectedFilterCategory || 'All'}
          </Text>
        </TouchableOpacity>
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

      {showCategoryFilter && (
        <View style={styles.categoryFilterContainer}>
          <TouchableOpacity
            style={[styles.categoryFilterPill, selectedFilterCategory === null && styles.categoryFilterPillActive]}
            onPress={() => {
              setSelectedFilterCategory(null);
              setShowCategoryFilter(false);
              loadProductsAsync(0);
            }}
          >
            <Text style={[styles.categoryFilterText, selectedFilterCategory === null && styles.categoryFilterTextActive]}>
              All Kategori
            </Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryFilterPill, selectedFilterCategory === cat.name && styles.categoryFilterPillActive]}
              onPress={() => {
                setSelectedFilterCategory(cat.name);
                setShowCategoryFilter(false);
                loadProductsAsync(0);
              }}
            >
              <Text style={[styles.categoryFilterText, selectedFilterCategory === cat.name && styles.categoryFilterTextActive]}>
                {cat.icon} {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#111827" />
            </View>
          ) : null
        }
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
                <Text style={styles.priceValue}>Rp {(item.cost_price ?? 0).toLocaleString("id-ID")}</Text>
              </View>
              <View>
                <Text style={styles.priceLabel}>Jual</Text>
                <Text style={[styles.priceValue, { color: '#1D4ED8' }]}>Rp {(item.selling_price ?? 0).toLocaleString("id-ID")}</Text>
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingProduct ? "Edit Produk" : "Tambah Produk"}</Text>
              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
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
                  <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)} disabled={loadingSave}>
                    <Text style={{ color: '#111827', fontWeight: 'bold' }}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave} disabled={loadingSave}>
                    {loadingSave ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Simpan</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Management Modal */}
      <Modal visible={catModalVisible} animationType="fade" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Manajemen Kategori</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                scrollEnabled={true}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
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
                  <TouchableOpacity style={styles.miniAddBtn} onPress={handleAddCategory} disabled={loadingSaveCat}>
                    {loadingSaveCat ? (
                      <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 13 }}>
                        {editingCat ? "Update" : "Tambah"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id.toString()}
                  style={{ maxHeight: 300, marginTop: 10 }}
                  scrollEnabled={false}
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
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  filterBtn: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE', flex: 1, marginRight: 12 },
  filterBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterBtnText: { fontSize: 14, fontWeight: 'bold', color: '#3B82F6' },
  filterBtnTextActive: { color: '#FFF' },
  categoryFilterContainer: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, marginBottom: 16, elevation: 2, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryFilterPill: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  categoryFilterPillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  categoryFilterText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  categoryFilterTextActive: { color: '#FFF' },
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
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '85%', flex: 1 },
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
