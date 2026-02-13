import React, { useEffect } from "react";
import { initDatabase } from "./src/database/initDB";
import { NavigationContainer } from "@react-navigation/native";
import DrawerNavigator from "./src/navigation/DrawerNavigator";

import { Provider as PaperProvider } from "react-native-paper";

export default function App() {
  useEffect(() => {
    (async () => {
      await initDatabase();
    })();
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <DrawerNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
