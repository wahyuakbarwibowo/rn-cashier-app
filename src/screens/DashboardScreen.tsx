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
      {/* 1. Header & Daily Summary */}
      <View style={styles.headerDashboard}>
        <View style={styles.headerInfo}>
          <Text style={styles.todayDate}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <Text style={styles.welcomeText}>Halo, Selamat Berjualan! 👋</Text>
        </View>

        <TouchableOpacity
          style={styles.mainNetCard}
          onPress={() => navigation.navigate("ProfitLoss")}
        >
          <View>
            <Text style={styles.netLabel}>Estimasi Laba Hari Ini</Text>
            <Text style={styles.netValue}>
              Rp {((stats.todaySales || 0) - (stats.todayExpenses || 0)).toLocaleString("id-ID")}
            </Text>
          </View>
          <View style={styles.netIconBg}>
            <Text style={styles.netIcon}>📈</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.summaryRow}>
          <View style={styles.summaryStatItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Text style={styles.statIconSmall}>💰</Text>
            </View>
            <View>
              <Text style={styles.statLabelSmall}>Penjualan</Text>
              <Text style={styles.statValueSmall}>Rp {(stats.todaySales || 0).toLocaleString("id-ID")}</Text>
            </View>
          </View>
          <View style={styles.summaryStatItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FEF2F2' }]}>
              <Text style={styles.statIconSmall}>💸</Text>
            </View>
            <View>
              <Text style={styles.statLabelSmall}>Pengeluaran</Text>
              <Text style={[styles.statValueSmall, { color: '#EF4444' }]}>Rp {(stats.todayExpenses || 0).toLocaleString("id-ID")}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* 2. Quick Actions - HIGH PRIORITY */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: '#6366F1' }]}
            onPress={() => navigation.navigate("SalesTransaction")}
          >
            <Text style={styles.quickActionIcon}>🛒</Text>
            <Text style={styles.quickActionLabel}>Transaksi Kasir</Text>
            <Text style={styles.quickActionSub}>Jualan Barang Fisik</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: '#F59E0B' }]}
            onPress={() => navigation.navigate("Pulsa")}
          >
            <Text style={styles.quickActionIcon}>✨</Text>
            <Text style={styles.quickActionLabel}>Transaksi Digital</Text>
            <Text style={styles.quickActionSub}>Pulsa, Token, Tagihan</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Operational Alerts */}
        <View style={styles.alertsContainer}>
          <TouchableOpacity
            style={[styles.alertCard, { borderLeftColor: '#F59E0B' }]}
            onPress={() => navigation.navigate("LowStock")}
          >
            <Text style={styles.alertEmoji}>⚠️</Text>
            <View>
              <Text style={styles.alertTitle}>{stats.lowStockCount} Stok Tipis (Alert)</Text>
              <Text style={styles.alertSub}>Segera restok barang Anda</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Categorized Menus */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Manajemen & Laporan</Text>

          <View style={styles.menuGridNew}>
            <MenuCard
              title="Gudang Barang"
              icon="📦"
              color="#10B981"
              onPress={() => navigation.navigate("Product")}
              badge={stats.lowStockCount}
            />
            <MenuCard
              title="Barang Masuk"
              icon="📥"
              color="#8B5CF6"
              onPress={() => navigation.navigate("PurchaseForm")}
            />
            <MenuCard
              title="Riwayat Transaksi"
              icon="🕒"
              color="#64748B"
              onPress={() => navigation.navigate("SalesHistory")}
            />
            <MenuCard
              title="Laporan Penjualan"
              icon="📊"
              color="#3B82F6"
              onPress={() => navigation.navigate("Reports")}
            />
            <MenuCard
              title="Laba Rugi"
              icon="📈"
              color="#EC4899"
              onPress={() => navigation.navigate("ProfitLoss")}
            />
            <MenuCard
              title="Daftar Pelanggan"
              icon="👥"
              color="#6366F1"
              onPress={() => navigation.navigate("Customers")}
            />
          </View>
        </View>

        <View style={styles.extraSection}>
          <Text style={styles.sectionTitle}>Fitur Lainnya</Text>
          <View style={styles.extraGrid}>
            <TouchableOpacity style={styles.extraItem} onPress={() => navigation.navigate("Suppliers")}>
              <Text style={styles.extraIcon}>🏭</Text>
              <Text style={styles.extraText}>Master Supplier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.extraItem} onPress={() => navigation.navigate("Receivables")}>
              <Text style={styles.extraIcon}>💰</Text>
              <Text style={styles.extraText}>Piutang Pelanggan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.extraItem} onPress={() => navigation.navigate("Expenses")}>
              <Text style={styles.extraIcon}>💸</Text>
              <Text style={styles.extraText}>Pengeluaran (Operasional)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.extraItem} onPress={() => navigation.navigate("Backup")}>
              <Text style={styles.extraIcon}>💾</Text>
              <Text style={styles.extraText}>Backup & Restore</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
    backgroundColor: "#FB7185",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerInfo: {
    marginBottom: 20,
  },
  todayDate: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  welcomeText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
  },
  mainNetCard: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 24,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    marginBottom: 16,
  },
  netLabel: {
    color: "#FFF",
    fontSize: 14,
    opacity: 0.9,
    fontWeight: "600",
  },
  netValue: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  netIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  netIcon: {
    fontSize: 24,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryStatItem: {
    flex: 1,
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  statIconSmall: {
    fontSize: 16,
  },
  statLabelSmall: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  statValueSmall: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1E293B",
  },
  content: {
    paddingHorizontal: 20,
    marginTop: -40,
  },
  quickActionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  quickActionBtn: {
    flex: 1,
    padding: 20,
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionLabel: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "900",
  },
  quickActionSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  alertsContainer: {
    marginBottom: 24,
  },
  alertCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  alertEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  alertSub: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1E293B",
    marginBottom: 16,
    paddingLeft: 4,
  },
  menuGridNew: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  menuCard: {
    backgroundColor: "#FFF",
    width: (width - 52) / 2,
    padding: 20,
    borderRadius: 24,
    elevation: 2,
    borderBottomWidth: 4,
    borderBottomColor: "#F1F5F9",
  },
  menuIconContainer: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 28,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
  },
  extraSection: {
    backgroundColor: "#F1F5F9",
    padding: 20,
    marginHorizontal: -20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  extraGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  extraItem: {
    width: (width - 64) / 4,
    alignItems: "center",
  },
  extraIcon: {
    fontSize: 20,
    marginBottom: 6,
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 14,
    overflow: "hidden",
  },
  extraText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
    textAlign: "center",
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
