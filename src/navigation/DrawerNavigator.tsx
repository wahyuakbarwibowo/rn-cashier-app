import React, { useState, useEffect } from "react";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  useDrawerStatus
} from "@react-navigation/drawer";
import { View, Text, StyleSheet } from "react-native";
import { DrawerParamList } from "./types";
import ProductsScreen from "../screens/ProductsScreen";
import PurchaseFormScreen from "../screens/PurchaseFormScreen";
import SalesTransactionScreen from "../screens/SalesTransactionScreen";
import SalesHistoryScreen from "../screens/SalesHistoryScreen";
import ReportsScreen from "../screens/ReportsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import CustomersScreen from "../screens/CustomersScreen";
import PaymentMethodsScreen from "../screens/PaymentMethodsScreen";
import DigitalTransactionScreen from "../screens/DigitalTransactionScreen";
import ReceivablesScreen from "../screens/ReceivablesScreen";
import PayablesScreen from "../screens/PayablesScreen";
import BackupScreen from "../screens/BackupScreen";
import DashboardScreen from "../screens/DashboardScreen";
import SuppliersScreen from "../screens/SuppliersScreen";
import DigitalTransactionHistoryScreen from "../screens/DigitalTransactionHistoryScreen";
import DigitalProductsMasterScreen from "../screens/DigitalProductsMasterScreen";
import DigitalCategoriesMasterScreen from "../screens/DigitalCategoriesMasterScreen";
import DigitalReportsScreen from "../screens/DigitalReportsScreen";
import ExpensesScreen from "../screens/ExpensesScreen";
import LowStockScreen from "../screens/LowStockScreen";
import ProfitLossScreen from "../screens/ProfitLossScreen";
import TopProductsScreen from "../screens/TopProductsScreen";
import { getShopProfile } from "../database/settings";
import ProductFormScreen from "../screens/ProductFormScreen";

const Drawer = createDrawerNavigator<DrawerParamList>();

// Move components outside and use React.memo to prevent unnecessary re-renders
const MenuItem = React.memo(({ name, label, icon, focused, onNavigate }: {
  name: string,
  label: string,
  icon: string,
  focused: boolean,
  onNavigate: (name: string) => void
}) => (
  <DrawerItem
    label={`${icon}  ${label}`}
    focused={focused}
    onPress={() => onNavigate(name)}
    activeTintColor="#E11D48" // Rose 600
    inactiveTintColor="#64748b" // Slate 500
    activeBackgroundColor="#FFF1F2" // Rose 50
    labelStyle={[styles.drawerLabel, { fontWeight: focused ? '700' : '500' }]}
    style={styles.drawerItem}
  />
));

const SectionHeader = React.memo(({ title }: { title: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
  </View>
));

function CustomDrawerContent(props: any) {
  const { state, navigation } = props;
  const [shopProfile, setShopProfile] = useState<{ name: string, cashier_name: string }>({
    name: "AMINMART",
    cashier_name: "Sistem Kasir"
  });

  // Load profile only once or when focused, rather than on every drawer status change
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      const profile = await getShopProfile();
      if (profile && isMounted) {
        setShopProfile({
          name: profile.name || "KASIR KU",
          cashier_name: profile.cashier_name || "Kasir"
        });
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const currentRouteName = state.routes[state.index].name;

  // Memoized navigation handler
  const handleNavigate = React.useCallback((name: string) => {
    navigation.navigate(name);
  }, [navigation]);

  return (
    <DrawerContentScrollView {...props} style={styles.drawerScroll} scrollEnabled={true}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerBrand} numberOfLines={1}>{shopProfile.name}</Text>
        <Text style={styles.drawerTagline} numberOfLines={1}>{shopProfile.cashier_name}</Text>
      </View>

      <MenuItem
        name="Dashboard"
        label="Dashboard"
        icon="🏠"
        focused={currentRouteName === "Dashboard"}
        onNavigate={handleNavigate}
      />

      <SectionHeader title="TRANSAKSI UTAMA" />
      <MenuItem name="SalesTransaction" label="Transaksi Kasir" icon="🛒" focused={currentRouteName === "SalesTransaction"} onNavigate={handleNavigate} />
      <MenuItem name="SalesHistory" label="Riwayat Kasir" icon="🕒" focused={currentRouteName === "SalesHistory"} onNavigate={handleNavigate} />
      <MenuItem name="DigitalTransaction" label="Transaksi Digital" icon="✨" focused={currentRouteName === "DigitalTransaction"} onNavigate={handleNavigate} />
      <MenuItem name="DigitalHistory" label="Riwayat Digital" icon="📜" focused={currentRouteName === "DigitalHistory"} onNavigate={handleNavigate} />

      <SectionHeader title="MANAJEMEN STOK" />
      <MenuItem name="Product" label="Gudang Barang" icon="📦" focused={currentRouteName === "Product"} onNavigate={handleNavigate} />
      <MenuItem name="ProductForm" label="Tambah Produk" icon="➕" focused={currentRouteName === "ProductForm"} onNavigate={handleNavigate} />
      <MenuItem name="PurchaseForm" label="Barang Masuk" icon="📥" focused={currentRouteName === "PurchaseForm"} onNavigate={handleNavigate} />
      <MenuItem name="LowStock" label="Stok Tipis (Alert)" icon="⚠️" focused={currentRouteName === "LowStock"} onNavigate={handleNavigate} />
      <MenuItem name="DigitalProductsMaster" label="Gudang Digital" icon="✨" focused={currentRouteName === "DigitalProductsMaster"} onNavigate={handleNavigate} />
      <MenuItem name="DigitalCategoriesMaster" label="Kategori Digital" icon="📁" focused={currentRouteName === "DigitalCategoriesMaster"} onNavigate={handleNavigate} />

      <SectionHeader title="Informasi Pelanggan & Supplier" />
      <MenuItem name="Customers" label="Daftar Pelanggan" icon="👥" focused={currentRouteName === "Customers"} onNavigate={handleNavigate} />
      <MenuItem name="Suppliers" label="Master Supplier" icon="🏭" focused={currentRouteName === "Suppliers"} onNavigate={handleNavigate} />
      <MenuItem name="Receivables" label="Piutang Pelanggan" icon="💰" focused={currentRouteName === "Receivables"} onNavigate={handleNavigate} />
      <MenuItem name="Payables" label="Hutang Supplier" icon="💸" focused={currentRouteName === "Payables"} onNavigate={handleNavigate} />

      <SectionHeader title="LAPORAN & GRAFIK" />
      <MenuItem name="Reports" label="Laporan Penjualan" icon="📊" focused={currentRouteName === "Reports"} onNavigate={handleNavigate} />
      <MenuItem name="ProfitLoss" label="Laba Rugi" icon="📈" focused={currentRouteName === "ProfitLoss"} onNavigate={handleNavigate} />
      <MenuItem name="TopProducts" label="Produk Terlaris" icon="🏆" focused={currentRouteName === "TopProducts"} onNavigate={handleNavigate} />
      <MenuItem name="DigitalReports" label="Laporan Laba Digital" icon="📈" focused={currentRouteName === "DigitalReports"} onNavigate={handleNavigate} />
      <MenuItem name="Expenses" label="Pengeluaran (Operasional)" icon="💸" focused={currentRouteName === "Expenses"} onNavigate={handleNavigate} />

      <SectionHeader title="PENGATURAN" />
      <MenuItem name="PaymentMethods" label="Cara Bayar" icon="💳" focused={currentRouteName === "PaymentMethods"} onNavigate={handleNavigate} />
      <MenuItem name="Settings" label="Pengaturan Toko" icon="⚙️" focused={currentRouteName === "Settings"} onNavigate={handleNavigate} />
      <MenuItem name="Backup" label="Backup & Restore" icon="💾" focused={currentRouteName === "Backup"} onNavigate={handleNavigate} />

      <View style={{ height: 20 }} />
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#FFF' },
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#6B7280',
        drawerLabelStyle: { fontWeight: '600' }
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: '🏠 Dashboard' }} />

      {/* 1. Produk */}
      <Drawer.Screen name="Product" component={ProductsScreen} options={{ title: '📦 Stok Barang' }} />
      <Drawer.Screen name="ProductForm" component={ProductFormScreen} options={{ title: '➕ Tambah Produk' }} />
      <Drawer.Screen name="TopProducts" component={TopProductsScreen} options={{ title: '🏆 Produk Terlaris' }} />
      <Drawer.Screen name="LowStock" component={LowStockScreen} options={{ title: '⚠️ Stok Tipis' }} />
      <Drawer.Screen name="PurchaseForm" component={PurchaseFormScreen} options={{ title: '📥 Tambah Stok (Beli)' }} />
      <Drawer.Screen name="DigitalProductsMaster" component={DigitalProductsMasterScreen} options={{ title: '✨ Produk Digital' }} />
      <Drawer.Screen name="DigitalCategoriesMaster" component={DigitalCategoriesMasterScreen} options={{ title: '📁 Kategori Digital' }} />

      {/* 2. Transaksi */}
      <Drawer.Screen name="SalesTransaction" component={SalesTransactionScreen} options={{ title: '🛒 Transaksi Kasir' }} />
      <Drawer.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: '🕒 Riwayat Transaksi' }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: '📊 Laporan & Grafik' }} />
      <Drawer.Screen name="ProfitLoss" component={ProfitLossScreen} options={{ title: '📈 Laba Rugi' }} />
      <Drawer.Screen name="DigitalTransaction" component={DigitalTransactionScreen} options={{ title: '✨ Transaksi Digital' }} />
      <Drawer.Screen name="DigitalHistory" component={DigitalTransactionHistoryScreen} options={{ title: '📜 Riwayat Transaksi Digital' }} />
      <Drawer.Screen name="DigitalReports" component={DigitalReportsScreen} options={{ title: '📈 Laporan Laba Digital' }} />
      <Drawer.Screen name="Expenses" component={ExpensesScreen} options={{ title: '💸 Pengeluaran (Operasional)' }} />

      {/* 3. Pelanggan & Supplier */}
      <Drawer.Screen name="Customers" component={CustomersScreen} options={{ title: '👥 Daftar Pelanggan' }} />
      <Drawer.Screen name="Suppliers" component={SuppliersScreen} options={{ title: '🏭 Master Supplier' }} />
      <Drawer.Screen name="Receivables" component={ReceivablesScreen} options={{ title: '💰 Piutang Pelanggan' }} />
      <Drawer.Screen name="Payables" component={PayablesScreen} options={{ title: '💸 Hutang Supplier' }} />

      {/* 4. Cara Bayar */}
      <Drawer.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: '💳 Cara Bayar' }} />

      {/* 5. Pengaturan & Backup */}
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: '⚙️ Pengaturan Toko' }} />
      <Drawer.Screen name="Backup" component={BackupScreen} options={{ title: '💾 Backup & Restore' }} />
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  drawerScroll: {
    backgroundColor: '#FFF',
  },
  drawerHeader: {
    padding: 24,
    backgroundColor: "#FB7185", // Rose 400 (Match Dashboard)
    marginBottom: 10,
    marginTop: -5,
  },
  drawerBrand: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  drawerTagline: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FDA4AF", // Rose 300
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  drawerItem: {
    marginVertical: 2,
    marginHorizontal: 12,
    borderRadius: 12,
  },
  drawerLabel: {
    fontSize: 14,
    marginLeft: -10,
  },
});
