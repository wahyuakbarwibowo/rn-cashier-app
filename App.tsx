import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProductsScreen from "./src/screens/ProductsScreen";
import ProductFormScreen from "./src/screens/ProductFormScreen";
import { initDatabase } from "./src/database/initDB";

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    (async () => {
      await initDatabase();
    })();
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="ProductForm" component={ProductFormScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
