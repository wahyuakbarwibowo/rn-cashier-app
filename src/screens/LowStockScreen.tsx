import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getProducts } from "../database/products";
import { Product } from "../types/database";

export default function LowStockScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const loadLowStock = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const allProducts = await getProducts();
      const lowStock = allProducts.filter(p => (p.stock || 0) < 10);
      setProducts(lowStock);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLowStock();
    }, [loadLowStock])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLowStock(true);
  }, [loadLowStock]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>⚠️ Stok Tipis</Text>
        <Text style={styles.subHeader}>{products.length} barang butuh restock</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id!.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E11D48']}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.code}>{item.code || "Tanpa Kode"}</Text>
              </View>
              <View style={styles.stockContainer}>
                <Text style={[styles.stockValue, (item.stock || 0) <= 0 ? styles.outOfStock : styles.lowStock]}>
                  {item.stock}
                </Text>
                <Text style={styles.stockLabel}>Sisa Stok</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.actionBtn}
              onPress={() => navigation.navigate("PurchaseForm")}
            >
              <Text style={styles.actionText}>📥 Tambah Stok (Beli)</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Semua stok barang aman bro!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  headerRow: { marginBottom: 20 },
  header: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  subHeader: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  name: { fontSize: 16, fontWeight: "bold", color: "#374151" },
  code: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  stockContainer: { alignItems: "center" },
  stockValue: { fontSize: 20, fontWeight: "bold" },
  lowStock: { color: "#F59E0B" },
  outOfStock: { color: "#EF4444" },
  stockLabel: { fontSize: 10, color: "#9CA3AF", textTransform: "uppercase" },
  actionBtn: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  actionText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
});
