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
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [packageQty, setPackageQty] = useState("");
  const [discount, setDiscount] = useState("");
  const [stock, setStock] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const loadProducts = async () => {
    const items = await getProducts();
    setProducts(items);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const resetForm = () => {
    setCode("");
    setName("");
    setPurchasePrice("");
    setSellingPrice("");
    setPackagePrice("");
    setPackageQty("");
    setDiscount("");
    setStock("");
    setEditId(null);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Validasi", "Nama produk wajib diisi");
      return;
    }

    const productData: Product = {
      code: code.trim() || undefined,
      name: name.trim(),
      purchase_price: parseFloat(purchasePrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      package_price: parseFloat(packagePrice) || 0,
      package_qty: parseInt(packageQty) || 0,
      discount: parseFloat(discount) || 0,
      stock: parseInt(stock) || 0,
    };

    if (editId) {
      await updateProduct(editId, productData);
    } else {
      await addProduct(productData);
    }

    resetForm();
    loadProducts();
  };

  const handleEdit = (item: Product) => {
    setEditId(item.id ?? null);
    setCode(item.code || "");
    setName(item.name);
    setPurchasePrice(String(item.purchase_price ?? ""));
    setSellingPrice(String(item.selling_price ?? ""));
    setPackagePrice(String(item.package_price ?? ""));
    setPackageQty(String(item.package_qty ?? ""));
    setDiscount(String(item.discount ?? ""));
    setStock(String(item.stock ?? ""));
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

        <View>
          <View style={styles.row}>
            <TextInput
              placeholder="Kode (Scan)"
              value={code}
              onChangeText={setCode}
              style={[styles.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="Stok"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              style={[styles.input, { width: 80 }]}
            />
          </View>

          <TextInput
            placeholder="Nama produk"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <View style={styles.row}>
            <TextInput
              placeholder="Harga Beli"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="numeric"
              style={[styles.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="Harga Jual"
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              placeholder="Harga Paket"
              value={packagePrice}
              onChangeText={setPackagePrice}
              keyboardType="numeric"
              style={[styles.input, { flex: 1, marginRight: 8 }]}
            />
            <TextInput
              placeholder="Isi Paket"
              value={packageQty}
              onChangeText={setPackageQty}
              keyboardType="numeric"
              style={[styles.input, { flex: 1 }]}
            />
          </View>

          <TextInput
            placeholder="Diskon (%)"
            value={discount}
            onChangeText={setDiscount}
            keyboardType="numeric"
            style={styles.input}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSave}>
            <Text style={styles.primaryButtonText}>
              {editId ? "Update" : "Simpan"}
            </Text>
          </TouchableOpacity>
          
          {editId && (
            <TouchableOpacity 
              style={[styles.secondaryButton, { marginTop: 8 }]} 
              onPress={resetForm}
            >
              <Text style={styles.secondaryButtonText}>Batal</Text>
            </TouchableOpacity>
          )}
        </View>
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
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              <View style={styles.productMeta}>
                <Text style={styles.productPrice}>
                  Rp {(item.selling_price ?? 0).toLocaleString("id-ID")}
                </Text>
                <Text style={styles.productStock}> | Stok: {item.stock}</Text>
              </View>
              {item.code && <Text style={styles.productCode}>{item.code}</Text>}
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    marginBottom: 2,
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
  secondaryButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111827",
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
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },
  productStock: {
    fontSize: 14,
    color: "#6B7280",
  },
  productCode: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
  },
  editBtn: {
    backgroundColor: "#EFF6FF",
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
    fontWeight: "600",
  },
});
