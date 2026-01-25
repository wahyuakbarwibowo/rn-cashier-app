import React, { useEffect, useState } from "react";
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
import { getCustomers } from "../database/customers";
import { getPaymentMethods } from "../database/payment_methods";
import { Product, Customer, PaymentMethod } from "../types/database";

type CartItem = {
  product: Product;
  qty: number;
  price: number;
  isPackage: boolean;
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

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };


  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddToCart = (product: Product, asPackage: boolean = false) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (i) => i.product.id === product.id && i.isPackage === asPackage
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].qty += 1;
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            product,
            qty: 1,
            price: asPackage ? product.package_price || 0 : product.selling_price || 0,
            isPackage: asPackage,
          },
        ];
      }
    });
  };

  const updateCartItem = (
    id: number,
    isPackage: boolean,
    changes: Partial<Pick<CartItem, "qty" | "price">>
  ) => {
    setCart((prev) =>
      prev.map((i) =>
        (i.product.id === id && i.isPackage === isPackage) ? { ...i, ...changes } : i
      )
    );
  };

  const handleRemoveFromCart = (id: number, isPackage: boolean) => {
    setCart((prev) => prev.filter((i) => !(i.product.id === id && i.isPackage === isPackage)));
  };

  const total = cart.reduce((sum, i) => sum + i.qty * i.price, 0);
  const change = Number(paidAmount) - total;

  const handleFinishTransaction = async () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Keranjang kosong");
      return;
    }
    if (Number(paidAmount) < total) {
      Alert.alert("Error", "Pembayaran kurang");
      return;
    }

    try {
      await addSale(
        {
          customer_id: selectedCustomerId,
          payment_method_id: selectedPaymentMethodId,
          total,
          paid: Number(paidAmount),
          change: change,
        },
        cart.map((i) => ({
          product_id: i.product.id!,
          qty: i.isPackage ? i.qty * (i.product.package_qty || 1) : i.qty,
          price: i.price,
          subtotal: i.qty * i.price,
        }))
      );



      Alert.alert("Sukses", "Transaksi berhasil disimpan", [
        { text: "OK", onPress: () => navigation.navigate("Product") },
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
              style={[styles.selectorPill, !selectedCustomerId && styles.activeSelectorPill]}
              onPress={() => setSelectedCustomerId(null)}
            >
              <Text style={[styles.selectorPillText, !selectedCustomerId && styles.activeSelectorPillText]}>Umum</Text>
            </TouchableOpacity>
            {customers.map(c => (
              <TouchableOpacity 
                key={c.id} 
                style={[styles.selectorPill, selectedCustomerId === c.id && styles.activeSelectorPill]}
                onPress={() => setSelectedCustomerId(c.id!)}
              >
                <Text style={[styles.selectorPillText, selectedCustomerId === c.id && styles.activeSelectorPillText]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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

        <View style={styles.card}>
          <TextInput
            placeholder="Cari produk atau barcode..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <FlatList
            data={filteredProducts.slice(0, 10)} // Limit to visible
            keyExtractor={(item) => item.id?.toString() ?? ""}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.productList}
            renderItem={({ item }) => (
              <View style={styles.productPillContainer}>
                <TouchableOpacity
                  style={styles.productPill}
                  onPress={() => handleAddToCart(item, false)}
                >
                  <Text style={styles.productPillText}>{item.name}</Text>
                  <Text style={styles.productPillPrice}>
                    Rp {item.selling_price?.toLocaleString("id-ID")}
                  </Text>
                </TouchableOpacity>
                {item.package_price ? (
                  <TouchableOpacity
                    style={[styles.productPill, styles.packagePill]}
                    onPress={() => handleAddToCart(item, true)}
                  >
                    <Text style={styles.productPillText}>Paket ({item.package_qty})</Text>
                    <Text style={styles.productPillPrice}>
                      Rp {item.package_price?.toLocaleString("id-ID")}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          />
        </View>

        {/* Cart Items */}
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Keranjang</Text>
          <FlatList
            data={cart}
            keyExtractor={(item, index) => `${item.product.id}-${item.isPackage}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>
                    {item.product.name} {item.isPackage ? '(Paket)' : ''}
                  </Text>
                  <Text style={styles.cartItemPrice}>
                    @Rp {item.price.toLocaleString("id-ID")}
                  </Text>
                </View>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      updateCartItem(item.product.id!, item.isPackage, {
                        qty: Math.max(1, item.qty - 1),
                      })
                    }
                    style={styles.qtyBtn}
                  >
                    <Text>-</Text>
                  </TouchableOpacity>
                  <TextInput
                    value={item.qty.toString()}
                    keyboardType="numeric"
                    onChangeText={(t) =>
                      updateCartItem(item.product.id!, item.isPackage, {
                        qty: parseInt(t) || 0,
                      })
                    }
                    style={styles.qtyInput}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      updateCartItem(item.product.id!, item.isPackage, { qty: item.qty + 1 })
                    }
                    style={styles.qtyBtn}
                  >
                    <Text>+</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveFromCart(item.product.id!, item.isPackage)}
                  style={styles.removeBtn}
                >
                  <Text style={{ color: "red" }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Keranjang masih kosong</Text>
            }
          />
        </View>


        {/* Payment & Total */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
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
              <Text style={styles.label}>Kembalian</Text>
              <Text
                style={[
                  styles.changeValue,
                  { color: change >= 0 ? "#16A34A" : "#DC2626" },
                ]}
              >
                Rp {Math.max(0, change).toLocaleString("id-ID")}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              { backgroundColor: cart.length > 0 && change >= 0 ? "#111827" : "#9CA3AF" },
            ]}
            onPress={handleFinishTransaction}
            disabled={cart.length === 0 || change < 0}
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
  },
  searchInput: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  productList: {
    marginBottom: 8,
  },
  productPillContainer: {
    flexDirection: 'row',
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
