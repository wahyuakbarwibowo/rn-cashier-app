import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { Product } from "../types/database";
import { addProduct, getProducts, deleteProduct, updateProduct } from "../database/products";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<
  DrawerParamList,
  "Product"
>;

export default function ProductsScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const loadProducts = async () => {
    const items = await getProducts();
    setProducts(items);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async () => {
    if (!name) return;
    if (editId) {
      await updateProduct(editId, {
        name,
        selling_price: parseFloat(sellingPrice) || 0,
      });
      setEditId(null);
    } else {
      await addProduct({
        name,
        selling_price: parseFloat(sellingPrice) || 0,
      });
    }
    setName("");
    setSellingPrice("");
    loadProducts();
  };

  const handleEdit = (item: Product) => {
    setEditId(item.id ?? null);
    setName(item.name);
    setSellingPrice(String(item.selling_price ?? ""));
  };

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
    loadProducts();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Atur Barang</Text>

      <TextInput
        placeholder="Nama Produk"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Harga Jual"
        value={sellingPrice}
        onChangeText={setSellingPrice}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title={editId ? "Update Produk" : "Tambah Produk"} onPress={handleSave} />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("ProductDetail", { product: item })}
          >
            <View style={styles.row}>
              <Text>
                {item.name} - Rp {item.selling_price}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Button title="Edit" onPress={() => handleEdit(item)} />
                <Button title="Hapus" onPress={() => item.id && handleDelete(item.id)} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, marginTop: 40 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    marginBottom: 8,
    borderRadius: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
