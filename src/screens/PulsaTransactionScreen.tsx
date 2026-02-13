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
import { addDigitalTransaction, updateDigitalTransaction, getRecentNumbers, DigitalTransaction } from "../database/pulsa";
import {
  getDigitalProducts,
  DigitalProductMaster,
  getDigitalCategories,
  DigitalCategory,
  getDistinctProvidersByCategory
} from "../database/digital_products";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function PulsaTransactionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [editTrxId, setEditTrxId] = useState<number | null>(null);
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
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<{ phone_number: string, customer_name: string }[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [templates, setTemplates] = useState<DigitalProductMaster[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);

  useEffect(() => {
    loadCategories();
    loadHistory();

    if (route.params?.editTrx) {
      const etrx = route.params.editTrx;
      setEditTrxId(etrx.id);
      setCategory(etrx.category);
      setPhoneNumber(etrx.phone_number);
      setCustomerName(etrx.customer_name || "");
      setProvider(etrx.provider);
      setAmount(etrx.amount.toString());
      setCostPrice(etrx.cost_price.toString());
      setSellingPrice(etrx.selling_price.toString());
      setNotes(etrx.notes || "");
      if (etrx.created_at) {
        setTransactionDate(etrx.created_at.split(' ')[0] || etrx.created_at.split('T')[0]);
      }
    }
  }, [route.params?.editTrx]);

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
    setProviders(data.map((d: any) => d.provider));
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
      if (editTrxId) {
        await updateDigitalTransaction(editTrxId, {
          category,
          phone_number: phoneNumber,
          customer_name: customerName,
          provider,
          amount: parseFloat(amount),
          cost_price: costValue,
          selling_price: sellValue,
          profit: profitValue,
          notes,
          created_at: transactionDate + " " + new Date().toLocaleTimeString('en-GB')
        });
        Alert.alert("Sukses", "Transaksi berhasil diperbarui");
      } else {
        await addDigitalTransaction({
          category,
          phone_number: phoneNumber,
          customer_name: customerName,
          provider: provider,
          amount: parseFloat(amount),
          cost_price: costValue,
          selling_price: sellValue,
          profit: profitValue,
          notes: notes,
          created_at: transactionDate + " " + new Date().toLocaleTimeString('en-GB')
        });
        Alert.alert("Sukses", "Transaksi berhasil disimpan");
      }

      if (!editTrxId) {
        setPhoneNumber("");
        setCustomerName("");
        setAmount("");
        setCostPrice("");
        setSellingPrice("");
        setNotes("");
      } else {
        navigation.goBack();
      }
      loadHistory();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal menyimpan transaksi");
    }
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

          <Text style={styles.label}>Tanggal Transaksi</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={transactionDate}
            onChangeText={setTransactionDate}
          />

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

          <Text style={styles.label}>Nominal / Item</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: 10000"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Harga Modal</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Harga Jual</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Catatan (Opsional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contoh: Token Listrik"
            value={notes}
            onChangeText={setNotes}
          />

          <TouchableOpacity style={styles.btn} onPress={handleTransaction}>
            <Text style={styles.btnText}>{editTrxId ? "Update Transaksi" : "Proses Transaksi"}</Text>
          </TouchableOpacity>

          {editTrxId && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: "#6B7280", marginTop: 10 }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>Batal</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Provider List Modal */}
      <Modal visible={showProviderModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Provider / Operator</Text>
            <FlatList
              data={[...providers, "Lainnya"]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.providerItem}
                  onPress={() => {
                    setProvider(item);
                    setShowProviderModal(false);
                  }}
                >
                  <Text style={styles.providerText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowProviderModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* History Modal */}
      <Modal visible={showHistoryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nomor Terakhir</Text>
            <FlatList
              data={history}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.providerItem}
                  onPress={() => {
                    setPhoneNumber(item.phone_number);
                    if (item.customer_name) setCustomerName(item.customer_name);
                    setShowHistoryModal(false);
                  }}
                >
                  <Text style={styles.providerText}>{item.phone_number}</Text>
                  {item.customer_name && <Text style={{ color: "#6B7280", fontSize: 12 }}>{item.customer_name}</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ textAlign: "center", color: "#9CA3AF" }}>Belum ada riwayat nomor</Text>}
            />
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowHistoryModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 },
  header: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  historyNavBtn: { backgroundColor: "#FFF", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  historyNavBtnText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  categoryScroll: { paddingHorizontal: 20, marginBottom: 16 },
  categoryCard: { backgroundColor: "#FFF", padding: 12, borderRadius: 16, marginRight: 12, alignItems: "center", minWidth: 80, borderWidth: 1, borderColor: "#E5E7EB" },
  activeCategoryCard: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryLabel: { fontSize: 12, fontWeight: "bold", color: "#374151" },
  activeCategoryLabel: { color: "#FFF" },
  card: { backgroundColor: "#FFF", margin: 20, marginTop: 0, padding: 20, borderRadius: 20, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  label: { fontSize: 13, fontWeight: "bold", color: "#374151", marginBottom: 8 },
  input: { backgroundColor: "#F9FAFB", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 16, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "flex-end" },
  historyBtn: { backgroundColor: "#3B82F6", width: 50, height: 50, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 16, marginLeft: 8 },
  btn: { backgroundColor: "#111827", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16, color: "#111827" },
  providerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  providerText: { fontSize: 16, color: "#374151" },
  closeModalBtn: { marginTop: 16, paddingVertical: 14, alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 12 },
  closeModalBtnText: { color: "#4B5563", fontWeight: "bold" },
  dropdownTrigger: { backgroundColor: "#F9FAFB", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dropdownValue: { fontSize: 15, color: "#111827" },
  dropdownPlaceholder: { color: "#9CA3AF" },
  dropdownArrow: { color: "#9CA3AF", fontSize: 12 },
  templateSection: { marginBottom: 16 },
  templateGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  templatePill: { backgroundColor: "#EFF6FF", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#BFDBFE", minWidth: "30%" },
  templatePillActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  templateText: { fontSize: 13, fontWeight: "bold", color: "#1D4ED8" },
  templatePrice: { fontSize: 11, color: "#1D4ED8", marginTop: 2 },
  templateTextActive: { color: "#FFF" },
});
