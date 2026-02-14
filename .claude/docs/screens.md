# Screens Reference

All screens are flat drawer routes defined in `DrawerNavigator.tsx`. No nested stacks.

## Dashboard
- **DashboardScreen** (`Dashboard`) - Overview with key metrics and quick navigation

## Transaksi Utama (Core Transactions)
- **SalesTransactionScreen** (`SalesTransaction`) - POS cashier with barcode scanner, package pricing, date picker (backdate support)
- **SalesHistoryScreen** (`SalesHistory`) - Sales history with date range filter
- **SaleDetailScreen** (`SaleDetail`) - Sale detail view with receipt printing (hidden drawer item)
- **PulsaTransactionScreen** (`Pulsa`) - Digital product transactions (Pulsa, PLN, E-Wallet, BPJS, Transfer Bank, Game)
- **DigitalTransactionHistoryScreen** (`DigitalHistory`) - Digital transaction history
- **DigitalTransactionDetailScreen** (`DigitalDetail`) - Digital transaction detail with edit capability (hidden drawer item)

## Manajemen Stok (Stock Management)
- **ProductsScreen** (`Product`) - Product inventory with barcode scanner, keyboard avoidance
- **ProductDetailScreen** (`ProductDetail`) - Product detail with edit/delete (hidden drawer item)
- **PurchaseFormScreen** (`PurchaseForm`) - Stock purchase entry (barang masuk)
- **LowStockScreen** (`LowStock`) - Low stock alerts with threshold-based warnings
- **DigitalProductsMasterScreen** (`DigitalProductsMaster`) - Digital product master data per category & provider
- **DigitalCategoriesMasterScreen** (`DigitalCategoriesMaster`) - Dynamic digital categories (PULSA, PDAM, VOUCHER, etc.)

## Pelanggan & Supplier
- **CustomersScreen** (`Customers`) - Customer management
- **CustomerPointsHistoryScreen** (`CustomerPointsHistory`) - Customer loyalty points history (hidden drawer item)
- **SuppliersScreen** (`Suppliers`) - Supplier master data
- **ReceivablesScreen** (`Receivables`) - Customer receivables/debts with WhatsApp collection feature
- **PayablesScreen** (`Payables`) - Supplier payables/debts with due dates

## Laporan & Grafik (Reports)
- **ReportsScreen** (`Reports`) - Sales reports with date range filter
- **ProfitLossScreen** (`ProfitLoss`) - Profit & loss analysis (revenue, COGS, expenses, receivables/payables)
- **TopProductsScreen** (`TopProducts`) - Best-selling products analytics
- **DigitalReportsScreen** (`DigitalReports`) - Digital transaction profit reports
- **ExpensesScreen** (`Expenses`) - Operational expense tracking (rent, utilities, salary)

## Pengaturan (Settings)
- **PaymentMethodsScreen** (`PaymentMethods`) - Payment method configuration
- **SettingsScreen** (`Settings`) - Shop profile and app settings (printer config, etc.)
- **BackupScreen** (`Backup`) - Full JSON backup/restore with transaction safety
