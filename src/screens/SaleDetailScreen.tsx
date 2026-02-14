import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Divider,
  Chip,
  Surface,
} from "react-native-paper";
import { getSaleItems } from "../database/sales";
import { getDB } from "../database/initDB";
import { Sale, SaleItem, Product } from "../types/database";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { printSaleReceipt } from "../services/PrintService";

export default function SaleDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { saleId } = route.params;

  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<(SaleItem & { product_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSaleDetail();
  }, [saleId]);

  const loadSaleDetail = async () => {
    try {
      setLoading(true);
      const db = await getDB();

      const saleData = await db.getFirstAsync<Sale>(
        "SELECT * FROM sales WHERE id = ?",
        [saleId]
      );
      setSale(saleData || null);

      const itemsData = await db.getAllAsync<any>(
        `SELECT si.*, p.name as product_name
         FROM sales_items si
         JOIN products p ON si.product_id = p.id
         WHERE si.sale_id = ?`,
        [saleId]
      );
      setItems(itemsData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" animating color="#FB7185" />
      </View>
    );
  }

  if (!sale) {
    return (
      <View style={styles.center}>
        <Text variant="bodyLarge">Transaksi tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text variant="headlineSmall" style={styles.title}>Detail Transaksi</Text>
                <Chip
                  icon="receipt"
                  mode="flat"
                  compact
                  style={styles.trxChip}
                  textStyle={styles.trxChipText}
                >
                  TRX-{sale.id?.toString().padStart(5, '0')}
                </Chip>
              </View>
              <Button
                mode="contained"
                compact
                buttonColor="#6366F1"
                textColor="#FFF"
                style={styles.editButton}
                onPress={() => Alert.alert("Coming Soon", "Fitur edit transaksi retail sedang dikembangkan.")}
              >
                Edit
              </Button>
            </View>

            <Card style={styles.infoCard} mode="elevated">
              <Card.Content>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Tanggal</Text>
                  <Text variant="bodyMedium" style={styles.value}>{formatDate(sale.created_at)}</Text>
                </View>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Total</Text>
                  <Text variant="titleMedium" style={styles.totalText}>Rp {(sale.total || 0).toLocaleString("id-ID")}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Dibayar</Text>
                  <Text variant="bodyMedium" style={styles.value}>Rp {(sale.paid || 0).toLocaleString("id-ID")}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>Kembali</Text>
                  <Text variant="bodyMedium" style={styles.value}>Rp {(sale.change || 0).toLocaleString("id-ID")}</Text>
                </View>
                {(sale.points_earned || 0) > 0 && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={{ color: '#FB7185' }}>Poin Didapat</Text>
                    <Text variant="bodyMedium" style={{ color: '#FB7185', fontWeight: '600' }}>+{sale.points_earned} Pts</Text>
                  </View>
                )}
                {(sale.points_redeemed || 0) > 0 && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={{ color: '#E11D48' }}>Poin Ditukar</Text>
                    <Text variant="bodyMedium" style={{ color: '#E11D48', fontWeight: '600' }}>-{sale.points_redeemed} Pts</Text>
                  </View>
                )}
              </Card.Content>
            </Card>

            <Text variant="titleMedium" style={styles.sectionTitle}>Daftar Barang</Text>
          </>
        }
        renderItem={({ item }) => (
          <Surface style={styles.itemRow} elevation={1}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyLarge" style={styles.itemName}>{item.product_name || 'Produk Terhapus'}</Text>
              <Text variant="bodySmall" style={styles.itemMeta}>{item.qty} x Rp {(item.price || 0).toLocaleString("id-ID")}</Text>
            </View>
            <Text variant="titleSmall" style={styles.itemSubtotal}>Rp {(item.subtotal || 0).toLocaleString("id-ID")}</Text>
          </Surface>
        )}
        ListFooterComponent={
          <>
            <Button
              mode="contained"
              icon="printer"
              buttonColor="#10B981"
              textColor="#FFF"
              style={styles.printButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              onPress={() => sale && printSaleReceipt(sale, items)}
            >
              Cetak Struk
            </Button>

            <Button
              mode="contained"
              icon="arrow-left"
              buttonColor="#1E293B"
              textColor="#FFF"
              style={styles.backButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              onPress={() => {
                const params = route.params as any;
                if (params?.from === "SalesHistory") {
                  navigation.navigate("SalesHistory" as never);
                } else {
                  navigation.goBack();
                }
              }}
            >
              Kembali
            </Button>
          </>
        }
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontWeight: "bold",
    color: "#1E293B",
  },
  trxChip: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: "#FFF1F2",
  },
  trxChipText: {
    color: "#E11D48",
    fontWeight: "600",
  },
  editButton: {
    borderRadius: 10,
  },
  infoCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  label: {
    color: "#64748B",
  },
  value: {
    color: "#1E293B",
    fontWeight: "500",
  },
  totalText: {
    fontWeight: "bold",
    color: "#10B981",
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemName: {
    fontWeight: "600",
    color: "#1E293B",
  },
  itemMeta: {
    color: "#64748B",
  },
  itemSubtotal: {
    fontWeight: "bold",
    color: "#1E293B",
  },
  printButton: {
    borderRadius: 12,
    marginTop: 10,
  },
  backButton: {
    borderRadius: 12,
    marginTop: 10,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
