import { createDrawerNavigator } from "@react-navigation/drawer";
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

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: { backgroundColor: '#FFF' },
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#6B7280',
        drawerLabelStyle: { fontWeight: '600' }
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} options={{ title: '🏠 Dashboard' }} />
      <Drawer.Screen name="SalesTransaction" component={SalesTransactionScreen} options={{ title: '🛒 Transaksi Kasir' }} />
      <Drawer.Screen name="Product" component={ProductsScreen} options={{ title: '📦 Stok Barang' }} />
      <Drawer.Screen name="SalesHistory" component={SalesHistoryScreen} options={{ title: '🕒 Riwayat Transaksi' }} />
      <Drawer.Screen name="Reports" component={ReportsScreen} options={{ title: '📊 Laporan & Grafik' }} />
      <Drawer.Screen name="Pulsa" component={PulsaTransactionScreen} options={{ title: '📱 Transaksi Pulsa' }} />
      <Drawer.Screen name="Customers" component={CustomersScreen} options={{ title: '👥 Daftar Pelanggan' }} />
      <Drawer.Screen name="Receivables" component={ReceivablesScreen} options={{ title: '💰 Piutang Pelanggan' }} />
      <Drawer.Screen name="Payables" component={PayablesScreen} options={{ title: '💸 Hutang Supplier' }} />
      <Drawer.Screen name="Backup" component={BackupScreen} options={{ title: '💾 Backup & Restore' }} />
      <Drawer.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: '💳 Cara Bayar' }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ title: '⚙️ Pengaturan Toko' }} />
      <Drawer.Screen name="PurchaseForm" component={PurchaseFormScreen} options={{ title: '📥 Tambah Stok (Beli)' }} />
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
    </Drawer.Navigator>

  )
}