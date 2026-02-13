import React, { useState, useEffect } from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  StyleSheet,
  Alert,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Card,
  Text,
  TextInput,
  Button,
  IconButton,
  List,
  Chip,
  TouchableRipple,
  Divider,
  Portal,
  Modal as PaperModal,
  Surface,
  Avatar,
  HelperText,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
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
  const [showDatePicker, setShowDatePicker] = useState(false);

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
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Categories Tab */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <Surface
              key={cat.id}
              elevation={category === cat.name ? 2 : 0}
              style={[styles.categoryCardPaper, category === cat.name && styles.activeCategoryCardPaper]}
            >
              <TouchableRipple
                onPress={() => {
                  setCategory(cat.name);
                  setProvider("");
                  setTemplates([]);
                }}
                style={styles.categoryRipple}
              >
                <View style={styles.categoryContent}>
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryLabel, category === cat.name && styles.activeCategoryLabel]}>
                    {cat.name}
                  </Text>
                </View>
              </TouchableRipple>
            </Surface>
          ))}
        </ScrollView>

        <Card style={styles.mainCardPaper}>
          <Card.Content>
            <View style={styles.inputRowPaper}>
              <TextInput
                label="No. Pelanggan / HP / ID"
                placeholder="0812xxx atau ID Pelanggan"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="numeric"
                mode="outlined"
                style={{ flex: 1 }}
                right={
                  <TextInput.Icon
                    icon="history"
                    onPress={() => navigation.navigate("DigitalHistory")}
                  />
                }
                left={
                  <TextInput.Icon
                    icon="text-box-search-outline"
                    onPress={() => setShowHistoryModal(true)}
                  />
                }
              />
            </View>

            <TextInput
              label="Tanggal Transaksi"
              placeholder="YYYY-MM-DD"
              value={transactionDate}
              onChangeText={setTransactionDate}
              mode="outlined"
              style={styles.fieldMargin}
              right={<TextInput.Icon
                icon="calendar"
                onPress={() => setShowDatePicker(true)}
              />}
            />

            {showDatePicker && (
              <DateTimePicker
                value={new Date(transactionDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setTransactionDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}

            <TextInput
              label="Nama Pelanggan (Opsional)"
              placeholder="Contoh: Budi Santoso"
              value={customerName}
              onChangeText={setCustomerName}
              mode="outlined"
              style={styles.fieldMargin}
            />

            <TextInput
              label="Provider / Bank / Game"
              value={provider}
              placeholder="Pilih Provider / Operator"
              mode="outlined"
              editable={false}
              style={styles.fieldMargin}
              onPressIn={() => setShowProviderModal(true)}
              right={<TextInput.Icon icon="menu-down" onPress={() => setShowProviderModal(true)} />}
            />

            {provider === "Lainnya" && (
              <TextInput
                label="Nama Provider Manual"
                placeholder="Masukkan Nama Provider/Bank Manual"
                onChangeText={setProvider}
                mode="outlined"
                style={styles.fieldMargin}
              />
            )}

            {/* Product Templates from Master */}
            {templates.length > 0 && (
              <View style={styles.templateSectionPaper}>
                <Text variant="labelLarge" style={styles.labelPaper}>Pilih Produk (Master)</Text>
                <View style={styles.templateGridPaper}>
                  {templates.map((t) => (
                    <Chip
                      key={t.id}
                      selected={amount === t.nominal.toString()}
                      onPress={() => selectTemplate(t)}
                      style={styles.templateChip}
                      showSelectedOverlay
                      mode="outlined"
                    >
                      {t.name} (Rp {t.selling_price.toLocaleString("id-ID")})
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <TextInput
              label="Nominal / Item"
              placeholder="Contoh: 10000"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.fieldMargin}
            />

            <View style={styles.row}>
              <TextInput
                label="Harga Modal"
                placeholder="0"
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.fieldMargin, { flex: 1, marginRight: 8 }]}
              />
              <TextInput
                label="Harga Jual"
                placeholder="0"
                value={sellingPrice}
                onChangeText={setSellingPrice}
                keyboardType="numeric"
                mode="outlined"
                style={[styles.fieldMargin, { flex: 1 }]}
              />
            </View>

            <TextInput
              label="Catatan (Opsional)"
              placeholder="Contoh: Token Listrik"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              style={styles.fieldMargin}
            />

            <Button
              mode="contained"
              onPress={handleTransaction}
              style={styles.mainActionBtn}
              contentStyle={{ paddingVertical: 8 }}
            >
              {editTrxId ? "Update Transaksi" : "Proses Transaksi"}
            </Button>

            {editTrxId && (
              <Button
                mode="outlined"
                onPress={() => navigation.goBack()}
                style={[styles.mainActionBtn, { marginTop: 12 }]}
                contentStyle={{ paddingVertical: 8 }}
              >
                Batal
              </Button>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Provider List Modal */}
      <Portal>
        <PaperModal
          visible={showProviderModal}
          onDismiss={() => setShowProviderModal(false)}
          contentContainerStyle={styles.modalContentPaper}
        >
          <Text variant="titleLarge" style={styles.modalTitlePaper}>Pilih Provider / Operator</Text>
          <Divider style={{ marginVertical: 12 }} />
          <FlatList
            data={[...providers, "Lainnya"]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <List.Item
                title={item}
                onPress={() => {
                  setProvider(item);
                  setShowProviderModal(false);
                }}
                right={props => item === provider ? <List.Icon {...props} icon="check" color="#6366F1" /> : null}
              />
            )}
            style={{ maxHeight: 400 }}
          />
          <Button mode="text" onPress={() => setShowProviderModal(false)} style={{ marginTop: 8 }}>
            Tutup
          </Button>
        </PaperModal>
      </Portal>

      {/* History Modal */}
      <Portal>
        <PaperModal
          visible={showHistoryModal}
          onDismiss={() => setShowHistoryModal(false)}
          contentContainerStyle={styles.modalContentPaper}
        >
          <Text variant="titleLarge" style={styles.modalTitlePaper}>Nomor Terakhir</Text>
          <Divider style={{ marginVertical: 12 }} />
          <FlatList
            data={history}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <List.Item
                title={item.phone_number}
                description={item.customer_name || "Tanpa Nama"}
                left={props => <List.Icon {...props} icon="phone-outline" />}
                onPress={() => {
                  setPhoneNumber(item.phone_number);
                  if (item.customer_name) setCustomerName(item.customer_name);
                  setShowHistoryModal(false);
                }}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyTextModal}>Belum ada riwayat nomor</Text>
            }
            style={{ maxHeight: 400 }}
          />
          <Button mode="text" onPress={() => setShowHistoryModal(false)} style={{ marginTop: 8 }}>
            Tutup
          </Button>
        </PaperModal>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: "800",
    color: "#111827",
  },
  categoryScroll: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  categoryCardPaper: {
    borderRadius: 16,
    marginRight: 12,
    marginVertical: 4,
    backgroundColor: "#FFF",
    overflow: 'hidden',
    minWidth: 80,
  },
  activeCategoryCardPaper: {
    backgroundColor: "#6366F1",
  },
  categoryRipple: {
    padding: 12,
  },
  categoryContent: {
    alignItems: "center",
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#374151",
  },
  activeCategoryLabel: {
    color: "#FFF",
  },
  mainCardPaper: {
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
  },
  inputRowPaper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  fieldMargin: {
    marginBottom: 16,
  },
  templateSectionPaper: {
    marginBottom: 16,
  },
  labelPaper: {
    marginBottom: 8,
    color: "#374151",
    fontWeight: "600",
  },
  templateGridPaper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  templateChip: {
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
  },
  mainActionBtn: {
    marginTop: 8,
    borderRadius: 12,
  },
  modalContentPaper: {
    backgroundColor: "white",
    padding: 24,
    margin: 20,
    borderRadius: 20,
  },
  modalTitlePaper: {
    fontWeight: "bold",
  },
  emptyTextModal: {
    textAlign: "center",
    color: "#9CA3AF",
    paddingVertical: 20,
  },
});
