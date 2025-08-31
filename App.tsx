import React, { useEffect } from "react";
import { initDatabase } from "./src/database/initDB";
import ProductsScreen from "./src/screens/ProductsScreen";

export default function App() {
  useEffect(() => {
    (async () => {
      await initDatabase();
    })();
  }, []);

  return <ProductsScreen />;
}
