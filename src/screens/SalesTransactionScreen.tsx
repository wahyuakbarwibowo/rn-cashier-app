import React, { useState } from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
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
  SegmentedButtons,
  HelperText
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import { getProducts } from "../database/products";
import { addSale } from "../database/sales";
import { getCustomers, addCustomer } from "../database/customers";
import { getPaymentMethods } from "../database/payment_methods";
import { Product, Customer, PaymentMethod } from "../types/database";

type CartItem = {
  product: Product;
  qty: number; // Total units
};

// Simplified consolidation: one row per product ID
const optimizeCartItems = (items: CartItem[]): CartItem[] => {
  const map = new Map<number, CartItem>();
  for (const item of items) {
    const id = item.product.id!;
    if (map.has(id)) {
      map.get(id)!.qty += item.qty;
    } else {
      map.set(id, { ...item });
    }
  }
  return Array.from(map.values()).filter(i => i.qty > 0);
};

// Helper to calculate effective price breakdown for display
const getPriceBreakdown = (item: CartItem) => {
  const p = item.product;
  const qty = item.qty;

  if (p.package_price && p.package_qty && p.package_qty > 0) {
    const numPacks = Math.floor(qty / p.package_qty);
    const remainder = qty % p.package_qty;
    const totalPrice = (numPacks * p.package_price) + (remainder * (p.selling_price || 0));

    let label = "";
    if (numPacks > 0 && remainder > 0) {
      label = `${numPacks} Pkt + ${remainder} Sat`;
    } else if (numPacks > 0) {
      label = `${numPacks} Paket`;
    } else {
      label = `${remainder} Satuan`;
    }

    return { totalPrice, label, unitPrice: totalPrice / qty };
  }

  const totalPrice = qty * (p.selling_price || 0);
  return { totalPrice, label: `${qty} Satuan`, unitPrice: p.selling_price || 0 };
};

export default function SalesTransactionScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>("0");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Barcode Scanner & Date Picker State
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadInitialData();

      const params = route.params as { addProductId?: number };
      if (params?.addProductId) {
        const productId = params.addProductId;
        // Search in fresh products
        getProducts().then(allProducts => {
          const p = allProducts.find(x => x.id === productId);
          if (p) handleAddToCart(p);
          navigation.setParams({ addProductId: undefined });
        });
      }
    }, [route.params])
  );

  const loadInitialData = async () => {
    const [p, c, m] = await Promise.all([
      getProducts(),
      getCustomers(),
      getPaymentMethods()
    ]);
    setProducts(p);
    setCustomers(c);
    setPaymentMethods(m);
    if (m.length > 0) setSelectedPaymentMethodId(m[0].id!);
  };


  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddToCart = (product: Product, asPackage: boolean = false) => {
    const unitsToAdd = asPackage ? (product.package_qty || 1) : 1;
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.product.id === product.id);

      if (existingIndex > -1) {
        return prevCart.map((item, idx) =>
          idx === existingIndex ? { ...item, qty: item.qty + unitsToAdd } : item
        );
      } else {
        return [...prevCart, { product, qty: unitsToAdd }];
      }
    });
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setIsScanning(false);

    // Find product with this code
    const product = products.find(p => p.code === data);
    if (product) {
      handleAddToCart(product);
      setSearchQuery(""); // Clear search if any
      Alert.alert("Sukses", `Berhasil menambah ${product.name}`);
    } else {
      Alert.alert(
        "Produk Tidak Ditemukan",
        `Barang dengan kode ${data} belum terdaftar.`,
        [
          { text: "Tutup", style: "cancel" },
          {
            text: "Tambah Produk",
            onPress: () => navigation.navigate("Product", { initialCode: data })
          }
        ]
      );
    }
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Izin Kamera", "Akses kamera dibutuhkan untuk scan barcode");
        return;
      }
    }
    setIsScanning(true);
  };

  const updateCartItemQty = (id: number, qty: number) => {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty } : i)).filter(i => i.qty > 0));
  };

  const decreaseCartItemQty = (id: number) => {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, qty: i.qty - 1 } : i)).filter(i => i.qty > 0));
  };

  const handleRemoveFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + getPriceBreakdown(item).totalPrice, 0);

  // Loyalty Points Logic
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const availablePoints = selectedCustomer?.points || 0;
  const pointsToRedeem = redeemPoints ? Math.min(availablePoints, total) : 0;
  const finalTotal = total - pointsToRedeem;
  const earnedPoints = Math.floor(finalTotal / 1000); // 1 point per 1000 IDR

  const change = Number(paidAmount) - finalTotal;

  const resetForm = () => {
    setCart([]);
    setPaidAmount("0");
    setSearchQuery("");
    setSelectedCustomerId(null);
    setCustomerName("");
    setRedeemPoints(false);
    setTransactionDate(new Date().toISOString().split('T')[0]);
    if (paymentMethods.length > 0) {
      setSelectedPaymentMethodId(paymentMethods[0].id!);
    }
  };

  const handleReload = () => {
    loadInitialData();
    resetForm();
    Alert.alert("Refreshed", "Data dan keranjang berhasil dimuat ulang");
  };

  const handleFinishTransaction = async () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Keranjang kosong");
      return;
    }

    // Stock Validation
    for (const item of cart) {
      if (item.qty > (item.product.stock || 0)) {
        Alert.alert(
          "Stok Tidak Cukup",
          `Produk "${item.product.name}" hanya memiliki stok ${item.product.stock || 0}, tapi di keranjang ada ${item.qty}.`
        );
        return;
      }
    }
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId);
    const isDebt = selectedMethod?.name.toLowerCase().includes("hutang");

    if (Number(paidAmount) < finalTotal && !isDebt) {
      Alert.alert("Error", "Pembayaran kurang");
      return;
    }

    if (isDebt && !selectedCustomerId && !customerName.trim()) {
      Alert.alert("Error", "Nama pelanggan harus diisi untuk transaksi hutang");
      return;
    }

    try {
      let finalCustomerId = selectedCustomerId;

      // If manual name is entered, create customer
      if (!finalCustomerId && customerName.trim()) {
        const newCustomerId = await addCustomer({
          name: customerName.trim(),
          phone: "",
          address: ""
        });
        finalCustomerId = newCustomerId;
      }

      const finalSalesItems: any[] = [];
      for (const item of cart) {
        const p = item.product;
        if (p.package_qty && p.package_price) {
          const numPacks = Math.floor(item.qty / p.package_qty);
          const remainder = item.qty % p.package_qty;

          if (numPacks > 0) {
            finalSalesItems.push({
              product_id: p.id!,
              qty: numPacks * p.package_qty,
              price: p.package_price / p.package_qty,
              subtotal: numPacks * p.package_price,
            });
          }
          if (remainder > 0) {
            finalSalesItems.push({
              product_id: p.id!,
              qty: remainder,
              price: p.selling_price || 0,
              subtotal: remainder * (p.selling_price || 0),
            });
          }
        } else {
          finalSalesItems.push({
            product_id: p.id!,
            qty: item.qty,
            price: p.selling_price || 0,
            subtotal: item.qty * (p.selling_price || 0),
          });
        }
      }

      const saleId = await addSale(
        {
          customer_id: finalCustomerId,
          payment_method_id: selectedPaymentMethodId,
          total: finalTotal,
          paid: Number(paidAmount),
          change: isDebt ? 0 : change,
          points_earned: earnedPoints,
          points_redeemed: pointsToRedeem,
          created_at: transactionDate + " " + new Date().toLocaleTimeString('en-GB')
        },
        finalSalesItems
      );

      Alert.alert("Sukses", "Transaksi berhasil disimpan", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            navigation.navigate("SaleDetail", { saleId });
          }
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyimpan transaksi");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={{ flex: 1, backgroundColor: "#F3F4F6", paddingTop: 0 }}>
        {/* Top: Search Bar & Quick Actions */}
        <Surface elevation={2} style={styles.topSearchSurface}>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Cari produk atau barcode..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              mode="outlined"
              style={styles.searchInputPaper}
              outlineStyle={{ borderRadius: 12 }}
              left={<TextInput.Icon icon="magnify" />}
              right={searchQuery.length > 0 ? (
                <TextInput.Icon icon="close" onPress={() => setSearchQuery("")} />
              ) : (
                <TextInput.Icon icon="camera" onPress={startScan} />
              )}
            />
            <IconButton icon="history" size={24} onPress={() => navigation.navigate("SalesHistory")} style={styles.headerIconBtn} />
            <IconButton icon="refresh" size={24} onPress={handleReload} style={styles.headerIconBtn} />
          </View>

          {searchQuery.length > 0 && (
            <Surface elevation={4} style={styles.searchResultOverlayPaper}>
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id?.toString() ?? ""}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <>
                    <List.Item
                      title={item.name}
                      description={`${item.code}\nRp ${item.selling_price?.toLocaleString("id-ID")}${item.package_price ? ` • Paket: Rp ${item.package_price?.toLocaleString("id-ID")}` : ''}`}
                      descriptionStyle={{ fontSize: 13 }}
                      left={props => <List.Icon {...props} icon="package-variant" />}
                      right={() => (
                        <View style={styles.productActionsPaper}>
                          <IconButton
                            icon="plus-circle-outline"
                            onPress={() => handleAddToCart(item, false)}
                            size={24}
                          />
                          {item.package_price ? (
                            <IconButton
                              icon="package-variant-plus"
                              onPress={() => handleAddToCart(item, true)}
                              iconColor="#8B5CF6"
                              size={24}
                            />
                          ) : null}
                        </View>
                      )}
                    />
                    <Divider />
                  </>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyTextPaper}>Produk tidak ditemukan</Text>
                }
              />
            </Surface>
          )}
        </Surface>

        {/* Middle: Cart List - Expandable */}
        <View style={{ flex: 1, paddingVertical: 8 }}>
          <FlatList
            data={cart}
            keyExtractor={(item) => `${item.product.id}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            renderItem={({ item }) => {
              const info = getPriceBreakdown(item);
              const isInvalid = item.qty > (item.product.stock || 0);
              return (
                <Surface elevation={1} style={styles.cartItemSurface}>
                  <List.Item
                    title={item.product.name}
                    titleStyle={isInvalid ? { color: '#DC2626', fontWeight: 'bold' } : { fontWeight: '600' }}
                    description={`${info.label} • Rp ${Math.round(info.unitPrice).toLocaleString("id-ID")}${isInvalid ? `\n⚠️ Stok kurang (Sisa: ${item.product.stock})` : ''}`}
                    descriptionStyle={isInvalid ? { color: '#DC2626' } : undefined}
                    right={() => (
                      <View style={styles.cartQtyActions}>
                        <IconButton icon="minus-circle-outline" size={22} onPress={() => decreaseCartItemQty(item.product.id!)} />
                        <Text style={styles.cartQtyText}>{item.qty}</Text>
                        <IconButton icon="plus-circle-outline" size={22} onPress={() => handleAddToCart(item.product, false)} />
                        <IconButton icon="delete-outline" size={22} iconColor="#EF4444" onPress={() => handleRemoveFromCart(item.product.id!)} />
                      </View>
                    )}
                  />
                </Surface>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyCartContainer}>
                <IconButton icon="cart-outline" size={64} style={{ opacity: 0.2 }} />
                <Text style={styles.emptyTextPaper}>Keranjang masih kosong</Text>
                <Button mode="outlined" onPress={() => setSearchQuery("")} style={{ marginTop: 16 }}>Mulai Belanja</Button>
              </View>
            }
          />
        </View>

        {/* Bottom: Transaction Details & Checkout */}
        <Surface elevation={5} style={[styles.checkoutSurface, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header for bottom section */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Detail Transaksi</Text>
              <TextInput
                value={transactionDate}
                onChangeText={setTransactionDate}
                mode="flat"
                placeholder="YYYY-MM-DD"
                style={{ backgroundColor: 'transparent', height: 40, fontSize: 13, width: 150 }}
                contentStyle={{ paddingHorizontal: 0 }}
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                right={<TextInput.Icon
                  icon="calendar"
                  size={24}
                  forceTextInputFocus={false}
                  onPress={() => setShowDatePicker(true)}
                />}
              />
            </View>

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

            {/* Customer & Payment Options Row */}
            <View style={styles.bottomSelectorsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text variant="labelSmall" style={styles.bottomLabel}>Pelanggan:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  <Chip
                    selected={!selectedCustomerId && !customerName}
                    onPress={() => {
                      setSelectedCustomerId(null);
                      setCustomerName("");
                    }}
                    style={styles.bottomChip}
                    selectedColor="#6366F1"
                    compact
                  >
                    Umum
                  </Chip>
                  {customers.slice(0, 5).map(c => (
                    <Chip
                      key={c.id}
                      selected={selectedCustomerId === c.id}
                      onPress={() => {
                        setSelectedCustomerId(c.id!);
                        setCustomerName("");
                      }}
                      style={styles.bottomChip}
                      selectedColor="#6366F1"
                      compact
                    >
                      {c.name}
                    </Chip>
                  ))}
                </ScrollView>
                <TextInput
                  placeholder="Nama pelanggan..."
                  value={customerName}
                  onChangeText={(t) => {
                    setCustomerName(t);
                    if (t) setSelectedCustomerId(null);
                  }}
                  mode="outlined"
                  dense
                  style={styles.bottomInput}
                  outlineStyle={{ borderRadius: 8 }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text variant="labelSmall" style={styles.bottomLabel}>Metode Bayar:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                  {paymentMethods.map(m => (
                    <Chip
                      key={m.id}
                      selected={selectedPaymentMethodId === m.id}
                      onPress={() => setSelectedPaymentMethodId(m.id!)}
                      style={styles.bottomChip}
                      selectedColor="#6366F1"
                      compact
                    >
                      {m.name}
                    </Chip>
                  ))}
                </ScrollView>
                <TextInput
                  value={paidAmount}
                  onChangeText={setPaidAmount}
                  keyboardType="numeric"
                  mode="outlined"
                  dense
                  style={styles.bottomInput}
                  outlineStyle={{ borderRadius: 8 }}
                  selectTextOnFocus
                  left={<TextInput.Affix text="Rp " />}
                />
              </View>
            </View>

            {/* Loyalty Section (Inline) */}
            {selectedCustomerId && availablePoints > 0 && (
              <View style={styles.loyaltyInline}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <List.Icon icon="star-circle" color="#FB7185" style={{ margin: 0 }} />
                  <Text variant="labelSmall" style={{ marginLeft: 4 }}>Poin: {availablePoints} Pts</Text>
                </View>
                <Button
                  mode={redeemPoints ? "contained" : "text"}
                  onPress={() => setRedeemPoints(!redeemPoints)}
                  compact
                  labelStyle={{ fontSize: 10 }}
                  buttonColor={redeemPoints ? "#FB7185" : undefined}
                  textColor={redeemPoints ? "#FFF" : "#FB7185"}
                >
                  {redeemPoints ? "Batal Pakai Poin" : "Tukar Poin?"}
                </Button>
              </View>
            )}

            <Divider style={{ marginVertical: 12, opacity: 0.5 }} />

            {/* Summary Row */}
            <View style={styles.summaryRow}>
              <View style={{ flex: 1 }}>
                <Text variant="labelSmall" style={{ color: '#6B7280' }}>Total Yang Harus Dibayar</Text>
                <Text variant="headlineSmall" style={styles.finalTotalText}>
                  Rp {finalTotal.toLocaleString("id-ID")}
                </Text>
                {selectedCustomerId && (
                  <Text variant="labelSmall" style={{ color: '#10B981', marginTop: 2 }}>
                    <IconButton icon="star-plus" size={12} style={{ margin: 0, padding: 0 }} />
                    Dapat {earnedPoints} Poin
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="labelSmall" style={{ color: '#6B7280' }}>
                  {paymentMethods.find(m => m.id === selectedPaymentMethodId)?.name.toLowerCase().includes("hutang")
                    ? "Sisa Hutang"
                    : "Kembalian"}
                </Text>
                <Text variant="titleLarge" style={[styles.changeText, { color: change >= 0 ? '#10B981' : '#EF4444' }]}>
                  Rp {Math.abs(change).toLocaleString("id-ID")}
                </Text>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleFinishTransaction}
              disabled={
                cart.length === 0 ||
                cart.some(i => i.qty > (i.product.stock || 0)) ||
                (change < 0 && !paymentMethods.find(m => m.id === selectedPaymentMethodId)?.name.toLowerCase().includes("hutang"))
              }
              style={styles.finalCheckoutBtn}
              contentStyle={{ height: 50 }}
              labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
              icon="cart-check"
            >
              {cart.some(i => i.qty > (i.product.stock || 0)) ? "Stok Kurang" : "Selesaikan & Print"}
            </Button>
          </ScrollView>
        </Surface>

        <BarcodeScannerModal
          visible={isScanning}
          onScanned={handleBarcodeScanned}
          onClose={() => setIsScanning(false)}
        />
      </View>
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  topSearchSurface: {
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 100,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputPaper: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerIconBtn: {
    margin: 0,
    marginLeft: 4,
  },
  scanBtnPaper: {
    marginLeft: 8,
    borderRadius: 8,
  },
  searchResultOverlayPaper: {
    position: "absolute",
    top: 70,
    left: 12,
    right: 12,
    backgroundColor: "white",
    borderRadius: 12,
    maxHeight: 400,
    zIndex: 1000,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 8,
  },
  productActionsPaper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemSurface: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  cartQtyActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartQtyText: {
    fontWeight: 'bold',
    minWidth: 28,
    textAlign: 'center',
    fontSize: 16,
  },
  emptyCartContainer: {
    flex: 1,
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyTextPaper: {
    marginTop: 8,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
  },
  checkoutSurface: {
    padding: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    maxHeight: '55%',
  },
  bottomSelectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bottomLabel: {
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '700',
  },
  bottomChip: {
    marginRight: 6,
    height: 32,
  },
  bottomInput: {
    backgroundColor: '#FFF',
    marginTop: 4,
  },
  loyaltyInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  finalTotalText: {
    fontWeight: "900",
    color: "#6366F1",
    lineHeight: 32,
  },
  changeText: {
    fontWeight: "bold",
    lineHeight: 32,
  },
  finalCheckoutBtn: {
    borderRadius: 12,
    marginTop: 8,
  },
});
