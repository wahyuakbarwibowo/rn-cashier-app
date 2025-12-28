import { Product } from '../types/database';

export type DrawerParamList = {
  Product: undefined;
  PurchaseForm: undefined;
  ProductDetail: { product: Product }
}