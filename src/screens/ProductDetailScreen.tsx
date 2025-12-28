import { DrawerScreenProps } from "@react-navigation/drawer";
import { DrawerParamList } from "../navigation/types";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = DrawerScreenProps<DrawerParamList, "ProductDetail">;

export default function ProductDetailScreen({ route }: Props) {
  const { product } = route.params;

  const formatPrice = (value?: number) =>
    value ? `Rp ${value.toLocaleString("id-ID")}` : "-";

  return (
    <View style={styles.container}>
      {/* Card */}
      <View style={styles.card}>
        {/* Product Name */}
        <Text style={styles.name}>{product.name}</Text>

        {/* Code */}
        {product.code && (
          <Text style={styles.code}>Kode: {product.code}</Text>
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

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Tambah ke Keranjang</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    padding: 16,
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
  code: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  price: {
    fontSize: 24,
    fontWeight: "600",
    color: "#16A34A",
    marginTop: 12,
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
  },
  button: {
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
