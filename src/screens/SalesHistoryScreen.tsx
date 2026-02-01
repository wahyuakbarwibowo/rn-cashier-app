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
import { TextInput } from "react-native";

export default function SalesHistoryScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = showFilter 
        ? await getAllSales(startDate, endDate)
        : await getAllSales();
      setSales(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [showFilter]);

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
      <View style={styles.headerRow}>
        <Text style={styles.header}>📜 Riwayat Transaksi</Text>
        <TouchableOpacity 
          style={[styles.filterToggle, showFilter && styles.filterToggleActive]} 
          onPress={() => setShowFilter(!showFilter)}
        >
          <Text style={[styles.filterToggleText, showFilter && styles.filterToggleTextActive]}>
            {showFilter ? "Tutup Filter" : "Filter"}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilter && (
        <View style={styles.filterContainer}>
          <View style={styles.dateGroup}>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>Dari</Text>
              <TextInput 
                style={styles.dateInput} 
                value={startDate} 
                onChangeText={setStartDate} 
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.dateInputWrapper}>
              <Text style={styles.dateLabel}>Sampai</Text>
              <TextInput 
                style={styles.dateInput} 
                value={endDate} 
                onChangeText={setEndDate} 
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={loadSales}>
            <Text style={styles.applyBtnText}>Terapkan</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        onRefresh={loadSales}
        refreshing={loading}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.saleCard}
            onPress={() => navigation.navigate("SaleDetail", { saleId: item.id, from: "SalesHistory" })}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  filterToggle: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterToggleActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  filterToggleTextActive: {
    color: "#FFF",
  },
  filterContainer: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  dateGroup: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
    fontWeight: "bold",
  },
  dateInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: "#111827",
  },
  applyBtn: {
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
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
