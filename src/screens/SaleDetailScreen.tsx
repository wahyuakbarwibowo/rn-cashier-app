import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getSaleItems } from "../database/sales";
import { getDB } from "../database/initDB";
import { Sale, SaleItem, Product } from "../types/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { printSaleReceipt } from "../services/PrintService";

export default function SaleDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { saleId } = route.params;

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<(SaleItem & { product_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaleDetail();
  }, [saleId]);

  const loadSaleDetail = async () => {
    try {
      setLoading(true);
      const db = await getDB();

      // Get Sale
      const saleData = await db.getFirstAsync<Sale>(
        "SELECT * FROM sales WHERE id = ?",
        [saleId]
      );
      setSale(saleData || null);

      // Get Items with Product Name
      const itemsData = await db.getAllAsync<any>(
        `SELECT si.*, p.name as product_name 
         FROM sales_items si 
         JOIN products p ON si.product_id = p.id 
         WHERE si.sale_id = ?`,
        [saleId]
      );
      setItems(itemsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.center}>
        <Text>Transaksi tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Detail Transaksi</Text>
              <Text style={styles.trxId}>TRX-{sale.id?.toString().padStart(5, '0')}</Text>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Tanggal</Text>
                <Text style={styles.value}>{formatDate(sale.created_at)}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.label}>Total</Text>
                <Text style={[styles.value, styles.totalText]}>Rp {(sale.total || 0).toLocaleString("id-ID")}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Dibayar</Text>
                <Text style={styles.value}>Rp {(sale.paid || 0).toLocaleString("id-ID")}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Kembali</Text>
                <Text style={styles.value}>Rp {(sale.change || 0).toLocaleString("id-ID")}</Text>
              </View>
              {(sale.points_earned || 0) > 0 && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: '#FB7185' }]}>Poin Didapat</Text>
                  <Text style={[styles.value, { color: '#FB7185' }]}>+{sale.points_earned} Pts</Text>
                </View>
              )}
              {(sale.points_redeemed || 0) > 0 && (
                <View style={styles.infoRow}>
                  <Text style={[styles.label, { color: '#E11D48' }]}>Poin Ditukar</Text>
                  <Text style={[styles.value, { color: '#E11D48' }]}>-{sale.points_redeemed} Pts</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Daftar Barang</Text>
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product_name || 'Produk Terhapus'}</Text>
              <Text style={styles.itemMeta}>{item.qty} x Rp {(item.price || 0).toLocaleString("id-ID")}</Text>
            </View>
            <Text style={styles.itemSubtotal}>Rp {(item.subtotal || 0).toLocaleString("id-ID")}</Text>
          </View>
        )}
        ListFooterComponent={
          <>
            <TouchableOpacity
              style={styles.printButton}
              onPress={() => sale && printSaleReceipt(sale, items)}
            >
              <Text style={styles.printButtonText}>🖨️ Cetak Struk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                const params = route.params as any;
                if (params?.from === "SalesHistory") {
                  navigation.navigate("SalesHistory" as never);
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Text style={styles.backButtonText}>Kembali</Text>
            </TouchableOpacity>
          </>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  trxId: {
    fontSize: 16,
    color: "#3B82F6",
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  label: {
    color: "#6B7280",
    fontSize: 14,
  },
  value: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16A34A",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  itemMeta: {
    fontSize: 13,
    color: "#6B7280",
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#111827",
  },
  backButton: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  printButton: {
    backgroundColor: "#16A34A",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  printButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
