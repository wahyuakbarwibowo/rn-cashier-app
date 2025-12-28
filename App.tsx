import React, { useEffect } from "react";
import { initDatabase } from "./src/database/initDB";
import { NavigationContainer } from "@react-navigation/native";
import DrawerNavigator from "./src/navigation/DrawerNavigator";

export default function App() {
  useEffect(() => {
    (async () => {
      await initDatabase();
    })();
  }, []);

  return (
    <NavigationContainer>
      <DrawerNavigator />
    </NavigationContainer>
  );
}
