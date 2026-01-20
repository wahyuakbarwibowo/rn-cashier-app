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
import { useNavigation } from "@react-navigation/native";
import { getProducts } from "../database/products";
import { addSale } from "../database/sales";
import { Product } from "../types/database";

type CartItem = {
  product: Product;
  qty: number;
  price: number;
};

export default function SalesTransactionScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paidAmount, setPaidAmount] = useState<string>("0");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddToCart = (product: Product) => {
    const existing = cart.find((i) => i.product.id === product.id);
    if (existing) {
      updateCartItem(product.id!, { qty: existing.qty + 1 });
    } else {
      setCart([
        ...cart,
        {
          product,
          qty: 1,
          price: product.selling_price || 0,
        },
      ]);
    }
  };

  const updateCartItem = (
    id: number,
    changes: Partial<Pick<CartItem, "qty" | "price">>
  ) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === id ? { ...i, ...changes } : i
      )
    );
  };

  const handleRemoveFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
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
          total,
          paid: Number(paidAmount),
          change: change,
        },
        cart.map((i) => ({
          product_id: i.product.id!,
          qty: i.qty,
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
              <TouchableOpacity
                style={styles.productPill}
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.productPillText}>{item.name}</Text>
                <Text style={styles.productPillPrice}>
                  Rp {item.selling_price?.toLocaleString("id-ID")}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Cart Items */}
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Keranjang</Text>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.product.id?.toString() ?? ""}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName}>{item.product.name}</Text>
                  <Text style={styles.cartItemPrice}>
                    @Rp {item.price.toLocaleString("id-ID")}
                  </Text>
                </View>
                <View style={styles.qtyContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      updateCartItem(item.product.id!, {
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
                      updateCartItem(item.product.id!, {
                        qty: parseInt(t) || 0,
                      })
                    }
                    style={styles.qtyInput}
                  />
                  <TouchableOpacity
                    onPress={() =>
                      updateCartItem(item.product.id!, { qty: item.qty + 1 })
                    }
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
  productPill: {
    backgroundColor: "#EFF6FF",
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
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
