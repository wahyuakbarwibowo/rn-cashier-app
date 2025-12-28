import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getAllProducts } from "../database/products";
import { addPurchase } from "../database/purchases";
import { Product } from "../types/product";

export default function PurchaseFormScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<
    { product: Product; qty: number; price: number }[]
  >([]);
  const [supplier, setSupplier] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  const handleAddItem = (product: Product) => {
    if (!selectedItems.find((i) => i.product.id === product.id)) {
      setSelectedItems([
        ...selectedItems,
        { product, qty: 1, price: product.purchasePrice },
      ]);
    }
  };

  const handleChangeQty = (id: number, qty: number) => {
    setSelectedItems(
      selectedItems.map((i) =>
        i.product.id === id ? { ...i, qty } : i
      )
    );
  };

  const handleChangePrice = (id: number, price: number) => {
    setSelectedItems(
      selectedItems.map((i) =>
        i.product.id === id ? { ...i, price } : i
      )
    );
  };

  const handleSave = async () => {
    const total = selectedItems.reduce((sum, i) => sum + i.qty * i.price, 0);
    await addPurchase(
      { date: new Date().toISOString(), supplier, total },
      selectedItems.map((i) => ({
        productId: i.product.id!,
        qty: i.qty,
        price: i.price,
      }))
    );
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tambah Pembelian</Text>

      <TextInput
        placeholder="Supplier"
        value={supplier}
        onChangeText={setSupplier}
        style={styles.input}
      />

      <Text style={styles.subtitle}>Pilih Barang</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.itemButton}
            onPress={() => handleAddItem(item)}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.subtitle}>Item yang Dipilih</Text>
      {selectedItems.map((i) => (
        <View key={i.product.id} style={styles.row}>
          <Text style={{ flex: 1 }}>{i.product.name}</Text>
          <TextInput
            value={i.qty.toString()}
            onChangeText={(t) => handleChangeQty(i.product.id!, Number(t))}
            keyboardType="numeric"
            style={styles.inputSmall}
          />
          <TextInput
            value={i.price.toString()}
            onChangeText={(t) => handleChangePrice(i.product.id!, Number(t))}
            keyboardType="numeric"
            style={styles.inputSmall}
          />
        </View>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Simpan Pembelian</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: "600", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  itemButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 6,
    width: 70,
    marginLeft: 8,
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: "#007bff",
    padding: 14,
    borderRadius: 10,
  },
  saveButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
