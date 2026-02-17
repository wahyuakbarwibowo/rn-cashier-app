import { Product } from '../types/database';

export type DrawerParamList = {
  Dashboard: undefined;
  Product: undefined;
  ProductForm: { product?: Product; initialCode?: string };
  PurchaseForm: { addProductId?: number };
  SalesTransaction: { addProductId?: number };
  SalesHistory: undefined;
  SaleDetail: { saleId: number };
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
  ProductDetail: { product: Product };
  DigitalHistory: undefined;
  DigitalDetail: { trxId: number };
  DigitalProductsMaster: undefined;
  DigitalCategoriesMaster: undefined;
  DigitalReports: undefined;
  ProfitLoss: undefined;
  TopProducts: undefined;
  CustomerPointsHistory: { customerId: number; customerName: string };
  PrinterSettings: undefined;
}
