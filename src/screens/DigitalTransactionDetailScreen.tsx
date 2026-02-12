import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getDB } from "../database/initDB";
import { DigitalTransaction } from "../database/pulsa";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { printDigitalReceipt } from "../services/PrintService";

export default function DigitalTransactionDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { trxId } = route.params;

  const [trx, setTrx] = useState<DigitalTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [trxId]);

  const loadDetail = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      const data = await db.getFirstAsync<DigitalTransaction>(
        "SELECT * FROM phone_history WHERE id = ?",
        [trxId]
      );
      setTrx(data || null);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Gagal memuat detail transaksi");
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
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!trx) {
    return (
      <View style={styles.center}>
        <Text>Transaksi tidak ditemukan</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <View style={styles.header}>
          <Text style={styles.title}>Detail Transaksi Digital</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{trx.category}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <DetailRow label="ID Transaksi" value={`#TRX-DIG-${trx.id}`} />
          <DetailRow label="Tanggal" value={formatDate(trx.created_at)} />
          <View style={styles.divider} />
          <DetailRow label="No. Tujuan / HP" value={trx.phone_number} bold />
          <DetailRow label="Nama Pelanggan" value={trx.customer_name || "-"} />
          <DetailRow label="Provider / Item" value={trx.provider} />
          <DetailRow label="Nominal" value={`Rp ${trx.amount.toLocaleString("id-ID")}`} />
          <View style={styles.divider} />
          <DetailRow label="Harga Modal" value={`Rp ${trx.cost_price.toLocaleString("id-ID")}`} />
          <DetailRow label="Harga Jual" value={`Rp ${trx.selling_price.toLocaleString("id-ID")}`} color="#1D4ED8" bold />
          <DetailRow label="Keuntungan" value={`Rp ${trx.profit.toLocaleString("id-ID")}`} color="#16A34A" bold />
        </View>

        {trx.notes && (
          <View style={styles.card}>
            <Text style={styles.label}>Catatan / Token / Ref</Text>
            <Text style={styles.notesText}>{trx.notes}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.printButton}
          onPress={() => trx && printDigitalReceipt(trx)}
        >
          <Text style={styles.printButtonText}>🖨️ Cetak Struk</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, color ? { color } : {}, bold ? { fontWeight: 'bold' } : {}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: "bold", color: "#111827", flex: 1 },
  badge: { backgroundColor: "#111827", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 6 },
  label: { color: "#6B7280", fontSize: 14 },
  value: { color: "#111827", fontSize: 14, textAlign: 'right', flex: 1, marginLeft: 10 },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 12 },
  notesText: { marginTop: 8, fontSize: 15, color: "#111827", fontWeight: '500', lineHeight: 22 },
  printButton: { backgroundColor: "#16A34A", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  printButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  backButton: { backgroundColor: "#111827", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 10 },
  backButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
