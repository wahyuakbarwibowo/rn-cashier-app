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
} from "react-native";
import { getDB } from "../database/initDB";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

const { width } = Dimensions.get("window");

type ReportData = {
  totalRevenue: number;
  totalCOGS: number;
  salesProfit: number;
  digitalProfit: number;
  totalExpenses: number;
  netProfit: number;
  totalReceivables: number;
  totalPayables: number;
};

export default function ProfitLossScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("month");
  const [data, setData] = useState<ReportData>({
    totalRevenue: 0,
    totalCOGS: 0,
    salesProfit: 0,
    digitalProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalReceivables: 0,
    totalPayables: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [period])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await getDB();

      let dateFilter = "";
      const now = new Date();

      if (period === "today") {
        const today = now.toISOString().split("T")[0];
        dateFilter = `created_at LIKE '${today}%'`;
      } else if (period === "week") {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        dateFilter = `created_at >= '${lastWeek}'`;
      } else if (period === "month") {
        const thisMonth = now.toISOString().slice(0, 7);
        dateFilter = `created_at LIKE '${thisMonth}%'`;
      } else if (period === "year") {
        const thisYear = now.getFullYear();
        dateFilter = `created_at LIKE '${thisYear}%'`;
      }

      // 1. Sales & COGS
      const salesQuery = `
        SELECT 
          SUM(si.qty * si.price) as revenue,
          SUM(si.qty * p.purchase_price) as cogs
        FROM sales_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.${dateFilter}
      `;
      const salesRes = await db.getFirstAsync<{ revenue: number; cogs: number }>(salesQuery);

      // 2. Digital Profit
      const digitalQuery = `
        SELECT SUM(profit) as profit 
        FROM phone_history 
        WHERE ${dateFilter}
      `;
      const digitalRes = await db.getFirstAsync<{ profit: number }>(digitalQuery);

      // 3. Expenses
      const expenseQuery = `
        SELECT SUM(amount) as total 
        FROM expenses 
        WHERE ${dateFilter}
      `;
      const expenseRes = await db.getFirstAsync<{ total: number }>(expenseQuery);

      // 4. Payables (Hutang ke Supplier)
      const payablesQuery = `
        SELECT SUM(amount) as total 
        FROM payables p
        JOIN purchases pur ON p.purchase_id = pur.id
        WHERE pur.${dateFilter} AND p.status = 'pending'
      `;
      const payablesRes = await db.getFirstAsync<{ total: number }>(payablesQuery);

      // 5. Receivables (Piutang Pelanggan)
      const receivablesQuery = `
        SELECT SUM(amount) as total 
        FROM receivables r
        JOIN sales s ON r.sale_id = s.id
        WHERE s.${dateFilter} AND r.status = 'pending'
      `;
      const receivablesRes = await db.getFirstAsync<{ total: number }>(receivablesQuery);

      const rev = salesRes?.revenue || 0;
      const cogs = salesRes?.cogs || 0;
      const sProf = rev - cogs;
      const dProf = digitalRes?.profit || 0;
      const exp = expenseRes?.total || 0;

      setData({
        totalRevenue: rev,
        totalCOGS: cogs,
        salesProfit: sProf,
        digitalProfit: dProf,
        totalExpenses: exp,
        netProfit: (sProf + dProf) - exp,
        totalReceivables: receivablesRes?.total || 0,
        totalPayables: payablesRes?.total || 0,
      });

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

  const formatIDR = (num: number) => {
    return "Rp " + Math.round(num).toLocaleString("id-ID");
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

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <PeriodButton type="today" label="Hari Ini" />
        <PeriodButton type="week" label="7 Hari" />
        <PeriodButton type="month" label="Bulan Ini" />
        <PeriodButton type="year" label="Tahun Ini" />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FB7185" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Net Profit Card (Hero) */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Laba Bersih Akhir</Text>
              <Text style={styles.heroValue}>{formatIDR(data.netProfit)}</Text>
              <View style={styles.heroDecoration} />
            </View>

            {/* Breakdown Sections */}
            <Text style={styles.sectionTitle}>RINCIAN PENDAPATAN</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Penjualan Produk (Omset)</Text>
                <Text style={styles.value}>{formatIDR(data.totalRevenue)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Modal Produk (HPP)</Text>
                <Text style={[styles.value, { color: "#E11D48" }]}>- {formatIDR(data.totalCOGS)}</Text>
              </View>
              <View style={[styles.row, styles.borderTop]}>
                <Text style={styles.boldLabel}>Laba Kotor Produk</Text>
                <Text style={styles.boldValue}>{formatIDR(data.salesProfit)}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Laba Bersih Produk Digital</Text>
                <Text style={styles.value}>{formatIDR(data.digitalProfit)}</Text>
              </View>
              <View style={[styles.row, styles.borderTop]}>
                <Text style={styles.boldLabel}>Total Laba Kotor</Text>
                <Text style={[styles.boldValue, { color: "#10B981" }]}>
                  {formatIDR(data.salesProfit + data.digitalProfit)}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>PENGELUARAN & BEBAN</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Beban Operasional</Text>
                <Text style={[styles.value, { color: "#E11D48" }]}>{formatIDR(data.totalExpenses)}</Text>
              </View>
              <View style={[styles.row, styles.borderTop]}>
                <Text style={styles.boldLabel}>Total Pengeluaran</Text>
                <Text style={[styles.boldValue, { color: "#E11D48" }]}>{formatIDR(data.totalExpenses)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>POSISI PIUTANG & HUTANG (BELUM LUNAS)</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.label}>Piutang Pelanggan (Uang di Orang)</Text>
                <Text style={[styles.value, { color: "#3B82F6" }]}>{formatIDR(data.totalReceivables)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Hutang Supplier (Tagihan ke Toko)</Text>
                <Text style={[styles.value, { color: "#F59E0B" }]}>{formatIDR(data.totalPayables)}</Text>
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                * Laba Bersih = (Laba Produk + Laba Digital) - Pengeluaran.
              </Text>
              <Text style={styles.infoText}>
                * HPP dihitung berdasarkan harga modal produk saat ini.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: "#FB7185",
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  heroLabel: {
    color: "#FFF",
    opacity: 0.9,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  heroValue: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
  },
  heroDecoration: {
    position: "absolute",
    right: -20,
    bottom: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FDA4AF",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    marginTop: 4,
    paddingTop: 12,
  },
  label: {
    fontSize: 14,
    color: "#6B7280",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  boldLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  boldValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#3B82F6",
  },
  infoBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#FFF5F7",
    borderRadius: 12,
  },
  infoText: {
    fontSize: 11,
    color: "#FB7185",
    fontStyle: "italic",
    marginBottom: 4,
  },
});
