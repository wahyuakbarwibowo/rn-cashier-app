import { Product } from '../types/database';

export type DrawerParamList = {
  Product: undefined;
  PurchaseForm: undefined;
  SalesTransaction: undefined;
  ProductDetail: { product: Product }
}