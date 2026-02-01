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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { addDigitalTransaction, getRecentNumbers, DigitalTransaction } from "../database/pulsa";
import { 
  getDigitalProducts, 
  DigitalProductMaster, 
  getDigitalCategories, 
  DigitalCategory,
  getDistinctProvidersByCategory
} from "../database/digital_products";
import { useNavigation } from "@react-navigation/native";

export default function PulsaTransactionScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<DigitalCategory[]>([]);
  const [category, setCategory] = useState<string>("PULSA");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<{phone_number: string, customer_name: string}[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [templates, setTemplates] = useState<DigitalProductMaster[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);

  useEffect(() => {
    loadCategories();
    loadHistory();
  }, []);

  useEffect(() => {
    if (category) {
      loadProviders();
    }
  }, [category]);

  const loadCategories = async () => {
    const data = await getDigitalCategories();
    setCategories(data);
    if (data.length > 0 && !category) {
      setCategory(data[0].name);
    }
  };

  const loadProviders = async () => {
    const data = await getDistinctProvidersByCategory(category);
    setProviders(data.map(d => d.provider));
  };

  useEffect(() => {
    if (category && provider) {
      loadTemplates();
    } else {
      setTemplates([]);
    }
  }, [category, provider]);

  const loadHistory = async () => {
    const data = await getRecentNumbers();
    setHistory(data);
  };

  const loadTemplates = async () => {
    const data = await getDigitalProducts(category, provider);
    setTemplates(data);
  };

  const selectTemplate = (item: DigitalProductMaster) => {
    setAmount(item.nominal.toString());
    setCostPrice(item.cost_price.toString());
    setSellingPrice(item.selling_price.toString());
  };

  const handleTransaction = async () => {
    if (!phoneNumber || (providers.length > 0 && !provider) || !amount || !sellingPrice) {
      Alert.alert("Error", "Mohon lengkapi data");
      return;
    }

    const costValue = parseFloat(costPrice) || 0;
    const sellValue = parseFloat(sellingPrice) || 0;
    const profitValue = sellValue - costValue;

    try {
      await addDigitalTransaction({
        category,
        phone_number: phoneNumber,
        customer_name: customerName,
        provider: provider || category,
        amount: parseFloat(amount),
        cost_price: costValue,
        selling_price: sellValue,
        profit: profitValue,
        notes,
      });

      Alert.alert("Sukses", `Transaksi ${category} Berhasil Dicatat`, [
        { text: "OK", onPress: () => {
          resetForm();
          loadHistory();
        }}
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal mencatat transaksi");
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setCustomerName("");
    setProvider("");
    setAmount("");
    setCostPrice("");
    setSellingPrice("");
    setNotes("");
  };

  const selectFromHistory = (item: {phone_number: string, customer_name: string}) => {
    setPhoneNumber(item.phone_number);
    setCustomerName(item.customer_name || "");
    setShowHistoryModal(false);
  };

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
        <View style={styles.headerRow}>
          <Text style={styles.header}>✨ Transaksi Digital</Text>
          <TouchableOpacity 
            style={styles.historyNavBtn} 
            onPress={() => navigation.navigate("DigitalHistory")}
          >
            <Text style={styles.historyNavBtnText}>📜 Riwayat</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Tab */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryCard, category === cat.name && styles.activeCategoryCard]}
              onPress={() => {
                setCategory(cat.name);
                setProvider("");
                setTemplates([]);
              }}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, category === cat.name && styles.activeCategoryLabel]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>No. Pelanggan / HP / ID</Text>
              <TextInput
                style={styles.input}
                placeholder="0812xxx atau ID Pelanggan"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.historyBtn} onPress={() => setShowHistoryModal(true)}>
              <Text style={{ color: "#FFF" }}>🕒</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nama Pelanggan (Opsional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Budi Santoso"
            value={customerName}
            onChangeText={setCustomerName}
          />

          <Text style={styles.label}>Provider / Bank / Game</Text>
          <TouchableOpacity 
            style={styles.dropdownTrigger} 
            onPress={() => setShowProviderModal(true)}
          >
            <Text style={[styles.dropdownValue, !provider && styles.dropdownPlaceholder]}>
              {provider || "Pilih Provider / Operator"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>

          {provider === "Lainnya" && (
            <TextInput
              style={styles.input}
              placeholder="Masukkan Nama Provider/Bank Manual"
              onChangeText={setProvider}
            />
          )}

          {/* Product Templates from Master */}
          {templates.length > 0 && (
            <View style={styles.templateSection}>
              <Text style={styles.label}>Pilih Produk (Master)</Text>
              <View style={styles.templateGrid}>
                {templates.map((t) => (
                  <TouchableOpacity 
                    key={t.id} 
                    style={[styles.templatePill, amount === t.nominal.toString() && styles.templatePillActive]} 
                    onPress={() => selectTemplate(t)}
                  >
                    <Text style={[styles.templateText, amount === t.nominal.toString() && styles.templateTextActive]}>
                      {t.name}
                    </Text>
                    <Text style={[styles.templatePrice, amount === t.nominal.toString() && styles.templateTextActive]}>
                      Rp {t.selling_price.toLocaleString("id-ID")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.label}>Nominal Transaksi</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 50000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
          
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Harga Modal</Text>
              <TextInput
                style={styles.input}
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Harga Jual</Text>
              <TextInput
                style={styles.input}
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          <Text style={styles.label}>Catatan / Token / Ref (Opsional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Masukkan kode token atau catatan lainnya"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <TouchableOpacity style={styles.buyBtn} onPress={handleTransaction}>
            <Text style={styles.buyBtnText}>Proses {category}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Provider Modal */}
      <Modal visible={showProviderModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "70%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Provider {category}</Text>
              <TouchableOpacity onPress={() => setShowProviderModal(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={providers}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.selectListItem, provider === item && styles.activeListItem]} 
                  onPress={() => {
                    setProvider(item);
                    setShowProviderModal(false);
                  }}
                >
                  <Text style={[styles.selectListItemText, provider === item && styles.activeListItemText]}>{item}</Text>
                  {provider === item && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Tidak ada daftar provider untuk kategori ini</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Riwayat Terakhir</Text>
            <FlatList
              data={history}
              keyExtractor={(item, index) => `${item.phone_number}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.historyItem} 
                  onPress={() => selectFromHistory(item)}
                >
                  <Text style={styles.historyItemText}>{item.phone_number}</Text>
                  {item.customer_name && <Text style={styles.historyItemSub}>{item.customer_name}</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowHistoryModal(false)}>
              <Text style={{ color: "#FFF", fontWeight: "bold" }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  header: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  historyNavBtn: { backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#BFDBFE" },
  historyNavBtnText: { color: "#1D4ED8", fontWeight: "600" },
  
  categoryScroll: { marginBottom: 20 },
  categoryCard: { backgroundColor: "#FFF", padding: 12, borderRadius: 12, marginRight: 10, alignItems: 'center', minWidth: 80, borderWidth: 1, borderColor: "#E5E7EB" },
  activeCategoryCard: { backgroundColor: "#111827", borderColor: "#111827" },
  categoryIcon: { fontSize: 20, marginBottom: 4 },
  categoryLabel: { fontSize: 11, fontWeight: "bold", color: "#6B7280" },
  activeCategoryLabel: { color: "#FFF" },

  card: { backgroundColor: "#FFF", padding: 20, borderRadius: 16, elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 0 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, marginBottom: 12, fontSize: 15 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6, color: "#4B5563" },
  providerScroll: { marginBottom: 16 },
  providerPill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#F3F4F6", borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#E5E7EB" },
  activePill: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  pillText: { color: "#4B5563", fontWeight: "600" },
  activePillText: { color: "#FFF" },
  historyBtn: { backgroundColor: "#111827", padding: 12, borderRadius: 12, marginLeft: 8, marginBottom: 12, height: 50, justifyContent: "center", alignItems: 'center', width: 50 },
  buyBtn: { backgroundColor: "#111827", padding: 18, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buyBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  
  templateSection: { marginBottom: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 16 },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  templatePill: { width: '31%', padding: 10, backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  templatePillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  templateText: { fontSize: 12, fontWeight: 'bold', color: '#111827' },
  templatePrice: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  templateTextActive: { color: '#FFF' },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#FFF", borderRadius: 24, padding: 20, maxHeight: "80%", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: "800", color: '#111827' },
  closeText: { fontSize: 20, color: '#9CA3AF', padding: 4 },
  
  dropdownTrigger: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: "#F9FAFB", 
    borderWidth: 1, 
    borderColor: "#E5E7EB", 
    borderRadius: 12, 
    padding: 14, 
    marginBottom: 16 
  },
  dropdownValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  dropdownPlaceholder: { color: '#9CA3AF', fontWeight: '400' },
  dropdownArrow: { fontSize: 12, color: '#6B7280' },

  selectListItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 4 
  },
  activeListItem: { backgroundColor: '#EFF6FF' },
  selectListItemText: { fontSize: 16, color: '#374151', fontWeight: '500' },
  activeListItemText: { color: '#1D4ED8', fontWeight: '700' },
  checkIcon: { color: '#1D4ED8', fontWeight: 'bold', fontSize: 18 },

  historyItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  historyItemText: { fontSize: 16, color: "#111827", fontWeight: 'bold' },
  historyItemSub: { fontSize: 13, color: "#6B7280" },
  emptyText: { textAlign: "center", color: "#9CA3AF", marginTop: 20, fontStyle: 'italic' },
  closeBtn: { backgroundColor: "#EF4444", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 16 }
});
