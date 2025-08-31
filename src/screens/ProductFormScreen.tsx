import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { addProduct, updateProduct } from "../database/products";
import { Product } from "../types/product";

export default function ProductFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ params: { product?: Product } }, "params">>();
  const product = route.params?.product;

  const [form, setForm] = useState<Product>(
    product || {
      code: "",
      name: "",
      purchasePrice: 0,
      salePrice: 0,
      discount: 0,
      stock: 0,
    }
  );

  const handleChange = (field: keyof Product, value: string) => {
    setForm({
      ...form,
      [field]: ["purchasePrice", "salePrice", "discount", "stock"].includes(field)
        ? Number(value)
        : value,
    });
  };

  const handleSave = async () => {
    if (product) {
      await updateProduct(product.id!, form);
    } else {
      await addProduct(form);
    }
    navigation.goBack();
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold mb-4">
        {product ? "Edit Produk" : "Tambah Produk"}
      </Text>

      {[
        { label: "Kode Barang", field: "code", keyboard: "default" },
        { label: "Nama Barang", field: "name", keyboard: "default" },
        { label: "Harga Beli", field: "purchasePrice", keyboard: "numeric" },
        { label: "Harga Jual", field: "salePrice", keyboard: "numeric" },
        { label: "Diskon (%)", field: "discount", keyboard: "numeric" },
        { label: "Stok", field: "stock", keyboard: "numeric" },
      ].map(({ label, field, keyboard }) => (
        <View key={field} className="mb-4">
          <Text className="mb-1 font-medium">{label}</Text>
          <TextInput
            value={form[field as keyof Product]?.toString() || ""}
            onChangeText={(t) => handleChange(field as keyof Product, t)}
            keyboardType={keyboard as any}
            className="border border-gray-300 bg-white rounded-lg px-3 py-2"
          />
        </View>
      ))}

      <TouchableOpacity
        onPress={handleSave}
        className="bg-blue-600 py-3 rounded-xl"
      >
        <Text className="text-white text-center font-bold text-lg">Simpan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
