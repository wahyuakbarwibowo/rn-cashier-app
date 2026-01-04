import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerParamList } from "./types";
import ProductsScreen from "../screens/ProductsScreen";
import PurchaseFormScreen from "../screens/PurchaseFormScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Product">
      <Drawer.Screen name="Product" component={ProductsScreen} />
      <Drawer.Screen name="PurchaseForm" component={PurchaseFormScreen} options={{ title: 'Purchase Form' }} />
      <Drawer.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Detail Product" }} />
    </Drawer.Navigator>
  )
}