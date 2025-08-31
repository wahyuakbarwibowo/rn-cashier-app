import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { getAllProducts, deleteProduct } from "../database/products";
import { Product } from "../types/product";

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadProducts();
  }, [isFocused]);

  const loadProducts = async () => {
    const data = await getAllProducts();
    setProducts(data);
  };

  const handleDelete = async (id: number) => {
    await deleteProduct(id);
    loadProducts();
  };

  return (
    <View className="flex-1 p-4 bg-gray-100">
      <TouchableOpacity
        onPress={() => navigation.navigate("ProductForm")}
        className="bg-green-600 p-3 rounded-xl mb-4"
      >
        <Text className="text-white font-bold text-center">+ Tambah Produk</Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("ProductForm", { product: item })}
            className="bg-white p-4 mb-3 rounded-xl shadow flex-row justify-between items-center"
          >
            <View>
              <Text className="text-lg font-semibold">{item.name}</Text>
              <Text className="text-gray-600">Kode: {item.code}</Text>
              <Text className="text-gray-600">Harga Jual: Rp {item.salePrice}</Text>
              <Text className="text-gray-600">Stok: {item.stock}</Text>
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item.id!)}
              className="bg-red-500 px-3 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Hapus</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
