import { Product } from '../types/database';

export type DrawerParamList = {
  Dashboard: undefined;
  Product: undefined;
  PurchaseForm: undefined;
  SalesTransaction: { addProductId?: number };
  SalesHistory: undefined;
  SaleDetail: { saleId: number };
  Reports: undefined;
  Settings: undefined;
  Customers: undefined;
  PaymentMethods: undefined;
  Pulsa: undefined;
  Receivables: undefined;
  Payables: undefined;
  Backup: undefined;
  ProductDetail: { product: Product }
}