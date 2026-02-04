import { Product } from '../types/database';

export type DrawerParamList = {
  Dashboard: undefined;
  Product: { initialCode?: string };
  PurchaseForm: undefined;
  SalesTransaction: { addProductId?: number };
  SalesHistory: undefined;
  SaleDetail: { saleId: number };
  Reports: undefined;
  Settings: undefined;
  Customers: undefined;
  Suppliers: undefined;
  PaymentMethods: undefined;
  Pulsa: undefined;
  Receivables: undefined;
  Payables: undefined;
  Expenses: undefined;
  Backup: undefined;
  ProductDetail: { product: Product };
  DigitalHistory: undefined;
  DigitalDetail: { trxId: number };
  DigitalProductsMaster: undefined;
  DigitalCategoriesMaster: undefined;
  DigitalReports: undefined;
}