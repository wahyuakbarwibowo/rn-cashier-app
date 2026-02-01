import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
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
  const [searchQuery, setSearchQuery] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");

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
        const newCart = [...prevCart];
        newCart[existingIndex].qty += unitsToAdd;
        return newCart;
      } else {
        return [...prevCart, { product, qty: unitsToAdd }];
      }
    });
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
  const change = Number(paidAmount) - total;

  const resetForm = () => {
    setCart([]);
    setPaidAmount("0");
    setSearchQuery("");
    setSelectedCustomerId(null);
    setCustomerName("");
    if (paymentMethods.length > 0) {
      setSelectedPaymentMethodId(paymentMethods[0].id!);
    }
  };

  const handleFinishTransaction = async () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Keranjang kosong");
      return;
    }
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethodId);
    const isDebt = selectedMethod?.name.toLowerCase().includes("hutang");

    if (Number(paidAmount) < total && !isDebt) {
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
          total,
          paid: Number(paidAmount),
          change: isDebt ? 0 : change,
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
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.header}>🛒 Penjualan Baru</Text>

        {/* Customer & Payment Method */}
        <View style={styles.topSelectors}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            <TouchableOpacity 
              style={[styles.selectorPill, !selectedCustomerId && !customerName && styles.activeSelectorPill]}
              onPress={() => {
                setSelectedCustomerId(null);
                setCustomerName("");
              }}
            >
              <Text style={[styles.selectorPillText, !selectedCustomerId && !customerName && styles.activeSelectorPillText]}>Umum</Text>
            </TouchableOpacity>
            {customers.map(c => (
              <TouchableOpacity 
                key={c.id} 
                style={[styles.selectorPill, selectedCustomerId === c.id && styles.activeSelectorPill]}
                onPress={() => {
                  setSelectedCustomerId(c.id!);
                  setCustomerName("");
                }}
              >
                <Text style={[styles.selectorPillText, selectedCustomerId === c.id && styles.activeSelectorPillText]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.customerInputRow}>
            <TextInput
              placeholder="Atau input nama pelanggan baru..."
              value={customerName}
              onChangeText={(t) => {
                setCustomerName(t);
                if (t) setSelectedCustomerId(null);
              }}
              style={styles.customerInput}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            {paymentMethods.map(m => (
              <TouchableOpacity 
                key={m.id} 
                style={[styles.selectorPill, selectedPaymentMethodId === m.id && styles.activeSelectorPill]}
                onPress={() => setSelectedPaymentMethodId(m.id!)}
              >
                <Text style={[styles.selectorPillText, selectedPaymentMethodId === m.id && styles.activeSelectorPillText]}>{m.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Search & Product Selection */}
        <View style={[styles.card, { zIndex: 50 }]}>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Cari produk atau barcode..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, styles.searchInputFlex]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearSearchBtnText}>Batal</Text>
              </TouchableOpacity>
            )}
          </View>

          {searchQuery.length > 0 && (
            <View style={styles.searchResultOverlay}>
              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id?.toString() ?? ""}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <View style={styles.productListItem}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      {item.code && <Text style={styles.productCode}>{item.code}</Text>}
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={styles.priceActionBtn}
                        onPress={() => handleAddToCart(item, false)}
                      >
                        <Text style={styles.priceActionLabel}>Satuan</Text>
                        <Text style={styles.priceActionValue}>
                          Rp {item.selling_price?.toLocaleString("id-ID")}
                        </Text>
                      </TouchableOpacity>
                      {item.package_price ? (
                        <TouchableOpacity
                          style={[styles.priceActionBtn, styles.packageActionBtn]}
                          onPress={() => handleAddToCart(item, true)}
                        >
                          <Text style={styles.priceActionLabel}>Paket ({item.package_qty})</Text>
                          <Text style={styles.priceActionValue}>
                            Rp {item.package_price?.toLocaleString("id-ID")}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
                }
              />
            </View>
          )}
        </View>

        {/* Cart Items */}
        <View style={[styles.card, { flex: 1, zIndex: 1 }]}>
          <Text style={styles.cardTitle}>Keranjang</Text>
          <FlatList
            data={cart}
            keyExtractor={(item) => `${item.product.id}`}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const info = getPriceBreakdown(item);
              return (
                <View style={styles.cartItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.product.name}</Text>
                    <Text style={styles.cartItemPrice}>
                      {info.label} (@Rp {Math.round(info.unitPrice).toLocaleString("id-ID")})
                    </Text>
                  </View>
                  <View style={styles.qtyContainer}>
                    <TouchableOpacity
                      onPress={() => decreaseCartItemQty(item.product.id!)}
                      style={styles.qtyBtn}
                    >
                      <Text>-</Text>
                    </TouchableOpacity>
                    <TextInput
                      value={item.qty.toString()}
                      keyboardType="numeric"
                      onChangeText={(t) => updateCartItemQty(item.product.id!, parseInt(t) || 0)}
                      style={styles.qtyInput}
                    />
                    <TouchableOpacity
                      onPress={() => handleAddToCart(item.product, false)}
                      style={styles.qtyBtn}
                    >
                      <Text>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveFromCart(item.product.id!)}
                    style={styles.removeBtn}
                  >
                    <Text style={{ color: "red" }}>✕</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Keranjang masih kosong</Text>
            }
          />
        </View>


        {/* Payment & Total */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                Rp {total.toLocaleString("id-ID")}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.label}>Dibayar</Text>
              <TextInput
                value={paidAmount}
                onChangeText={setPaidAmount}
                keyboardType="numeric"
                style={styles.paymentInput}
                selectTextOnFocus
              />
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.label}>
                {paymentMethods.find(m => m.id === selectedPaymentMethodId)?.name.toLowerCase().includes("hutang") 
                  ? "Jumlah Hutang" 
                  : "Kembalian"}
              </Text>
              <Text
                style={[
                  styles.changeValue,
                  { 
                    color: paymentMethods.find(m => m.id === selectedPaymentMethodId)?.name.toLowerCase().includes("hutang")
                      ? "#DC2626"
                      : (change >= 0 ? "#16A34A" : "#DC2626") 
                  },
                ]}
              >
                Rp {paymentMethods.find(m => m.id === selectedPaymentMethodId)?.name.toLowerCase().includes("hutang")
                  ? (total - Number(paidAmount)).toLocaleString("id-ID")
                  : Math.max(0, change).toLocaleString("id-ID")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              { 
                backgroundColor: (cart.length > 0 && (change >= 0 || paymentMethods.find(m => m.id === selectedPaymentMethodId)?.name.toLowerCase().includes("hutang"))) 
                  ? "#111827" 
                  : "#9CA3AF" 
              },
            ]}
            onPress={handleFinishTransaction}
            disabled={cart.length === 0 || (change < 0 && !paymentMethods.find(m => m.id === selectedPaymentMethodId)?.name.toLowerCase().includes("hutang"))}
          >
            <Text style={styles.checkoutBtnText}>Selesaikan Transaksi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#111827",
  },
  topSelectors: {
    marginBottom: 12,
  },
  customerInputRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  customerInput: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 14,
  },
  selectorScroll: {
    marginBottom: 8,
  },
  selectorPill: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 40,
    justifyContent: 'center',
  },
  activeSelectorPill: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  selectorPillText: {
    color: "#6B7280",
    fontWeight: "600",
  },
  activeSelectorPillText: {
    color: "#FFF",
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInputFlex: {
    flex: 1,
    marginBottom: 0,
  },
  clearSearchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearSearchBtnText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  searchResultOverlay: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    maxHeight: 300,
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  productListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  productCode: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  priceActionBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
  },
  packageActionBtn: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  priceActionLabel: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  priceActionValue: {
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "bold",
  },
  productList: {
    marginBottom: 8,
  },
  expandedProductList: {
    flex: 1,
  },
  productGrid: {
    marginBottom: 8,
  },
  productGridItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  productGridCard: {
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginBottom: 6,
  },
  packageGridCard: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  productGridName: {
    fontWeight: "600",
    fontSize: 14,
    color: "#111827",
    marginBottom: 4,
  },
  productGridPrice: {
    fontSize: 13,
    color: "#3B82F6",
    fontWeight: "600",
  },
  productGridCode: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  productPillContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  productPill: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  packagePill: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    marginLeft: 4,
  },
  productPillText: {
    fontWeight: "600",
    fontSize: 14,
  },
  productPillPrice: {
    fontSize: 12,
    color: "#3B82F6",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: "500",
  },
  cartItemPrice: {
    fontSize: 13,
    color: "#6B7280",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  qtyBtn: {
    backgroundColor: "#E5E7EB",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyInput: {
    width: 40,
    textAlign: "center",
    fontSize: 15,
  },
  removeBtn: {
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 20,
  },
  footer: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    elevation: 4,
  },
  paymentInfo: {
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
  },
  paymentInput: {
    backgroundColor: "#F9FAFB",
    padding: 8,
    borderRadius: 6,
    width: 120,
    textAlign: "right",
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  changeValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkoutBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  checkoutBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
