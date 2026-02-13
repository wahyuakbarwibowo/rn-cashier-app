import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { getDB } from "../database/initDB";

import { useNavigation } from "@react-navigation/native";

type ReportType = 'SALES' | 'STOCK' | 'PROFIT' | 'PURCHASES' | 'PAYABLES' | 'RECEIVABLES';
type FilterType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [reportType, setReportType] = useState<ReportType>('SALES');
  const [filterType, setFilterType] = useState<FilterType>('DAILY');
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
    } else if (filterType === 'YEARLY') {
      dateFilter = "strftime('%Y', created_at) = strftime('%Y', 'now')";
    } else if (filterType === 'CUSTOM') {
      dateFilter = `date(created_at) BETWEEN date('${startDate}') AND date('${endDate}')`;
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
          `SELECT *, (stock * selling_price) as asset_value FROM products ORDER BY stock ASC`
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
      } else if (reportType === 'PAYABLES') {
        const payablesData = await db.getAllAsync(
          `SELECT p.*, pur.created_at as created_at, s.name as supplier_name 
           FROM payables p
           JOIN purchases pur ON p.purchase_id = pur.id
           LEFT JOIN suppliers s ON p.supplier_id = s.id
           WHERE ${dateFilter.replace('created_at', 'pur.created_at')}
           ORDER BY p.id DESC`
        );
        setData(payablesData);
        const totalPayables = payablesData.reduce((sum: number, item: any) => sum + item.amount, 0);
        setSummary({ totalPayables });
      } else if (reportType === 'RECEIVABLES') {
        const receivablesData = await db.getAllAsync(
          `SELECT r.*, s.created_at as created_at, c.name as customer_name 
           FROM receivables r
           JOIN sales s ON r.sale_id = s.id
           JOIN customers c ON r.customer_id = c.id
           WHERE ${dateFilter.replace('created_at', 's.created_at')}
           ORDER BY r.id DESC`
        );
        setData(receivablesData);
        const totalReceivables = receivablesData.reduce((sum: number, item: any) => sum + item.amount, 0);
        setSummary({ totalReceivables });
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
        <TouchableOpacity
          style={styles.dataRow}
          onPress={() => navigation.navigate("SaleDetail", { saleId: item.id })}
        >
          <Text style={styles.dataText}>TRX-{item.id}</Text>
          <Text style={styles.dataText}>Rp {(item.total || 0).toLocaleString("id-ID")}</Text>
        </TouchableOpacity>
      );
    }
    if (reportType === 'STOCK') {
      return (
        <TouchableOpacity
          style={styles.dataRow}
          onPress={() => navigation.navigate("ProductDetail", { product: item })}
        >
          <Text style={[styles.dataText, { flex: 2 }]}>{item.name}</Text>
          <Text style={styles.dataText}>{item.stock}</Text>
          <Text style={styles.dataText}>Rp {(item.asset_value || 0).toLocaleString("id-ID")}</Text>
        </TouchableOpacity>
      );
    }
    if (reportType === 'PROFIT') {
      return (
        <TouchableOpacity
          style={styles.dataRow}
          onPress={() => navigation.navigate("SaleDetail", { saleId: item.id })}
        >
          <Text style={styles.dataText}>TRX-{item.id}</Text>
          <Text style={[styles.dataText, { color: '#16A34A' }]}>Rp {(item.estimated_profit || 0).toLocaleString("id-ID")}</Text>
        </TouchableOpacity>
      );
    }
    if (reportType === 'PURCHASES') {
      return (
        <TouchableOpacity
          style={styles.dataRow}
          onPress={() => navigation.navigate("PurchaseForm", { addProductId: item.id })}
        >
          <Text style={styles.dataText}>TRX-{item.id}</Text>
          <Text style={styles.dataText}>Rp {(item.total || 0).toLocaleString("id-ID")}</Text>
        </TouchableOpacity>
      );
    }
    if (reportType === 'PAYABLES') {
      return (
        <TouchableOpacity
          style={styles.dataRow}
          onPress={() => navigation.navigate("Payables")}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dataText}>{item.supplier_name || 'Umum'}</Text>
            <Text style={{ fontSize: 10, color: '#6B7280' }}>TRX-{item.purchase_id}</Text>
          </View>
          <Text style={[styles.dataText, { color: '#EF4444' }]}>Rp {(item.amount || 0).toLocaleString("id-ID")}</Text>
        </TouchableOpacity>
      );
    }
    if (reportType === 'RECEIVABLES') {
      return (
        <TouchableOpacity
          style={styles.dataRow}
          onPress={() => navigation.navigate("Receivables")}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.dataText}>{item.customer_name || 'Umum'}</Text>
            <Text style={{ fontSize: 10, color: '#6B7280' }}>TRX-{item.sale_id}</Text>
          </View>
          <Text style={[styles.dataText, { color: '#EF4444' }]}>Rp {(item.amount || 0).toLocaleString("id-ID")}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View style={styles.container}>
        <Text style={styles.header}>📊 Laporan</Text>

        {/* Report Types */}
        <View style={styles.tabScrollContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {[
              { id: 'SALES', label: 'Penjualan' },
              { id: 'STOCK', label: 'Stok' },
              { id: 'PROFIT', label: 'Laba' },
              { id: 'PURCHASES', label: 'Pembelian' },
              { id: 'PAYABLES', label: 'Hutang' },
              { id: 'RECEIVABLES', label: 'Piutang' }
            ].map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tab, reportType === t.id && styles.activeTab]}
                onPress={() => setReportType(t.id as ReportType)}
              >
                <Text style={[styles.tabText, reportType === t.id && styles.activeTabText]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Date Filters */}
        <View style={styles.filters}>
          {['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filterType === f && styles.activeFilterBtn]}
              onPress={() => setFilterType(f as FilterType)}
            >
              <Text style={[styles.filterText, filterType === f && styles.activeFilterText]}>
                {f === 'DAILY' ? 'Hari' : f === 'WEEKLY' ? 'Mggu' : f === 'MONTHLY' ? 'Bln' : f === 'YEARLY' ? 'Thn' : 'Pilih'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filterType === 'CUSTOM' && (
          <View style={styles.customDateContainer}>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateLabel}>Dari:</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.dateInputGroup}>
              <Text style={styles.dateLabel}>Sampai:</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={loadReport}>
              <Text style={styles.applyBtnText}>Terapkan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total {reportType}</Text>
          <Text style={styles.summaryValue}>
            Rp {(summary.total || summary.totalAsset || summary.totalProfit || summary.totalPurchases || summary.totalPayables || summary.totalReceivables || 0).toLocaleString("id-ID")}
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
                <Text style={styles.headerCell}>{reportType === 'STOCK' ? 'Nama' : (reportType === 'PAYABLES' || reportType === 'RECEIVABLES') ? 'Pihak' : 'ID'}</Text>
                {reportType === 'STOCK' && <Text style={styles.headerCell}>Stok</Text>}
                <Text style={styles.headerCell}>{(reportType === 'PROFIT' || reportType === 'PAYABLES' || reportType === 'RECEIVABLES') ? 'Nilai' : 'Total'}</Text>
              </View>
            }
            style={styles.list}
          />
        )}
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
  customDateContainer: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 2,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: "#111827",
  },
  applyBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 4,
  },
  applyBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
