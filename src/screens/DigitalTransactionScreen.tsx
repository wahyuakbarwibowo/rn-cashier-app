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
  HelperText, // Imported HelperText
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

export default function DigitalTransactionScreen() {
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
  const [paid, setPaid] = useState("");
  const [notes, setNotes] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<{ phone_number: string, customer_name: string }[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [templates, setTemplates] = useState<DigitalProductMaster[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Validation States
  const [phoneNumberError, setPhoneNumberError] = useState<string | null>(null);
  const [transactionDateError, setTransactionDateError] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [sellingPriceError, setSellingPriceError] = useState<string | null>(null);
  const [costPriceError, setCostPriceError] = useState<string | null>(null);

  // Profit state
  const [profit, setProfit] = useState<number>(0);

  const resetForm = () => {
    setEditTrxId(null);
    setCategory("PULSA");
    setPhoneNumber("");
    setCustomerName("");
    setProvider("");
    setAmount("");
    setCostPrice("");
    setSellingPrice("");
    setPaid("");
    setNotes("");
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setPhoneNumberError(null);
    setTransactionDateError(null);
    setProviderError(null);
    setAmountError(null);
    setSellingPriceError(null);
    setCostPriceError(null);
    setTemplates([]);
    setProviders([]);
    setProfit(0);
  };

  useEffect(() => {
    loadCategories();
    loadHistory();

    // Reset form when screen is opened without editTrx param
    if (!route.params?.editTrx) {
      resetForm();
    }
  }, []);

  // Reset form when screen gains focus (when navigating back)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (!route.params?.editTrx) {
        resetForm();
      }
    });
    return unsubscribe;
  }, [navigation, route.params?.editTrx]);

  useEffect(() => {
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
      setPaid((etrx.paid || etrx.selling_price).toString());
      setNotes(etrx.notes || "");
      if (etrx.created_at) {
        // Attempt to parse date from ISO or T-split format
        const datePart = etrx.created_at.split('T')[0].split(' ')[0];
        setTransactionDate(datePart || new Date().toISOString().split('T')[0]);
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
    const providerNames = data.map((d: any) => d.provider);
    setProviders(providerNames);
    // Auto-select "Lainnya" if no providers are found for the category
    if (providerNames.length === 0) {
      setProvider("Lainnya");
    } else if (provider && !providerNames.includes(provider) && provider !== "Lainnya") {
      // If current provider is not in the new list and not "Lainnya", reset it to force selection
      setProvider("");
      setProviderError("Provider wajib dipilih."); // Set error if reset
    } else if (provider === "Lainnya" && providerNames.length > 0) {
        // If user previously selected "Lainnya" but now providers exist, reset
        setProvider("");
        setProviderError("Provider wajib dipilih.");
    }
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
    // If there are templates, and current amount/prices are empty, pre-fill from first template
    if (data.length > 0 && !amount && !costPrice && !sellingPrice) {
      selectTemplate(data[0]);
    }
  };

  const selectTemplate = (item: DigitalProductMaster) => {
    setAmount(item.nominal.toString());
    setCostPrice(item.cost_price.toString());
    setSellingPrice(item.selling_price.toString());
    // Clear potential errors if user selects a template after making errors
    setAmountError(null);
    setCostPriceError(null);
    setSellingPriceError(null);
  };

  // Recalculate profit when prices change
  useEffect(() => {
    const costValue = parseFloat(costPrice) || 0;
    const sellValue = parseFloat(sellingPrice) || 0;
    setProfit(sellValue - costValue);
  }, [costPrice, sellingPrice]);

  // Handler to clear specific error when user types into a field
  const clearErrorOnInput = (setErrorFn: (err: null) => void) => {
    setErrorFn(null);
  };

  const handleTransaction = async () => {
    // --- Reset previous errors ---
    setPhoneNumberError(null);
    setTransactionDateError(null);
    setProviderError(null);
    setAmountError(null);
    setSellingPriceError(null);
    setCostPriceError(null);

    // --- Validation ---
    let isValid = true;

    if (!phoneNumber.trim()) {
      setPhoneNumberError("Nomor pelanggan wajib diisi.");
      isValid = false;
    }
    if (!transactionDate) {
      setTransactionDateError("Tanggal transaksi wajib diisi.");
      isValid = false;
    }
    // Provider is required if there are providers listed (and not "Lainnya" which is handled by a separate input)
    if (providers.length > 0 && !provider && provider !== "Lainnya") {
      setProviderError("Provider wajib dipilih.");
      isValid = false;
    } else if (provider === "Lainnya" && !provider.trim()) {
        // If user selected "Lainnya" but entered empty text
        setProviderError("Nama provider manual wajib diisi.");
        isValid = false;
    }

    if (!amount) {
      setAmountError("Nominal wajib diisi.");
      isValid = false;
    } else {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setAmountError("Nominal harus berupa angka positif.");
        isValid = false;
      }
    }
    if (!sellingPrice) {
      setSellingPriceError("Harga Jual wajib diisi.");
      isValid = false;
    } else {
      const sellValue = parseFloat(sellingPrice);
      if (isNaN(sellValue) || sellValue <= 0) {
        setSellingPriceError("Harga Jual harus berupa angka positif.");
        isValid = false;
      }
    }
    const costValue = parseFloat(costPrice) || 0;
    if (costValue < 0) {
      setCostPriceError("Harga Modal tidak boleh negatif.");
      isValid = false;
    }

    if (!isValid) {
      return; // Stop if validation fails
    }
    // --- End Validation ---

    const finalCostValue = parseFloat(costPrice) || 0;
    const finalSellValue = parseFloat(sellingPrice); // Already validated to be a number > 0
    const profitValue = finalSellValue - finalCostValue;

    try {
      // Construct the timestamp for created_at. Use the selected date and current time.
      const currentTime = new Date().toLocaleTimeString('en-GB'); // e.g., "14:30:00"
      const createdAtTimestamp = `${transactionDate} ${currentTime}`;

      const paidValue = parseFloat(paid) || finalSellValue;

      let trxId: number;
      if (editTrxId) {
        console.log("Updating transaction:", editTrxId, "notes:", notes);
        await updateDigitalTransaction(editTrxId, {
          category,
          phone_number: phoneNumber.trim(),
          customer_name: customerName.trim(),
          provider: provider.trim(),
          amount: parseFloat(amount),
          cost_price: finalCostValue,
          selling_price: finalSellValue,
          paid: paidValue,
          profit: profitValue,
          notes: notes.trim(),
          created_at: createdAtTimestamp
        });
        console.log("Update completed");
        Alert.alert("Sukses", "Transaksi berhasil diperbarui");
        trxId = editTrxId;
      } else {
        trxId = await addDigitalTransaction({
          category,
          phone_number: phoneNumber.trim(),
          customer_name: customerName.trim(),
          provider: provider.trim(),
          amount: parseFloat(amount),
          cost_price: finalCostValue,
          selling_price: finalSellValue,
          paid: paidValue,
          profit: profitValue,
          notes: notes.trim(),
          created_at: createdAtTimestamp
        });
        Alert.alert("Sukses", "Transaksi berhasil disimpan");
      }

      loadHistory(); // Always load history after transaction
      navigation.setParams({ editTrx: undefined }); // Clear edit param
      resetForm(); // Reset form after transaction
      navigation.navigate("DigitalDetail", { trxId }); // Navigate to detail screen

    } catch (e) {
      console.error("Transaction error:", e);
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
                  setProvider(""); // Reset provider when category changes
                  setTemplates([]); // Clear templates
                  clearErrorOnInput(setProviderError); // Clear provider error
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
            {/* Phone Number Input */}
            <View style={styles.inputRowPaper}>
              <TextInput
                label="No. Pelanggan / HP / ID"
                placeholder="0812xxx atau ID Pelanggan"
                value={phoneNumber}
                onChangeText={(text) => { setPhoneNumber(text); clearErrorOnInput(setPhoneNumberError); }}
                keyboardType="numeric"
                mode="outlined"
                style={{ flex: 1 }}
                error={!!phoneNumberError}
                right={
                  <TextInput.Icon
                    icon="history"
                    onPress={() => navigation.navigate("DigitalHistory")} // Navigating to history screen
                  />
                }
                left={
                  <TextInput.Icon
                    icon="text-box-search-outline"
                    onPress={() => setShowHistoryModal(true)} // Opening modal for history selection
                  />
                }
              />
            </View>
            <HelperText type="error" visible={!!phoneNumberError}>
              {phoneNumberError}
            </HelperText>

            {/* Date Input */}
            <TextInput
              label="Tanggal Transaksi"
              placeholder="YYYY-MM-DD"
              value={transactionDate}
              onChangeText={(text) => { setTransactionDate(text); clearErrorOnInput(setTransactionDateError); }}
              mode="outlined"
              style={styles.fieldMargin}
              error={!!transactionDateError}
              right={<TextInput.Icon
                icon="calendar"
                onPress={() => setShowDatePicker(true)}
              />}
            />
            <HelperText type="error" visible={!!transactionDateError}>
              {transactionDateError}
            </HelperText>

            {showDatePicker && (
              <DateTimePicker
                value={new Date(transactionDate)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setTransactionDate(selectedDate.toISOString().split('T')[0]);
                    clearErrorOnInput(setTransactionDateError); // Clear date error on selection
                  }
                }}
              />
            )}

            {/* Customer Name Input */}
            <TextInput
              label="Nama Pelanggan (Opsional)"
              placeholder="Contoh: Budi Santoso"
              value={customerName}
              onChangeText={(text) => { setCustomerName(text); }} // No error for optional field
              mode="outlined"
              style={styles.fieldMargin}
            />

            {/* Provider Input */}
            <TextInput
              label="Provider / Bank / Game"
              value={provider}
              placeholder="Pilih Provider / Operator"
              mode="outlined"
              editable={false}
              style={[styles.fieldMargin, { backgroundColor: '#f0f0f0' }]} // Indicate non-editable
              onPressIn={() => setShowProviderModal(true)}
              right={<TextInput.Icon icon="menu-down" onPress={() => setShowProviderModal(true)} />}
              error={!!providerError}
            />
            <HelperText type="error" visible={!!providerError}>
              {providerError}
            </HelperText>

            {/* Manual Provider Input (if "Lainnya" is selected) */}
            {provider === "Lainnya" && (
              <TextInput
                label="Nama Provider Manual"
                placeholder="Masukkan Nama Provider/Bank Manual"
                value={provider} // Bind value to provider state
                onChangeText={(text) => { setProvider(text); clearErrorOnInput(setProviderError); }}
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

            {/* Amount Input */}
            <TextInput
              label="Nominal / Item"
              placeholder="Contoh: 10000"
              value={amount}
              onChangeText={(text) => { setAmount(text); clearErrorOnInput(setAmountError); }}
              keyboardType="numeric"
              mode="outlined"
              style={styles.fieldMargin}
              error={!!amountError}
            />
            <HelperText type="error" visible={!!amountError}>
              {amountError}
            </HelperText>

            {/* Price Inputs Row */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextInput
                  label="Harga Modal"
                  placeholder="0"
                  value={costPrice}
                  onChangeText={(text) => { setCostPrice(text); clearErrorOnInput(setCostPriceError); }}
                  keyboardType="numeric"
                  mode="outlined"
                  error={!!costPriceError}
                />
                <HelperText type="error" visible={!!costPriceError}>
                  {costPriceError}
                </HelperText>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Harga Jual"
                  placeholder="0"
                  value={sellingPrice}
                  onChangeText={(text) => { setSellingPrice(text); clearErrorOnInput(setSellingPriceError); }}
                  keyboardType="numeric"
                  mode="outlined"
                  error={!!sellingPriceError}
                />
                <HelperText type="error" visible={!!sellingPriceError}>
                  {sellingPriceError}
                </HelperText>
              </View>
            </View>

            {/* Display Profit */}
            <View style={styles.profitDisplay}>
              <Text variant="titleMedium">Keuntungan:</Text>
              <Text variant="titleMedium" style={styles.profitValue}>
                Rp {profit.toLocaleString("id-ID")}
              </Text>
            </View>

            {/* Paid Amount Input */}
            <TextInput
              label="Jumlah Dibayar"
              placeholder="0"
              value={paid}
              onChangeText={(text) => { setPaid(text); }}
              keyboardType="numeric"
              mode="outlined"
              style={styles.fieldMargin}
            />

            {/* Notes Input */}
            <TextInput
              label="Catatan (Opsional)"
              placeholder="Contoh: Token Listrik"
              value={notes}
              onChangeText={(text) => { setNotes(text); }}
              mode="outlined"
              style={styles.fieldMargin}
            />

            {/* Action Buttons */}
            <Button
              mode="contained"
              onPress={handleTransaction}
              style={styles.mainActionBtn}
              contentStyle={{ paddingVertical: 8 }}
              // Disable button if essential fields are not valid
              disabled={
                !phoneNumber.trim() ||
                !transactionDate ||
                (providers.length > 0 && !provider && provider !== "Lainnya") ||
                !amount ||
                !sellingPrice ||
                (costPrice && parseFloat(costPrice) < 0) || // Check cost price negativity
                (amount && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) ||
                (sellingPrice && (isNaN(parseFloat(sellingPrice)) || parseFloat(sellingPrice) <= 0))
              }
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
          onDismiss={() => { setShowProviderModal(false); clearErrorOnInput(setProviderError); }} // Clear error when modal is dismissed
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
                  clearErrorOnInput(setProviderError); // Clear error on selection
                }}
                right={props => item === provider ? <List.Icon {...props} icon="check" color="#6366F1" /> : null}
              />
            )}
            style={{ maxHeight: 400 }}
          />
          <Button mode="text" onPress={() => { setShowProviderModal(false); clearErrorOnInput(setProviderError); }} style={{ marginTop: 8 }}>
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
                  clearErrorOnInput(setPhoneNumberError); // Clear phone number error on selection
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
    color: "#1E293B",
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
    color: "#334155",
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
    marginBottom: 0, // Removed, HelperText will provide spacing below
  },
  fieldMargin: {
    marginBottom: 0, // Removed, HelperText will provide spacing below
  },
  templateSectionPaper: {
    marginBottom: 16,
  },
  labelPaper: {
    marginBottom: 8,
    color: "#334155",
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
    alignItems: "flex-start", // Align items to top to account for HelperText
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
    color: "#94A3B8",
    paddingVertical: 20,
  },
  // New styles for profit display and adjusted spacing
  profitDisplay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12, // Adjusted to align with other field margins
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  profitValue: {
    fontWeight: "bold",
    color: "#6366F1", // Example color, matching active category
  },
});
