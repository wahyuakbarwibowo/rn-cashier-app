import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import BarcodeScannerModal from "../components/BarcodeScannerModal";
import { Product } from "../types/database";
import {
  addProduct,
  getProducts,
  deleteProduct,
  updateProduct,
} from "../database/products";
import { useRoute } from "@react-navigation/native";
import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";

type Props = DrawerScreenProps<DrawerParamList, "Product">;

interface ProductFormData {
  code: string;
  name: string;
  purchasePrice: string;
  purchasePackagePrice: string;
  purchasePackageQty: string;
  sellingPrice: string;
  packagePrice: string;
  packageQty: string;
  discount: string;
  stock: string;
}

const initialFormData: ProductFormData = {
  code: "",
  name: "",
  purchasePrice: "",
  purchasePackagePrice: "",
  purchasePackageQty: "",
  sellingPrice: "",
  packagePrice: "",
  packageQty: "",
  discount: "",
  stock: "",
};

function useProductForm(onSave: () => void) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editId, setEditId] = useState<number | null>(null);

  const updateField = useCallback(
    <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
      setFormData((prev) => {
        let newData = { ...prev, [field]: value };

        // Auto-calculate unit purchase price
        if (field === "purchasePackagePrice" || field === "purchasePackageQty") {
          const pkgPrice = parseFloat(field === "purchasePackagePrice" ? (value as string) : prev.purchasePackagePrice) || 0;
          const pkgQty = parseInt(field === "purchasePackageQty" ? (value as string) : prev.purchasePackageQty) || 0;
          if (pkgPrice > 0 && pkgQty > 0) {
            newData.purchasePrice = String(Math.round(pkgPrice / pkgQty));
          }
        }

        // Auto-calculate unit selling price
        if (field === "packagePrice" || field === "packageQty") {
          const pkgPrice = parseFloat(field === "packagePrice" ? (value as string) : prev.packagePrice) || 0;
          const pkgQty = parseInt(field === "packageQty" ? (value as string) : prev.packageQty) || 0;
          if (pkgPrice > 0 && pkgQty > 0) {
            newData.sellingPrice = String(Math.round(pkgPrice / pkgQty));
          }
        }

        return newData;
      });
    },
    []
  );

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setEditId(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      Alert.alert("Validasi", "Nama produk wajib diisi");
      return;
    }

    const productData: Product = {
      code: formData.code.trim() || undefined,
      name: formData.name.trim(),
      purchase_price: parseFloat(formData.purchasePrice) || 0,
      purchase_package_price: parseFloat(formData.purchasePackagePrice) || 0,
      purchase_package_qty: parseInt(formData.purchasePackageQty) || 0,
      selling_price: parseFloat(formData.sellingPrice) || 0,
      package_price: parseFloat(formData.packagePrice) || 0,
      package_qty: parseInt(formData.packageQty) || 0,
      discount: parseFloat(formData.discount) || 0,
      stock: parseInt(formData.stock) || 0,
    };

    if (editId) {
      await updateProduct(editId, productData);
    } else {
      await addProduct(productData);
    }

    resetForm();
    onSave();
  }, [formData, editId, resetForm, onSave]);

  const populateForm = useCallback((item: Product) => {
    setEditId(item.id ?? null);
    setFormData({
      code: item.code || "",
      name: item.name,
      purchasePrice: String(item.purchase_price ?? ""),
      purchasePackagePrice: String(item.purchase_package_price ?? ""),
      purchasePackageQty: String(item.purchase_package_qty ?? ""),
      sellingPrice: String(item.selling_price ?? ""),
      packagePrice: String(item.package_price ?? ""),
      packageQty: String(item.package_qty ?? ""),
      discount: String(item.discount ?? ""),
      stock: String(item.stock ?? ""),
    });
  }, []);

  const generateRandomCode = useCallback(() => {
    const random = Math.floor(Math.random() * 90000000) + 10000000;
    updateField("code", String(random));
  }, [updateField]);

  return { formData, editId, updateField, resetForm, handleSave, populateForm, generateRandomCode };
}

function useBarcodeScanner(onScanned: (code: string) => void) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);

  const startScan = useCallback(async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission", "Akses kamera dibutuhkan untuk scan barcode");
        return;
      }
    }
    setIsScanning(true);
  }, [permission, requestPermission]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      onScanned(data);
      setIsScanning(false);
    },
    [onScanned]
  );

  const closeScan = useCallback(() => setIsScanning(false), []);

  return { isScanning, startScan, handleBarcodeScanned, closeScan };
}

interface ProductCardProps {
  item: Product;
  onEdit: () => void;
  onDelete: () => void;
  onPress: () => void;
  onAddStock: () => void;
}

function ProductCard({ item, onEdit, onDelete, onPress, onAddStock }: ProductCardProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.productCard}>
      <View style={styles.productInfo}>
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
        <TouchableOpacity style={styles.addStockBtn} onPress={onAddStock}>
          <Text style={[styles.actionText, { color: "#FFF" }]}>+ Stok</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.editBtn} onPress={onEdit}>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
          <Text style={styles.actionText}>Hapus</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}



export default function ProductsScreen({ navigation }: Props) {
  const route = useRoute<any>();
  const [products, setProducts] = useState<Product[]>([]);

  const loadProducts = useCallback(async () => {
    const items = await getProducts();
    setProducts(items);
  }, []);

  const { formData, editId, updateField, resetForm, handleSave, populateForm, generateRandomCode } =
    useProductForm(loadProducts);

  const { isScanning, startScan, handleBarcodeScanned, closeScan } =
    useBarcodeScanner((code) => updateField("code", code));

  useEffect(() => {
    loadProducts();

    const params = route.params as { initialCode?: string };
    if (params?.initialCode) {
      updateField("code", params.initialCode);
      // Clear params so it doesn't keep updating on re-renders
      navigation.setParams({ initialCode: undefined });
    }
  }, [loadProducts, route.params, updateField, navigation]);

  const handleDelete = useCallback(
    (id: number) => {
      Alert.alert("Hapus Produk", "Yakin mau hapus produk ini?", [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deleteProduct(id);
            loadProducts();
          },
        },
      ]);
    },
    [loadProducts]
  );

  const renderProductItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        item={item}
        onEdit={() => populateForm(item)}
        onDelete={() => item.id && handleDelete(item.id)}
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
        onAddStock={() => navigation.navigate("PurchaseForm", { addProductId: item.id })}
      />
    ),
    [populateForm, handleDelete, navigation]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Katalog Produk</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {editId ? "Edit Produk" : "Tambah Produk"}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.row}>
            <TextInput
              placeholder="Kode (Scan)"
              value={formData.code}
              onChangeText={(v) => updateField("code", v)}
              style={[styles.input, styles.flexInput, { marginBottom: 0 }]}
            />
            <TouchableOpacity
              style={[styles.scanBtn, { backgroundColor: '#10B981', marginRight: 8 }]}
              onPress={generateRandomCode}
            >
              <Text style={styles.scanBtnText}>Buat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.scanBtn} onPress={startScan}>
              <Text style={styles.scanBtnText}>Scan</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Nama produk"
            value={formData.name}
            onChangeText={(v) => updateField("name", v)}
            style={styles.input}
          />

          <TextInput
            placeholder="Stok"
            value={formData.stock}
            onChangeText={(v) => updateField("stock", v)}
            keyboardType="numeric"
            style={styles.input}
          />

          <Text style={styles.subTitle}>Harga Beli</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="Satuan"
              value={formData.purchasePrice}
              onChangeText={(v) => updateField("purchasePrice", v)}
              keyboardType="numeric"
              style={[styles.input, styles.flexInput]}
            />
            <TextInput
              placeholder="Paket"
              value={formData.purchasePackagePrice}
              onChangeText={(v) => updateField("purchasePackagePrice", v)}
              keyboardType="numeric"
              style={[styles.input, styles.flexInput]}
            />
            <TextInput
              placeholder="Isi"
              value={formData.purchasePackageQty}
              onChangeText={(v) => updateField("purchasePackageQty", v)}
              keyboardType="numeric"
              style={[styles.input, styles.qtyInput]}
            />
          </View>

          <Text style={styles.subTitle}>Harga Jual</Text>
          <View style={styles.row}>
            <TextInput
              placeholder="Satuan"
              value={formData.sellingPrice}
              onChangeText={(v) => updateField("sellingPrice", v)}
              keyboardType="numeric"
              style={[styles.input, styles.flexInput]}
            />
            <TextInput
              placeholder="Paket"
              value={formData.packagePrice}
              onChangeText={(v) => updateField("packagePrice", v)}
              keyboardType="numeric"
              style={[styles.input, styles.flexInput]}
            />
            <TextInput
              placeholder="Isi"
              value={formData.packageQty}
              onChangeText={(v) => updateField("packageQty", v)}
              keyboardType="numeric"
              style={[styles.input, styles.qtyInput]}
            />
          </View>

          <TextInput
            placeholder="Diskon (%)"
            value={formData.discount}
            onChangeText={(v) => updateField("discount", v)}
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
              style={[styles.secondaryButton, styles.cancelButton]}
              onPress={resetForm}
            >
              <Text style={styles.secondaryButtonText}>Batal</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        contentContainerStyle={styles.listContent}
        renderItem={renderProductItem}
      />

      <BarcodeScannerModal
        visible={isScanning}
        onScanned={handleBarcodeScanned}
        onClose={closeScan}
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
  subTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 8,
    marginTop: 4,
  },

  // Form
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    maxHeight: 400,
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
  flexInput: {
    flex: 1,
    marginRight: 8,
  },
  qtyInput: {
    width: 60,
  },
  row: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "center",
  },
  scanBtn: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  scanBtnText: {
    color: "#FFF",
    fontWeight: "bold",
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
  cancelButton: {
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 40,
  },

  // Product Card
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
  productInfo: {
    flex: 1,
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
    gap: 6,
  },
  addStockBtn: {
    backgroundColor: "#3B82F6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
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

  // Scanner Modal
  scannerContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  closeBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  closeBtnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
});

