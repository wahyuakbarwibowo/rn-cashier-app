import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getProducts } from "../database/products";
import { addPurchase } from "../database/purchases";
import { Product } from "../types/database";

type SelectedItem = {
  product: Product;
  qty: number;
  price: number;
  isPackage: boolean;
};

export default function PurchaseFormScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [supplier, setSupplier] = useState("");

  const loadProducts = async () => {
    const data = await getProducts();
    setProducts(data);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProducts();
    });
    return unsubscribe;
  }, [navigation]);

  const handleAddItem = (product: Product, asPackage: boolean = false) => {
    const existingIndex = selectedItems.findIndex((i) => i.product.id === product.id && i.isPackage === asPackage);
    
    if (existingIndex > -1) {
      const newList = [...selectedItems];
      newList[existingIndex].qty += 1;
      setSelectedItems(newList);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          product,
          qty: 1,
          price: asPackage ? (product.purchase_package_price || 0) : (product.purchase_price || 0),
          isPackage: asPackage,
        },
      ]);
    }
  };

  const updateItem = (
    id: number,
    isPackage: boolean,
    changes: Partial<Pick<SelectedItem, "qty" | "price">>
  ) => {
    setSelectedItems((prev) =>
      prev.map((i) =>
        (i.product.id === id && i.isPackage === isPackage) ? { ...i, ...changes } : i
      )
    );
  };

  const handleRemoveItem = (id: number, isPackage: boolean) => {
    setSelectedItems((prev) =>
      prev.filter((i) => !(i.product.id === id && i.isPackage === isPackage))
    );
  };

  const total = selectedItems.reduce(
    (sum, i) => sum + i.qty * i.price,
    0
  );

  const handleSave = async () => {
    if (!supplier.trim()) {
      Alert.alert("Validasi", "Supplier wajib diisi");
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert("Validasi", "Pilih minimal 1 barang");
      return;
    }

    await addPurchase(
      {
        date: new Date().toISOString(),
        supplier,
        total,
      },
      selectedItems.map((i) => ({
        productId: i.product.id!,
        qty: i.isPackage ? (i.qty * (i.product.purchase_package_qty || 1)) : i.qty,
        price: i.price,
      }))
    );

    Alert.alert("Sukses", "Pembelian berhasil disimpan", [
      { text: "OK", onPress: () => navigation.goBack() }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>🧾 Pembelian</Text>
        <TouchableOpacity 
          style={styles.addNewBtn} 
          onPress={() => navigation.navigate("Product")}
        >
          <Text style={styles.addNewBtnText}>+ Barang Baru</Text>
        </TouchableOpacity>
      </View>

      {/* Supplier */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Supplier</Text>
        <TextInput
          placeholder="Nama supplier"
          value={supplier}
          onChangeText={setSupplier}
          style={styles.input}
        />
      </View>

      {/* Product Picker */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pilih Barang</Text>
        <FlatList
          data={products}
          keyExtractor={(item) => item.id?.toString() ?? ""}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.productOption}>
              <TouchableOpacity
                style={styles.productPill}
                onPress={() => handleAddItem(item, false)}
              >
                <Text style={styles.productPillText}>{item.name}</Text>
              </TouchableOpacity>
              {item.purchase_package_price ? (
                <TouchableOpacity
                  style={[styles.productPill, styles.packagePill]}
                  onPress={() => handleAddItem(item, true)}
                >
                  <Text style={styles.productPillText}>Paket ({item.purchase_package_qty})</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        />
      </View>

      {/* Selected Items */}
      <View style={[styles.card, { flex: 1 }]}>
        <Text style={styles.cardTitle}>Item Dipilih</Text>

        <FlatList
          data={selectedItems}
          keyExtractor={(item, index) => `${item.product.id}-${item.isPackage}-${index}`}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>
                  {item.product.name} {item.isPackage ? '(Paket)' : ''}
                </Text>
                <Text style={styles.itemSubtotal}>
                  Subtotal: Rp {(item.qty * item.price).toLocaleString("id-ID")}
                </Text>
              </View>

              <View style={styles.counter}>
                <TextInput
                  value={item.qty.toString()}
                  onChangeText={(t) =>
                    updateItem(item.product.id!, item.isPackage, { qty: Number(t) || 0 })
                  }
                  keyboardType="numeric"
                  style={styles.counterInput}
                />
                <TextInput
                  value={item.price.toString()}
                  onChangeText={(t) =>
                    updateItem(item.product.id!, item.isPackage, { price: Number(t) || 0 })
                  }
                  keyboardType="numeric"
                  style={styles.counterInput}
                />
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveItem(item.product.id!, item.isPackage)}
              >
                <Text style={styles.remove}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Belum ada barang dipilih</Text>
          }
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            Rp {total.toLocaleString("id-ID")}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSave}
        >
          <Text style={styles.primaryButtonText}>
            Simpan Pembelian
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addNewBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addNewBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productOption: {
    flexDirection: 'row',
    marginRight: 8,
  },
  packagePill: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
    marginLeft: 4,
  },


  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,

    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827",
  },

  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },

  productPill: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    marginRight: 8,
  },
  productPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },

  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    fontStyle: "italic",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  itemSubtotal: {
    fontSize: 13,
    color: "#16A34A",
    marginTop: 4,
  },

  counter: {
    flexDirection: "row",
    gap: 8,
    marginHorizontal: 8,
  },
  counterInput: {
    backgroundColor: "#F9FAFB",
    width: 70,
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
  },

  remove: {
    fontSize: 18,
    color: "#DC2626",
    padding: 4,
  },

  footer: {
    marginTop: "auto",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  primaryButton: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
