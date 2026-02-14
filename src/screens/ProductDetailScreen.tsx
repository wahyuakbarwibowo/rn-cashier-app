import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";
import { StyleSheet, Text, TouchableOpacity, View, Image, Alert, ScrollView } from "react-native";
import * as Print from 'expo-print';

type Props = DrawerScreenProps<DrawerParamList, "ProductDetail">;

export default function ProductDetailScreen({ route, navigation }: Props) {
  const { product } = route.params;

  const formatPrice = (value?: number) =>
    value ? `Rp ${value.toLocaleString("id-ID")}` : "-";

  const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${product.code}&scale=3&rotate=N&includetext`;

  const printBarcode = async () => {
    if (!product.code) {
      Alert.alert("Error", "Produk tidak memiliki kode barcode");
      return;
    }

    const html = `
      <html>
        <body style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
          <h2 style="margin-bottom: 5px;">${product.name}</h2>
          <img src="${barcodeUrl}" style="width: 250px; height: auto;" />
          <h3 style="margin-top: 5px;">${formatPrice(product.selling_price)}</h3>
        </body>
      </html>
    `;

    try {
      await Print.printAsync({ html });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Gagal mencetak barcode");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Card */}
        <View style={styles.card}>
          {/* Product Name */}
          <Text style={styles.name}>{product.name}</Text>

          {/* Code & Barcode Image */}
          {product.code && (
            <View style={styles.barcodeContainer}>
              <Image
                source={{ uri: barcodeUrl }}
                style={styles.barcodeImage}
                resizeMode="contain"
              />
              <Text style={styles.code}>Kode: {product.code}</Text>
            </View>
          )}

          {/* Selling Price */}
          {product.selling_price && (
            <Text style={styles.price}>
              {formatPrice(product.selling_price)}
            </Text>
          )}

          <View style={styles.divider} />

          {/* Detail Rows */}
          <DetailRow label="Harga Beli" value={formatPrice(product.purchase_price)} />
          <DetailRow
            label="Harga Paket"
            value={
              product.package_price && product.package_qty
                ? `${formatPrice(product.package_price)} / ${product.package_qty} pcs`
                : "-"
            }
          />
          <DetailRow
            label="Diskon"
            value={product.discount ? `${product.discount}%` : "-"}
          />
          <DetailRow
            label="Stok"
            value={product.stock !== undefined ? product.stock.toString() : "-"}
          />

          <View style={styles.divider} />

          {/* Timestamp */}
          {product.created_at && (
            <Text style={styles.timestamp}>
              Dibuat: {new Date(product.created_at).toLocaleDateString("id-ID")}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.printButton]}
            onPress={printBarcode}
          >
            <Text style={styles.buttonText}>🖨️ Cetak Barcode</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("SalesTransaction", { addProductId: product.id })}
          >
            <Text style={styles.buttonText}>Tambah ke Keranjang</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  )
}

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
    paddingBottom: 32,
  },
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,

    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },
  barcodeContainer: {
    alignItems: "center",
    marginVertical: 15,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 12,
  },
  barcodeImage: {
    width: "100%",
    height: 80,
  },
  code: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 8,
    fontWeight: "600",
  },
  price: {
    fontSize: 24,
    fontWeight: "600",
    color: "#16A34A",
    marginTop: 12,
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: {
    fontSize: 15,
    color: "#374151",
  },
  value: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  timestamp: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
  },
  footer: {
    marginTop: "auto",
    paddingVertical: 16,
    gap: 12,
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  printButton: {
    backgroundColor: "#3B82F6",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
