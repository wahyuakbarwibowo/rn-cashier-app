import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { getDigitalTransactions, DigitalTransaction } from "../database/pulsa";
import { TextInput } from "react-native";

export default function DigitalTransactionHistoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialCategory = route.params?.category;
  const [transactions, setTransactions] = useState<DigitalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const loadData = useCallback(async (page: number = 0) => {
    try {
      const isInitialLoad = page === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const offset = page * PAGE_SIZE;
      const data = showFilter
        ? await getDigitalTransactions(startDate, endDate, initialCategory, PAGE_SIZE, offset)
        : await getDigitalTransactions(undefined, undefined, initialCategory, PAGE_SIZE, offset);

      if (isInitialLoad) {
        setTransactions(data);
        setCurrentPage(0);
      } else {
        setTransactions(prev => [...prev, ...data]);
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
  }, [showFilter, startDate, endDate, initialCategory]);

  useFocusEffect(
    useCallback(() => {
      loadData(0);
    }, [loadData])
  );

  const handleEndReached = () => {
    if (!loadingMore && !loading && hasMore) {
      loadData(currentPage + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(0);
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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "PULSA": return "#3B82F6";
      case "PLN": return "#F59E0B";
      case "TRANSFER": return "#10B981";
      case "GAME": return "#8B5CF6";
      default: return "#6B7280";
    }
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
        <Text style={styles.title}>📜 Riwayat Digital</Text>
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
          <TouchableOpacity style={styles.applyBtn} onPress={() => loadData(0)}>
            <Text style={styles.applyBtnText}>Terapkan</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={transactions}
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
            style={styles.card}
            onPress={() => navigation.navigate("DigitalDetail", { trxId: item.id })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: getCategoryColor(item.category) }]}>
                <Text style={styles.badgeText}>{item.category}</Text>
              </View>
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.phoneText}>{item.phone_number}</Text>
                {item.customer_name && <Text style={styles.customerText}>{item.customer_name}</Text>}
                <Text style={styles.providerText}>{item.provider}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ alignItems: 'flex-end', marginRight: 12 }}>
                  <Text style={styles.amountText}>Rp {(item.selling_price || 0).toLocaleString("id-ID")}</Text>
                  <Text style={styles.profitText}>Untung: Rp {(item.profit || 0).toLocaleString("id-ID")}</Text>
                </View>
                <TouchableOpacity
                  style={styles.editBtnSmall}
                  activeOpacity={0.6}
                  onPress={() => {
                    navigation.navigate("DigitalTransaction", { editTrx: item });
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
            <Text style={styles.emptyText}>Belum ada transaksi digital</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  filterToggle: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  filterToggleActive: {
    backgroundColor: "#111827",
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
  listContainer: { paddingBottom: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  dateText: { fontSize: 12, color: "#6B7280" },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phoneText: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  customerText: { fontSize: 13, color: "#374151", marginVertical: 2 },
  providerText: { fontSize: 12, color: "#6B7280" },
  amountText: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  profitText: { fontSize: 11, color: "#16A34A", fontWeight: '600', marginTop: 4 },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#9CA3AF", fontSize: 16 },
  editBtnSmall: { backgroundColor: "#EFF6FF", paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, borderColor: "#BFDBFE" },
  editBtnSmallText: { color: "#3B82F6", fontSize: 11, fontWeight: "bold" },
});
