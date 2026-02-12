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
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import { getProducts } from "../database/products";
import { addPurchase } from "../database/purchases";
import { Product } from "../types/database";
import { getSuppliers, addSupplier } from "../database/suppliers";
import { Supplier } from "../types/supplier";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";

type SelectedItem = {
  product: Product;
  qty: number;
  price: number;
  isPackage: boolean;
};

export default function PurchaseFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null);
  const [supplierName, setSupplierName] = useState("");
  const [isDebt, setIsDebt] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Barcode Scanner State
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  const loadData = async () => {
    const [pData, sData] = await Promise.all([
      getProducts(),
      getSuppliers()
    ]);
    setProducts(pData);
    setSuppliers(sData);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const params = route.params as { addProductId?: number };
    if (params?.addProductId && products.length > 0) {
      const product = products.find(p => p.id === params.addProductId);
      if (product) {
        handleAddItem(product);
        navigation.setParams({ addProductId: undefined });
      }
    }
  }, [route.params, products]);

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

  const resetForm = () => {
    setSelectedItems([]);
    setSelectedSupplierId(null);
    setSupplierName("");
    setIsDebt(false);
    setSearchQuery("");
  };

  const handleSave = async () => {
    if (!selectedSupplierId && !supplierName.trim()) {
      Alert.alert("Validasi", "Supplier wajib dipilih atau diisi");
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert("Validasi", "Pilih minimal 1 barang");
      return;
    }

    try {
      let finalSupplierId = selectedSupplierId;
      let finalSupplierName = supplierName;

      // If manual name is entered, create supplier
      if (!finalSupplierId && supplierName.trim()) {
        const newSupplierId = await addSupplier({
          name: supplierName.trim(),
          phone: "",
          address: ""
        });
        finalSupplierId = newSupplierId;
      } else if (selectedSupplierId) {
        const s = suppliers.find(s => s.id === selectedSupplierId);
        finalSupplierName = s?.name || "";
      }

      await addPurchase(
        {
          date: new Date().toISOString(),
          supplier: finalSupplierName,
          supplier_id: finalSupplierId || undefined,
          total,
          isDebt: isDebt,
        },
        selectedItems.map((i) => ({
          productId: i.product.id!,
          qty: i.isPackage ? (i.qty * (i.product.purchase_package_qty || 1)) : i.qty,
          price: i.price,
        }))
      );

      Alert.alert("Sukses", "Pembelian berhasil disimpan", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            navigation.navigate("Product");
          }
        }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal menyimpan pembelian");
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    setIsScanning(false);

    // Find product with this code
    const product = products.find(p => p.code === data);
    if (product) {
      handleAddItem(product);
      setSearchQuery(""); // Clear search if any
      Alert.alert("Sukses", `Berhasil menambah ${product.name}`);
    } else {
      Alert.alert(
        "Produk Tidak Ditemukan",
        `Barang dengan kode ${data} belum terdaftar.`,
        [
          { text: "Tutup", style: "cancel" },
          {
            text: "Tambah Produk",
            onPress: () => navigation.navigate("Product", { initialCode: data })
          }
        ]
      );
    }
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Izin Kamera", "Akses kamera dibutuhkan untuk scan barcode");
        return;
      }
    }
    setIsScanning(true);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 150 }}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* Supplier Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pilih Supplier</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            <TouchableOpacity
              style={[styles.selectorPill, !selectedSupplierId && !supplierName && styles.activeSelectorPill]}
              onPress={() => {
                setSelectedSupplierId(null);
                setSupplierName("");
              }}
            >
              <Text style={[styles.selectorPillText, !selectedSupplierId && !supplierName && styles.activeSelectorPillText]}>Umum</Text>
            </TouchableOpacity>
            {suppliers.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.selectorPill, selectedSupplierId === s.id && styles.activeSelectorPill]}
                onPress={() => {
                  setSelectedSupplierId(s.id!);
                  setSupplierName("");
                }}
              >
                <Text style={[styles.selectorPillText, selectedSupplierId === s.id && styles.activeSelectorPillText]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            placeholder="Atau input supplier baru..."
            value={supplierName}
            onChangeText={(t) => {
              setSupplierName(t);
              if (t) setSelectedSupplierId(null);
            }}
            style={styles.input}
          />

          <Text style={[styles.cardTitle, { marginTop: 16, marginBottom: 8 }]}>Metode Bayar</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.selectorPill, !isDebt && styles.activeSelectorPill, { flex: 1 }]}
              onPress={() => setIsDebt(false)}
            >
              <Text style={[styles.selectorPillText, !isDebt && styles.activeSelectorPillText, { textAlign: 'center' }]}>Tunai</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectorPill, isDebt && styles.activeSelectorPill, { flex: 1 }]}
              onPress={() => setIsDebt(true)}
            >
              <Text style={[styles.selectorPillText, isDebt && styles.activeSelectorPillText, { textAlign: 'center' }]}>Hutang</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Picker */}
        <View style={styles.card}>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Cari produk..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, styles.searchInputFlex]}
            />
            <TouchableOpacity
              style={styles.scanActionBtn}
              onPress={startScan}
            >
              <Text style={styles.scanActionIcon}>📷</Text>
            </TouchableOpacity>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearSearchBtnText}>Batal</Text>
              </TouchableOpacity>
            )}
          </View>

          {searchQuery.length > 0 && (
            <View style={styles.searchResultList}>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((item) => (
                  <View key={String(item.id)} style={styles.productListItem}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.name}</Text>
                      {item.code && <Text style={styles.productCode}>{item.code}</Text>}
                    </View>
                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={styles.priceActionBtn}
                        onPress={() => handleAddItem(item, false)}
                      >
                        <Text style={styles.priceActionLabel}>Satuan</Text>
                        <Text style={styles.priceActionValue}>
                          Rp {item.purchase_price?.toLocaleString("id-ID")}
                        </Text>
                      </TouchableOpacity>
                      {item.purchase_package_price ? (
                        <TouchableOpacity
                          style={[styles.priceActionBtn, styles.packageActionBtn]}
                          onPress={() => handleAddItem(item, true)}
                        >
                          <Text style={styles.priceActionLabel}>Paket ({item.purchase_package_qty})</Text>
                          <Text style={styles.priceActionValue}>
                            Rp {item.purchase_package_price?.toLocaleString("id-ID")}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Produk tidak ditemukan</Text>
              )}
            </View>
          )}
        </View>

        {/* Selected Items */}
        <View style={[styles.card, { flex: 1 }]}>
          <Text style={styles.cardTitle}>Item Dipilih</Text>

          <View>
            {selectedItems.length > 0 ? (
              selectedItems.map((item, index) => (
                <View key={`${item.product.id}-${item.isPackage}-${index}`} style={styles.itemRow}>
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
              ))
            ) : (
              <Text style={styles.emptyText}>Belum ada barang dipilih</Text>
            )}
          </View>
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
        <BarcodeScannerModal
          visible={isScanning}
          onScanned={handleBarcodeScanned}
          onClose={() => setIsScanning(false)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    height: 48,
  },
  searchInputFlex: {
    flex: 1,
    marginBottom: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  scanActionBtn: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 15,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  scanActionIcon: {
    fontSize: 20,
  },
  clearSearchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  clearSearchBtnText: {
    color: "#EF4444",
    fontWeight: "600",
  },
  searchResultList: {
    maxHeight: 250,
  },
  productListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  productCode: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  productActions: {
    flexDirection: "row",
    gap: 8,
  },
  priceActionBtn: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
  },
  packageActionBtn: {
    backgroundColor: "#FEF3C7",
    borderColor: "#FDE68A",
  },
  priceActionLabel: {
    fontSize: 9,
    color: "#6B7280",
    fontWeight: "500",
  },
  priceActionValue: {
    fontSize: 11,
    color: "#1D4ED8",
    fontWeight: "bold",
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
  selectorScroll: {
    marginBottom: 12,
  },
  selectorPill: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeSelectorPill: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  selectorPillText: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 13,
  },
  activeSelectorPillText: {
    color: "#FFF",
  },
});
