import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getAllSales } from "../database/sales";
import { Sale } from "../types/database";
import { TextInput } from "react-native";

export default function SalesHistoryScreen() {
  const navigation = useNavigation<any>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const loadSales = async (page: number = 0) => {
    try {
      const isInitialLoad = page === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const offset = page * PAGE_SIZE;
      const data = showFilter
        ? await getAllSales(startDate, endDate, PAGE_SIZE, offset)
        : await getAllSales(undefined, undefined, PAGE_SIZE, offset);

      if (isInitialLoad) {
        setSales(data);
        setCurrentPage(0);
      } else {
        setSales(prev => [...prev, ...data]);
        setCurrentPage(page);
      }

      // Check if we have more data
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSales(0);
    }, [showFilter, startDate, endDate])
  );

  const handleEndReached = () => {
    if (!loadingMore && !loading && hasMore) {
      loadSales(currentPage + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadSales(0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " WIB";
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
          <TouchableOpacity style={styles.applyBtn} onPress={() => loadSales(0)}>
            <Text style={styles.applyBtnText}>Terapkan</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E11D48']}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#111827" />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.saleCard}
            onPress={() => navigation.navigate("SaleDetail", { saleId: item.id })}
            activeOpacity={0.7}
          >
            <View style={styles.saleHeader}>
              <View style={styles.idBadge}>
                <Text style={styles.saleId}>TRX-{item.id?.toString().padStart(5, '0')}</Text>
              </View>
              <Text style={styles.saleDate}>{formatDate(item.created_at)}</Text>
            </View>

            <View style={styles.saleBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.totalAmount}>
                  Rp {(item.total || 0).toLocaleString("id-ID")}
                </Text>
                <Text style={styles.paymentMethodText}>{item.payment_method_name || "Pembayaran"}</Text>
                {item.customer_name && <Text style={styles.customerNameText}>{item.customer_name}</Text>}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                  <Text style={styles.paidText}>Dibayar: Rp {(item.paid || 0).toLocaleString("id-ID")}</Text>
                  <Text style={styles.changeText}>Kembali: Rp {(item.change || 0).toLocaleString("id-ID")}</Text>
                  <View style={{ flexDirection: 'row', gap: 3, marginTop: 3 }}>
                    {(item.points_earned || 0) > 0 && (
                      <View style={styles.historyPointBadge}>
                        <Text style={styles.historyPointText}>+{item.points_earned} Pts</Text>
                      </View>
                    )}
                    {(item.points_redeemed || 0) > 0 && (
                      <View style={[styles.historyPointBadge, { backgroundColor: '#FEF2F2', borderColor: '#FECDD3' }]}>
                        <Text style={[styles.historyPointText, { color: '#E11D48' }]}>-{item.points_redeemed} Pts</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.editBtnSmall}
                  activeOpacity={0.6}
                  onPress={() => {
                    navigation.navigate("SalesTransaction", { editSaleId: item.id });
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.editBtnSmallText}>Edit</Text>
                </TouchableOpacity>
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  idBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saleId: {
    fontSize: 12,
    fontWeight: "700",
    color: "#3B82F6",
  },
  saleDate: {
    fontSize: 11,
    color: "#6B7280",
  },
  saleBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111827",
  },
  paymentMethodText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  customerNameText: {
    fontSize: 12,
    color: "#374151",
    marginTop: 2,
  },
  paidText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "600",
  },
  changeText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  editBtnSmall: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  editBtnSmallText: {
    color: "#3B82F6",
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 16,
  },
  historyPointBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#D1FAE5',
  },
  historyPointText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
  },
});
