import { Product } from '../types/database';

export type DrawerParamList = {
  Product: undefined;
  PurchaseForm: undefined;
  SalesTransaction: undefined;
  SalesHistory: undefined;
  SaleDetail: { saleId: number };
  Reports: undefined;
  Settings: undefined;
  Customers: undefined;
  PaymentMethods: undefined;
  Pulsa: undefined;
  Receivables: undefined;
  Payables: undefined;
  ProductDetail: { product: Product }
}