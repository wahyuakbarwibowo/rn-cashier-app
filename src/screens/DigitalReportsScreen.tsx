import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { getDigitalReports } from "../database/pulsa";

export default function DigitalReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [filter, setFilter] = useState<"today" | "month" | "year">("today");

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    const now = new Date();
    let start = "";
    let end = now.toISOString().split("T")[0];

    if (filter === "today") {
      start = end;
    } else if (filter === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    } else {
      start = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
    }

    const data = await getDigitalReports(start, end);
    setReportData(data);
    setLoading(false);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "PULSA": return "📱";
      case "PLN": return "⚡";
      case "TRANSFER": return "🏦";
      case "GAME": return "🎮";
      case "E-WALLET": return "💳";
      default: return "✨";
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Laporan Laba/Rugi Digital</Text>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["today", "month", "year"] as const).map((f) => (
          <TouchableOpacity 
            key={f} 
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "today" ? "Hari Ini" : f === "month" ? "Bulan Ini" : "Tahun Ini"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: "#111827" }]}>
          <Text style={styles.summaryLabel}>Total Penjualan</Text>
          <Text style={styles.summaryValue}>
            Rp {(reportData?.summary?.total_sales || 0).toLocaleString("id-ID")}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: "#16A34A" }]}>
          <Text style={styles.summaryLabel}>Total Keuntungan</Text>
          <Text style={styles.summaryValue}>
            Rp {(reportData?.summary?.total_profit || 0).toLocaleString("id-ID")}
          </Text>
        </View>
      </View>

      {/* Breakdown Section */}
      <Text style={styles.sectionTitle}>Breakdown Per Kategori</Text>
      {reportData?.byCategory?.length > 0 ? (
        reportData.byCategory.map((item: any, index: number) => (
          <View key={index} style={styles.breakdownItem}>
            <View style={styles.breakdownHeader}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
                <View>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.countText}>{item.count} Transaksi</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.breakdownProfit}>+ Rp {item.total_profit.toLocaleString("id-ID")}</Text>
                <Text style={styles.breakdownSales}>Omzet: Rp {item.total_sales.toLocaleString("id-ID")}</Text>
              </View>
            </View>
            <View style={styles.progressBg}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(item.total_profit / (reportData.summary.total_profit || 1)) * 100}%` }
                ]} 
              />
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tidak ada data untuk periode ini</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827", marginBottom: 20 },
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  filterBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  filterText: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
  filterTextActive: { color: '#FFF' },
  summaryGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16, elevation: 2 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 4 },
  summaryValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  breakdownItem: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { fontSize: 24 },
  categoryName: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  countText: { fontSize: 12, color: '#6B7280' },
  breakdownProfit: { fontSize: 15, fontWeight: 'bold', color: '#16A34A' },
  breakdownSales: { fontSize: 11, color: '#6B7280' },
  progressBg: { height: 6, backgroundColor: '#F3F4F6', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#16A34A' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#9CA3AF' }
});
