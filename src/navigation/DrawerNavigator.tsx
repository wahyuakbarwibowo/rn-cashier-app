import { createDrawerNavigator } from "@react-navigation/drawer";
import { DrawerParamList } from "./types";
import ProductsScreen from "../screens/ProductsScreen";
import PurchaseFormScreen from "../screens/ProductFormScreen";

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Product">
      <Drawer.Screen name="Product" component={ProductsScreen} />
      <Drawer.Screen name="PurchaseForm" component={PurchaseFormScreen} />
    </Drawer.Navigator>
  )
}