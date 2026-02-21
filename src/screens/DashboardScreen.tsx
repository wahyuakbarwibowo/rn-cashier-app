import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  RefreshControl,
  InteractionManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getDB } from "../database/initDB";
import {
  Card,
  Text,
  Badge,
  TouchableRipple,
  Surface,
  IconButton,
  Avatar
} from "react-native-paper";

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
    <Card
      style={[styles.menuCard, { borderLeftColor: color, borderLeftWidth: 4 }]}
      onPress={onPress}
      mode="elevated"
    >
      <Card.Content style={styles.menuIconContainer}>
        <Text style={[styles.menuIcon, { color }]}>{icon}</Text>
        {badge > 0 && (
          <Badge size={20} style={styles.paperBadge}>{badge}</Badge>
        )}
      </Card.Content>
      <Card.Title
        title={title}
        titleStyle={[styles.menuTitle, { fontSize: 13 }]}
        style={{ minHeight: 40 }}
      />
    </Card>
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
          <Text variant="labelMedium" style={styles.todayDate}>
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text variant="headlineSmall" style={styles.welcomeText}>Halo, Selamat Berjualan! 👋</Text>
        </View>

        <Surface elevation={0} style={styles.surfaceCard}>
          <TouchableRipple
            onPress={() => navigation.navigate("ProfitLoss")}
            rippleColor="rgba(255, 255, 255, .32)"
            style={styles.mainNetCardRipple}
          >
            <View style={styles.mainNetCardContent}>
              <View>
                <Text variant="labelLarge" style={styles.netLabel}>Estimasi Laba Hari Ini</Text>
                <Text variant="displaySmall" style={styles.netValue}>
                  Rp {((stats.todaySales || 0) - (stats.todayExpenses || 0)).toLocaleString("id-ID")}
                </Text>
              </View>
              <Avatar.Icon size={48} icon="trending-up" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} color="white" />
            </View>
          </TouchableRipple>
        </Surface>

        <View style={styles.summaryRow}>
          <Surface elevation={1} style={styles.summaryStatItem}>
            <Avatar.Text size={36} label="💰" style={{ backgroundColor: '#ECFDF5' }} labelStyle={{ fontSize: 16 }} />
            <View style={{ marginLeft: 10 }}>
              <Text variant="labelSmall" style={styles.statLabelSmall}>Penjualan</Text>
              <Text variant="titleSmall" style={styles.statValueSmall}>Rp {(stats.todaySales || 0).toLocaleString("id-ID")}</Text>
            </View>
          </Surface>
          <Surface elevation={1} style={styles.summaryStatItem}>
            <Avatar.Text size={36} label="💸" style={{ backgroundColor: '#FEF2F2' }} labelStyle={{ fontSize: 16 }} />
            <View style={{ marginLeft: 10 }}>
              <Text variant="labelSmall" style={styles.statLabelSmall}>Pengeluaran</Text>
              <Text variant="titleSmall" style={[styles.statValueSmall, { color: '#EF4444' }]}>Rp {(stats.todayExpenses || 0).toLocaleString("id-ID")}</Text>
            </View>
          </Surface>
        </View>
      </View>

      <View style={styles.content}>
        {/* 2. Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Surface elevation={4} style={[styles.quickActionSurface, { backgroundColor: '#6366F1' }]}>
            <TouchableRipple
              onPress={() => navigation.navigate("SalesTransaction")}
              style={styles.quickActionRipple}
            >
              <View>
                <Text style={styles.quickActionIcon}>🛒</Text>
                <Text variant="titleMedium" style={styles.quickActionLabel}>Transaksi Kasir</Text>
                <Text variant="labelSmall" style={styles.quickActionSub}>Jualan Barang Fisik</Text>
              </View>
            </TouchableRipple>
          </Surface>

          <Surface elevation={4} style={[styles.quickActionSurface, { backgroundColor: '#F59E0B' }]}>
            <TouchableRipple
              onPress={() => navigation.navigate("DigitalTransaction")}
              style={styles.quickActionRipple}
            >
              <View>
                <Text style={styles.quickActionIcon}>✨</Text>
                <Text variant="titleMedium" style={styles.quickActionLabel}>Transaksi Digital</Text>
                <Text variant="labelSmall" style={styles.quickActionSub}>Pulsa, Token, Tagihan</Text>
              </View>
            </TouchableRipple>
          </Surface>
        </View>

        {/* 3. Operational Alerts */}
        <View style={styles.alertsContainer}>
          <Card style={styles.alertCardPaper} onPress={() => navigation.navigate("LowStock")}>
            <Card.Title
              title={`${stats.lowStockCount} Stok Tipis (Alert)`}
              subtitle="Segera restok barang Anda"
              left={(props) => <Avatar.Text {...props} label="⚠️" style={{ backgroundColor: 'transparent' }} labelStyle={{ fontSize: 24 }} />}
              titleStyle={styles.alertTitle}
              subtitleStyle={styles.alertSub}
            />
          </Card>
        </View>

        {/* 4. Categorized Menus */}
        <View style={styles.menuSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Manajemen & Laporan</Text>

          <View style={styles.menuGridNew}>
            <MenuCard
              title="Gudang Barang"
              icon="📦"
              color="#10B981"
              onPress={() => navigation.navigate("Product")}
              badge={stats.lowStockCount}
            />
            <MenuCard
              title="Tambah Produk"
              icon="➕"
              color="#0EA5E9"
              onPress={() => navigation.navigate("ProductForm")}
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
              title="Riwayat Digital"
              icon="📜"
              color="#F59E0B" // Using orange to differentiate from sales history
              onPress={() => navigation.navigate("DigitalHistory")}
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

        <Surface elevation={0} style={styles.extraSectionPaper}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Fitur Lainnya</Text>
          <View style={styles.extraGrid}>
            {[
              { label: "Master Supplier", icon: "🏭", route: "Suppliers" },
              { label: "Piutang Pelanggan", icon: "💰", route: "Receivables" },
              { label: "Pengeluaran", icon: "💸", route: "Expenses" },
              { label: "Backup & Restore", icon: "💾", route: "Backup" },
            ].map((item, idx) => (
              <TouchableRipple
                key={idx}
                onPress={() => navigation.navigate(item.route as any)}
                style={styles.extraItemRipple}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.extraIcon}>{item.icon}</Text>
                  <Text variant="labelSmall" style={styles.extraText}>{item.label}</Text>
                </View>
              </TouchableRipple>
            ))}
          </View>
        </Surface>

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
  quickActionSurface: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  quickActionRipple: {
    padding: 20,
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
  alertCardPaper: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    elevation: 4,
    borderLeftWidth: 6,
    borderLeftColor: '#F59E0B',
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1E293B",
  },
  alertSub: {
    fontSize: 12,
    color: "#64748B",
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
    borderRadius: 24,
    elevation: 2,
  },
  menuIconContainer: {
    paddingBottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: 28,
  },
  menuTitle: {
    fontWeight: "800",
    color: "#334155",
  },
  extraSectionPaper: {
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
  extraItemRipple: {
    width: (width - 64) / 4,
    borderRadius: 14,
    paddingVertical: 8,
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
  paperBadge: {
    backgroundColor: "#EF4444",
    position: 'absolute',
    top: 5,
    right: 5,
  },
  surfaceCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  mainNetCardRipple: {
    padding: 24,
  },
  mainNetCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  netLabel: {
    color: "#FFF",
    opacity: 0.9,
    fontWeight: "600",
  },
  netValue: {
    color: "#FFF",
    fontWeight: "900",
    marginTop: 4,
  },
});
