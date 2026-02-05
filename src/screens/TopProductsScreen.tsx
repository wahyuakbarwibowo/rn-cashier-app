import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList,
} from "react-native";
import { getDB } from "../database/initDB";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

type TopProduct = {
  id: number;
  name: string;
  code: string;
  totalQty: number;
  totalRevenue: number;
};

export default function TopProductsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("month");
  const [data, setData] = useState<TopProduct[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      
      let dateFilter = "";
      const now = new Date();
      
      if (period === "today") {
        const today = now.toISOString().split("T")[0];
        dateFilter = `s.created_at LIKE '${today}%'`;
      } else if (period === "week") {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        dateFilter = `date(s.created_at) >= date('${lastWeek}')`;
      } else if (period === "month") {
        const thisMonth = now.toISOString().slice(0, 7);
        dateFilter = `s.created_at LIKE '${thisMonth}%'`;
      } else if (period === "year") {
        const thisYear = now.getFullYear();
        dateFilter = `s.created_at LIKE '${thisYear}%'`;
      }

      const query = `
        SELECT 
          p.id,
          p.name,
          p.code,
          SUM(si.qty) as totalQty,
          SUM(si.subtotal) as totalRevenue
        FROM sales_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE ${dateFilter}
        GROUP BY p.id
        ORDER BY totalQty DESC
        LIMIT 10
      `;
      
      const results = await db.getAllAsync<TopProduct>(query);
      setData(results || []);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const PeriodButton = ({ type, label }: { type: typeof period, label: string }) => (
    <TouchableOpacity
      style={[styles.periodBtn, period === type && styles.periodBtnActive]}
      onPress={() => setPeriod(type)}
    >
      <Text style={[styles.periodLabel, period === type && styles.periodLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderProductItem = ({ item, index }: { item: TopProduct, index: number }) => (
    <View style={styles.productCard}>
      <View style={[styles.rankBadge, index === 0 ? styles.rank1 : index === 1 ? styles.rank2 : index === 2 ? styles.rank3 : null]}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productCode}>{item.code}</Text>
      </View>

      <View style={styles.productStats}>
        <Text style={styles.qtyText}>{item.totalQty} <Text style={{fontSize: 10, color: '#9CA3AF'}}>pcs</Text></Text>
        <Text style={styles.revenueText}>Rp {item.totalRevenue.toLocaleString("id-ID")}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <PeriodButton type="today" label="Hari Ini" />
        <PeriodButton type="week" label="7 Hari" />
        <PeriodButton type="month" label="Bulan Ini" />
        <PeriodButton type="year" label="Tahun Ini" />
      </View>

      <View style={{ flex: 1 }}>
        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#FB7185" style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.headerTitle}>10 Produk Terlaris 🏆</Text>
                <Text style={styles.headerSubtitle}>Berdasarkan jumlah kuantitas terjual</Text>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Belum ada data penjualan di periode ini.</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  filterContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 12,
    justifyContent: "space-around",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  periodBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  periodBtnActive: {
    backgroundColor: "#FB7185",
  },
  periodLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  periodLabelActive: {
    color: "#FFF",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeader: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rank1: {
    backgroundColor: "#FB7185", // Rose 400
  },
  rank2: {
    backgroundColor: "#FDA4AF", // Rose 300
  },
  rank3: {
    backgroundColor: "#FECDD3", // Rose 200
  },
  rankText: {
    color: "#FFF",
    fontWeight: "800",
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  productCode: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  productStats: {
    alignItems: "flex-end",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FB7185",
  },
  revenueText: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  emptyContainer: {
    marginTop: 50,
    alignItems: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
});
