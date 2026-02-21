import { Product } from '../types/database';

export type DrawerParamList = {
  Dashboard: undefined;
  Product: undefined;
  ProductForm: { product?: Product; initialCode?: string };
  PurchaseForm: { addProductId?: number };
  SalesTransaction: { addProductId?: number };
  SalesHistory: undefined;
  Reports: undefined;
  Settings: undefined;
  Customers: undefined;
  Suppliers: undefined;
  PaymentMethods: undefined;
  DigitalTransaction: undefined;
  Receivables: undefined;
  Payables: undefined;
  Expenses: undefined;
  LowStock: undefined;
  Backup: undefined;
  DigitalHistory: undefined;
  DigitalProductsMaster: undefined;
  DigitalCategoriesMaster: undefined;
  DigitalReports: undefined;
  ProfitLoss: undefined;
  TopProducts: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  SaleDetail: { saleId: number };
  ProductDetail: { product: Product };
  DigitalDetail: { trxId: number };
  CustomerPointsHistory: { customerId: number; customerName: string };
};
