// Navigation route names
export const ROUTES = {
  // Main
  DASHBOARD: "Dashboard",

  // Transactions
  SALES_TRANSACTION: "SalesTransaction",
  SALES_HISTORY: "SalesHistory",
  SALE_DETAIL: "SaleDetail",
  DIGITAL_TRANSACTION: "DigitalTransaction",
  DIGITAL_HISTORY: "DigitalHistory",
  DIGITAL_DETAIL: "DigitalDetail",

  // Stock Management
  PRODUCT: "Product",
  PRODUCT_FORM: "ProductForm",
  PRODUCT_DETAIL: "ProductDetail",
  PURCHASE_FORM: "PurchaseForm",
  LOW_STOCK: "LowStock",
  DIGITAL_PRODUCTS_MASTER: "DigitalProductsMaster",
  DIGITAL_CATEGORIES_MASTER: "DigitalCategoriesMaster",

  // Reports
  REPORTS: "Reports",
  PROFIT_LOSS: "ProfitLoss",
  DIGITAL_REPORTS: "DigitalReports",
  TOP_PRODUCTS: "TopProducts",

  // Customers & Suppliers
  CUSTOMERS: "Customers",
  CUSTOMER_POINTS_HISTORY: "CustomerPointsHistory",
  SUPPLIERS: "Suppliers",
  RECEIVABLES: "Receivables",
  PAYABLES: "Payables",

  // Settings
  PAYMENT_METHODS: "PaymentMethods",
  SETTINGS: "Settings",
  BACKUP: "Backup",
  EXPENSES: "Expenses",
} as const;
