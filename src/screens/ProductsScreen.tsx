import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Product } from "../types/database";
import {
  addProduct,
  getProducts,
  deleteProduct,
  updateProduct,
} from "../database/products";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<DrawerParamList, "Product">;

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

  const resetForm = () => {
    setName("");
    setSellingPrice("");
    setEditId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validasi", "Nama produk wajib diisi");
      return;
    }

    const price = parseFloat(sellingPrice) || 0;

    if (editId) {
      await updateProduct(editId, { name, selling_price: price });
    } else {
      await addProduct({ name, selling_price: price });
    }

    resetForm();
    loadProducts();
  };

  const handleEdit = (item: Product) => {
    setEditId(item.id ?? null);
    setName(item.name);
    setSellingPrice(String(item.selling_price ?? ""));
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Hapus Produk",
      "Yakin mau hapus produk ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deleteProduct(id);
            loadProducts();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>📦 Produk</Text>

      {/* Form Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {editId ? "Edit Produk" : "Tambah Produk"}
        </Text>

        <TextInput
          placeholder="Nama produk"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Harga jual"
          value={sellingPrice}
          onChangeText={setSellingPrice}
          keyboardType="numeric"
          style={styles.input}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryButtonText}>
            {editId ? "Update" : "Simpan"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ProductDetail", { product: item })
            }
            style={styles.productCard}
          >
            <View>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>
                Rp {(item.selling_price ?? 0).toLocaleString("id-ID")}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleEdit(item)}
              >
                <Text style={styles.actionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => item.id && handleDelete(item.id)}
              >
                <Text style={styles.actionText}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  /* Form */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,

    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  /* Product Card */
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  productPrice: {
    marginTop: 4,
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "500",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  deleteBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
