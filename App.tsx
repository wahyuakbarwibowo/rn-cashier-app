import React, { useEffect } from "react";
import { initDatabase } from "./src/database/initDB";
import { NavigationContainer } from "@react-navigation/native";
import RootNavigator from "./src/navigation/RootNavigator";

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
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
