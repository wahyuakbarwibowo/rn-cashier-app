import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  InteractionManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getDB } from "../database/initDB";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayExpenses: 0,
    lowStockCount: 0,
    totalCustomers: 0,
    pendingReceivables: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const db = await getDB();
      const today = new Date().toISOString().split("T")[0];

      // Jalankan query secara paralel untuk efisiensi
      const [salesRes, expenseRes, stockRes, customerRes, receivableRes] = await Promise.all([
        db.getFirstAsync<{ total: number }>("SELECT SUM(total) as total FROM sales WHERE created_at LIKE ?", [`${today}%`]),
        db.getFirstAsync<{ total: number }>("SELECT SUM(amount) as total FROM expenses WHERE created_at LIKE ?", [`${today}%`]),
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE stock < 10"),
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM customers"),
        db.getFirstAsync<{ total: number }>("SELECT SUM(amount) as total FROM receivables WHERE status = 'pending'")
      ]);

      setStats({
        todaySales: salesRes?.total || 0,
        todayExpenses: expenseRes?.total || 0,
        lowStockCount: stockRes?.count || 0,
        totalCustomers: customerRes?.count || 0,
        pendingReceivables: receivableRes?.total || 0,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadStats();
    });

    const unsubscribe = navigation.addListener("focus", () => {
      InteractionManager.runAfterInteractions(() => {
        loadStats();
      });
    });

    return () => {
      task.cancel();
      unsubscribe();
    };
  }, [navigation]);


  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const MenuCard = ({ title, icon, color, onPress, badge }: any) => (
    <TouchableOpacity
      style={[styles.menuCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={styles.menuIconContainer}>
        <Text style={[styles.menuIcon, { color }]}>{icon}</Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Summary - Premium Pink & White */}
      <View style={styles.headerDashboard}>
        <TouchableOpacity 
          style={styles.mainNetCard}
          onPress={() => navigation.navigate("ProfitLoss")}
        >
          <Text style={styles.netLabel}>Total Pendapatan Bersih (Hari Ini)</Text>
          <Text style={styles.netValue}>
            Rp {(stats.todaySales - stats.todayExpenses).toLocaleString("id-ID")}
          </Text>
          <View style={styles.netDecoration} />
        </TouchableOpacity>

        <View style={styles.summaryRow}>
          <View style={[styles.miniCard, { backgroundColor: "#FFF1F2" }]}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 16 }}>📈</Text>
            </View>
            <View>
              <Text style={styles.miniLabel}>Penjualan</Text>
              <Text style={styles.miniValue}>
                Rp {stats.todaySales.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>

          <View style={[styles.miniCard, { backgroundColor: "#FFF" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "#FEF2F2" }]}>
              <Text style={{ fontSize: 16 }}>📉</Text>
            </View>
            <View>
              <Text style={styles.miniLabel}>Pengeluaran</Text>
              <Text style={[styles.miniValue, { color: "#E11D48" }]}>
                Rp {stats.todayExpenses.toLocaleString("id-ID")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => navigation.navigate("LowStock")}
          >
            <Text style={styles.statIcon}>⚠️</Text>
            <View>
              <Text style={styles.statValue}>{stats.lowStockCount}</Text>
              <Text style={styles.statLabel}>Stok Rendah</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.statBox}>
            <Text style={styles.statIcon}>👥</Text>
            <View>
              <Text style={styles.statValue}>{stats.totalCustomers}</Text>
              <Text style={styles.statLabel}>Pelanggan</Text>
            </View>
          </View>
        </View>

        {/* PRODUK Section */}
        <Text style={styles.sectionTitle}>PRODUK</Text>
        <View style={styles.menuGrid}>
          <MenuCard
            title="Stok Barang"
            icon="📦"
            color="#10B981"
            onPress={() => navigation.navigate("Product")}
            badge={stats.lowStockCount}
          />
          <MenuCard
            title="Produk Terlaris"
            icon="🏆"
            color="#FB7185"
            onPress={() => navigation.navigate("TopProducts")}
          />
          <MenuCard
            title="Stok Tipis"
            icon="⚠️"
            color="#F59E0B"
            onPress={() => navigation.navigate("LowStock")}
          />
        </View>

        {/* TRANSAKSI Section */}
        <Text style={styles.sectionTitle}>TRANSAKSI</Text>
        <View style={styles.menuGrid}>
          <MenuCard
            title="Transaksi Kasir"
            icon="🛒"
            color="#3B82F6"
            onPress={() => navigation.navigate("SalesTransaction")}
          />
          <MenuCard
            title="Riwayat"
            icon="🕒"
            color="#6B7280"
            onPress={() => navigation.navigate("SalesHistory")}
          />
          <MenuCard
            title="Laba Rugi"
            icon="📈"
            color="#FB7185"
            onPress={() => navigation.navigate("ProfitLoss")}
          />
          <MenuCard
            title="Laporan"
            icon="📊"
            color="#8B5CF6"
            onPress={() => navigation.navigate("Reports")}
          />
          <MenuCard
            title="Digital"
            icon="✨"
            color="#F59E0B"
            onPress={() => navigation.navigate("Pulsa")}
          />
          <MenuCard
            title="Riwayat Digital"
            icon="📜"
            color="#10B981"
            onPress={() => navigation.navigate("DigitalHistory")}
          />
          <MenuCard
            title="Laba Digital"
            icon="📈"
            color="#EC4899"
            onPress={() => navigation.navigate("DigitalReports")}
          />
          <MenuCard
            title="Pengeluaran"
            icon="💸"
            color="#EF4444"
            onPress={() => navigation.navigate("Expenses")}
          />
        </View>

        {/* PELANGGAN & SUPPLIER Section */}
        <Text style={styles.sectionTitle}>PELANGGAN & SUPPLIER</Text>
        <View style={styles.menuGrid}>
          <MenuCard
            title="Pelanggan"
            icon="👥"
            color="#6366F1"
            onPress={() => navigation.navigate("Customers")}
          />
          <MenuCard
            title="Supplier"
            icon="🏭"
            color="#8B5CF6"
            onPress={() => navigation.navigate("Suppliers")}
          />
          <MenuCard
            title="Piutang"
            icon="💰"
            color="#EF4444"
            onPress={() => navigation.navigate("Receivables")}
          />
          <MenuCard
            title="Hutang Supplier"
            icon="💸"
            color="#F43F5E"
            onPress={() => navigation.navigate("Payables")}
          />
        </View>

        {/* KONFIGURASI Section */}
        <Text style={styles.sectionTitle}>KONFIGURASI</Text>
        <View style={styles.menuGrid}>
          <MenuCard
            title="Cara Bayar"
            icon="💳"
            color="#14B8A6"
            onPress={() => navigation.navigate("PaymentMethods")}
          />
          <MenuCard
            title="Pengaturan"
            icon="⚙️"
            color="#4B5563"
            onPress={() => navigation.navigate("Settings")}
          />
          <MenuCard
            title="Backup"
            icon="💾"
            color="#111827"
            onPress={() => navigation.navigate("Backup")}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerDashboard: {
    backgroundColor: "#FFF5F7",
    paddingTop: 16,
    paddingBottom: 50, // Reduced from 70
    paddingHorizontal: 16,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 3,
    shadowColor: "#F43F5E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  mainNetCard: {
    backgroundColor: "#FB7185",
    padding: 20,
    borderRadius: 20,
    marginBottom: 12, // Reduced from 16
    position: "relative",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  netLabel: {
    color: "#FFF",
    opacity: 0.9,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  netValue: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
  },
  netDecoration: {
    position: "absolute",
    right: -20,
    bottom: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  miniCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12, // Compact
    borderRadius: 14,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "rgba(251, 113, 133, 0.1)",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#9CA3AF",
    textTransform: "uppercase",
  },
  miniValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  summaryLabel: {
    color: "#E5E7EB",
    fontSize: 14,
    marginBottom: 8,
  },
  summaryValue: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10, // Reduced from 16
    marginTop: -30, // Adjusted overlap for tighter look
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: "#FFF",
    width: (width - 42) / 2, // Adjusted for better horizontal fit
    padding: 14,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#E11D48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: "#FFF1F2",
  },
  statIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuCard: {
    backgroundColor: "#FFF",
    width: (width - 48) / 2,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIconContainer: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 32,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});
