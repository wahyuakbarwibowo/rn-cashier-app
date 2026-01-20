import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getAllSales } from "../database/sales";
import { Sale } from "../types/database";

export default function SalesHistoryScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await getAllSales();
      setSales(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📜 Riwayat Transaksi</Text>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        onRefresh={loadSales}
        refreshing={loading}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.saleCard}
            onPress={() => navigation.navigate("SaleDetail", { saleId: item.id })}
          >
            <View style={styles.saleHeader}>
              <Text style={styles.saleId}>TRX-{item.id?.toString().padStart(5, '0')}</Text>
              <Text style={styles.saleDate}>{formatDate(item.created_at)}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.saleBody}>
              <View>
                <Text style={styles.label}>Total Belanja</Text>
                <Text style={styles.totalAmount}>
                  Rp {item.total.toLocaleString("id-ID")}
                </Text>
              </View>
              
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentText}>Dibayar: Rp {item.paid.toLocaleString("id-ID")}</Text>
                <Text style={styles.paymentText}>Kembali: Rp {item.change.toLocaleString("id-ID")}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
          </View>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#111827",
  },
  listContainer: {
    paddingBottom: 20,
  },
  saleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  saleId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  saleDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  saleBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  label: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  paymentInfo: {
    alignItems: "flex-end",
  },
  paymentText: {
    fontSize: 12,
    color: "#374151",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
});
