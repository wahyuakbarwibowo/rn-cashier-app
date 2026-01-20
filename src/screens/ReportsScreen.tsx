import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { getDB } from "../database/initDB";

type ReportType = 'SALES' | 'STOCK' | 'PROFIT' | 'PURCHASES';
type FilterType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export default function ReportsScreen() {
  const [reportType, setReportType] = useState<ReportType>('SALES');
  const [filterType, setFilterType] = useState<FilterType>('DAILY');
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport();
  }, [reportType, filterType]);

  const loadReport = async () => {
    setLoading(true);
    const db = await getDB();
    let query = "";
    let dateFilter = "";

    // Date filtering logic
    if (filterType === 'DAILY') {
      dateFilter = "date(created_at) = date('now')";
    } else if (filterType === 'WEEKLY') {
      dateFilter = "date(created_at) >= date('now', '-7 days')";
    } else if (filterType === 'MONTHLY') {
      dateFilter = "strftime('%m-%Y', created_at) = strftime('%m-%Y', 'now')";
    } else {
      dateFilter = "strftime('%Y', created_at) = strftime('%Y', 'now')";
    }

    try {
      if (reportType === 'SALES') {
        const salesData = await db.getAllAsync(
          `SELECT * FROM sales WHERE ${dateFilter} ORDER BY id DESC`
        );
        setData(salesData);
        const total = salesData.reduce((sum: number, item: any) => sum + item.total, 0);
        setSummary({ total });
      } else if (reportType === 'STOCK') {
        const stockData = await db.getAllAsync(
          `SELECT name, stock, selling_price, (stock * selling_price) as asset_value FROM products ORDER BY stock ASC`
        );
        setData(stockData);
        const totalAsset = stockData.reduce((sum: number, item: any) => sum + item.asset_value, 0);
        setSummary({ totalAsset });
      } else if (reportType === 'PROFIT') {
        // Profit = Sales Price - Purchase Price
        const profitData = await db.getAllAsync(
          `SELECT 
            s.id, s.created_at, s.total as sales_total,
            SUM(si.qty * (si.price - p.purchase_price)) as estimated_profit
           FROM sales s
           JOIN sales_items si ON s.id = si.sale_id
           JOIN products p ON si.product_id = p.id
           WHERE ${dateFilter.replace('created_at', 's.created_at')}
           GROUP BY s.id ORDER BY s.id DESC`
        );
        setData(profitData);
        const totalProfit = profitData.reduce((sum: number, item: any) => sum + item.estimated_profit, 0);
        setSummary({ totalProfit });
      } else if (reportType === 'PURCHASES') {
        const purchaseData = await db.getAllAsync(
          `SELECT * FROM purchases WHERE ${dateFilter.replace('created_at', 'created_at')} ORDER BY id DESC`
        );
        setData(purchaseData);
        const totalPurchases = purchaseData.reduce((sum: number, item: any) => sum + item.total, 0);
        setSummary({ totalPurchases });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    if (reportType === 'SALES') {
      return (
        <View style={styles.dataRow}>
          <Text style={styles.dataText}>TRX-{item.id}</Text>
          <Text style={styles.dataText}>Rp {item.total.toLocaleString("id-ID")}</Text>
        </View>
      );
    }
    if (reportType === 'STOCK') {
      return (
        <View style={styles.dataRow}>
          <Text style={[styles.dataText, { flex: 2 }]}>{item.name}</Text>
          <Text style={styles.dataText}>{item.stock}</Text>
          <Text style={styles.dataText}>Rp {item.asset_value.toLocaleString("id-ID")}</Text>
        </View>
      );
    }
    if (reportType === 'PROFIT') {
      return (
        <View style={styles.dataRow}>
          <Text style={styles.dataText}>TRX-{item.id}</Text>
          <Text style={[styles.dataText, { color: '#16A34A' }]}>Rp {item.estimated_profit.toLocaleString("id-ID")}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📊 Laporan</Text>

      {/* Report Types */}
      <View style={styles.tabScrollContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
          {['SALES', 'STOCK', 'PROFIT', 'PURCHASES'].map((t) => (
            <TouchableOpacity 
              key={t}
              style={[styles.tab, reportType === t && styles.activeTab]}
              onPress={() => setReportType(t as ReportType)}
            >
              <Text style={[styles.tabText, reportType === t && styles.activeTabText]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Date Filters */}
      <View style={styles.filters}>
        {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].map((f) => (
          <TouchableOpacity 
            key={f}
            style={[styles.filterBtn, filterType === f && styles.activeFilterBtn]}
            onPress={() => setFilterType(f as FilterType)}
          >
            <Text style={[styles.filterText, filterType === f && styles.activeFilterText]}>
              {f === 'DAILY' ? 'Hari' : f === 'WEEKLY' ? 'Mggu' : f === 'MONTHLY' ? 'Bln' : 'Thn'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total {reportType}</Text>
        <Text style={styles.summaryValue}>
          Rp {(summary.total || summary.totalAsset || summary.totalProfit || summary.totalPurchases || 0).toLocaleString("id-ID")}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.headerCell}>{reportType === 'STOCK' ? 'Nama' : 'ID'}</Text>
              {reportType === 'STOCK' && <Text style={styles.headerCell}>Stok</Text>}
              <Text style={styles.headerCell}>{reportType === 'PROFIT' ? 'Laba' : 'Nilai'}</Text>
            </View>
          }
          style={styles.list}
        />
      )}
    </View>
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
  },
  tabScrollContainer: {
    height: 50,
    marginBottom: 12,
  },
  tabs: {
    flexDirection: "row",
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 20,
    marginRight: 8,
    height: 40,
  },
  activeTab: {
    backgroundColor: "#3B82F6",
  },
  tabText: {
    fontWeight: "600",
    color: "#4B5563",
  },
  activeTabText: {
    color: "#FFF",
  },
  filters: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeFilterBtn: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  activeFilterText: {
    color: "#FFF",
  },
  summaryCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
  },
  list: {
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  listHeader: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerCell: {
    flex: 1,
    fontWeight: "bold",
    color: "#374151",
  },
  dataRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dataText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
});
