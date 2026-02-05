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
import ProductDetailScreen from "../screens/ProductDetailScreen";
import SalesTransactionScreen from "../screens/SalesTransactionScreen";
import SalesHistoryScreen from "../screens/SalesHistoryScreen";
import SaleDetailScreen from "../screens/SaleDetailScreen";
import ReportsScreen from "../screens/ReportsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import CustomersScreen from "../screens/CustomersScreen";
import PaymentMethodsScreen from "../screens/PaymentMethodsScreen";
import PulsaTransactionScreen from "../screens/PulsaTransactionScreen";
import ReceivablesScreen from "../screens/ReceivablesScreen";
import PayablesScreen from "../screens/PayablesScreen";
import BackupScreen from "../screens/BackupScreen";
import DashboardScreen from "../screens/DashboardScreen";
import SuppliersScreen from "../screens/SuppliersScreen";
import DigitalTransactionHistoryScreen from "../screens/DigitalTransactionHistoryScreen";
import DigitalTransactionDetailScreen from "../screens/DigitalTransactionDetailScreen";
import DigitalProductsMasterScreen from "../screens/DigitalProductsMasterScreen";
import DigitalCategoriesMasterScreen from "../screens/DigitalCategoriesMasterScreen";
import DigitalReportsScreen from "../screens/DigitalReportsScreen";
import ExpensesScreen from "../screens/ExpensesScreen";
import LowStockScreen from "../screens/LowStockScreen";
import ProfitLossScreen from "../screens/ProfitLossScreen";
import TopProductsScreen from "../screens/TopProductsScreen";
import { getShopProfile } from "../database/settings";

const Drawer = createDrawerNavigator<DrawerParamList>();

function CustomDrawerContent(props: any) {
  const { state, navigation } = props;
  const drawerStatus = useDrawerStatus();
  const [shopProfile, setShopProfile] = useState<{ name: string; cashier_name: string }>({
    name: "AMINMART",
    cashier_name: "Sistem Kasir"
  });

  useEffect(() => {
    if (drawerStatus === 'open') {
      loadProfile();
    }
  }, [drawerStatus]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profile = await getShopProfile();
    if (profile) {
      setShopProfile({
        name: profile.name || "KASIR KU",
        cashier_name: profile.cashier_name || "Kasir"
      });
    }
  };

  const isActive = (routeName: string) => {
    return state.routes[state.index].name === routeName;
  };

  const MenuItem = ({ name, label, icon }: { name: string, label: string, icon: string }) => (
    <DrawerItem
      label={`${icon}  ${label}`}
      focused={isActive(name)}
      onPress={() => navigation.navigate(name)}
      activeTintColor="#E11D48" // Rose 600
      inactiveTintColor="#64748b" // Slate 500
      activeBackgroundColor="#FFF1F2" // Rose 50
      labelStyle={[styles.drawerLabel, { fontWeight: isActive(name) ? '700' : '500' }]}
      style={styles.drawerItem}
    />
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <DrawerContentScrollView {...props} style={styles.drawerScroll}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerBrand} numberOfLines={1}>{shopProfile.name}</Text>
        <Text style={styles.drawerTagline} numberOfLines={1}>{shopProfile.cashier_name}</Text>
      </View>

      <MenuItem name="Dashboard" label="Dashboard" icon="🏠" />
      
      <SectionHeader title="PRODUK" />
      <MenuItem name="Product" label="Stok Barang" icon="📦" />
      <MenuItem name="TopProducts" label="Produk Terlaris" icon="🏆" />
      <MenuItem name="LowStock" label="Stok Tipis (Alert)" icon="⚠️" />
      <MenuItem name="PurchaseForm" label="Tambah Stok (Beli)" icon="📥" />
      <MenuItem name="DigitalProductsMaster" label="Produk Digital" icon="✨" />
      <MenuItem name="DigitalCategoriesMaster" label="Kategori Digital" icon="📁" />

      <SectionHeader title="TRANSAKSI" />
      <MenuItem name="SalesTransaction" label="Transaksi Kasir" icon="🛒" />
      <MenuItem name="SalesHistory" label="Riwayat Transaksi" icon="🕒" />
      <MenuItem name="Reports" label="Laporan & Grafik" icon="📊" />
      <MenuItem name="ProfitLoss" label="Laba Rugi (Profit)" icon="📈" />
      <MenuItem name="Pulsa" label="Transaksi Digital" icon="✨" />
      <MenuItem name="DigitalHistory" label="Riwayat Digital" icon="📜" />
      <MenuItem name="DigitalReports" label="Laporan Laba Digital" icon="📈" />
      <MenuItem name="Expenses" label="Pengeluaran (Operasional)" icon="💸" />

      <SectionHeader title="PELANGGAN & SUPPLIER" />
      <MenuItem name="Customers" label="Daftar Pelanggan" icon="👥" />
      <MenuItem name="Suppliers" label="Master Supplier" icon="🏭" />
      <MenuItem name="Receivables" label="Piutang Pelanggan" icon="💰" />
      <MenuItem name="Payables" label="Hutang Supplier" icon="💸" />

      <SectionHeader title="KONFIGURASI" />
      <MenuItem name="PaymentMethods" label="Cara Bayar" icon="💳" />
      <MenuItem name="Settings" label="Pengaturan Toko" icon="⚙️" />
      <MenuItem name="Backup" label="Backup & Restore" icon="💾" />

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
      <Drawer.Screen name="Pulsa" component={PulsaTransactionScreen} options={{ title: '✨ Transaksi Digital' }} />
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

      {/* Hidden Screens */}
      <Drawer.Screen 
        name="SaleDetail" 
        component={SaleDetailScreen} 
        options={{ 
          title: 'Detail Transaksi',
          drawerItemStyle: { display: 'none' } 
        }} 
      />
      <Drawer.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen} 
        options={{ 
          title: "Detail Product",
          drawerItemStyle: { display: 'none' } 
        }} 
      />

      <Drawer.Screen 
        name="DigitalDetail" 
        component={DigitalTransactionDetailScreen} 
        options={{ 
          title: "Detail Transaksi Digital",
          drawerItemStyle: { display: 'none' } 
        }} 
      />
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