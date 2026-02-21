import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getDB } from "../database/initDB";
import { DigitalTransaction } from "../database/pulsa";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { printDigitalReceipt } from "../services/PrintService";
import {
  ActivityIndicator,
  Card,
  Button,
  Chip,
  Text,
  Surface,
} from "react-native-paper";

export default function DigitalTransactionDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { trxId } = route.params;

  const [trx, setTrx] = useState<DigitalTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadDetail();
  }, [trxId]);

  // Refresh detail when screen gains focus (after edit)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDetail();
    });
    return unsubscribe;
  }, [navigation]);

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
    }) + " WIB";
  };

  if (loading) {
    return (
    <View style={styles.center}>
      <ActivityIndicator animating size="large" color="#3B82F6" />
    </View>
  );
}

  if (!trx) {
    return (
    <View style={styles.center}>
      <Text variant="bodyLarge">Transaksi tidak ditemukan</Text>
      <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
        Kembali
      </Button>
    </View>
  );
}

  return (
    <Surface style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineMedium" style={styles.title}>Detail Transaksi Digital</Text>
            <Chip style={styles.badge} textStyle={styles.badgeText}>{trx.category}</Chip>
          </View>
          <Button
            mode="contained"
            onPress={() => navigation.navigate("DigitalTransaction", { editTrx: trx })}
            style={styles.editButton}
            contentStyle={{ height: 40 }}
          >
            Edit
          </Button>
        </View>

        <Card style={styles.card} mode="elevated">
          <Card.Content>
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
            <DetailRow label="Dibayar" value={`Rp ${(trx.paid || trx.selling_price).toLocaleString("id-ID")}`} />
            <DetailRow label="Keuntungan" value={`Rp ${trx.profit.toLocaleString("id-ID")}`} color="#16A34A" bold />
          </Card.Content>
        </Card>

        {trx.notes && (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="labelLarge" style={styles.label}>Catatan / Token / Ref</Text>
              <Text variant="bodyMedium" style={styles.notesText}>{trx.notes}</Text>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          icon="printer"
          buttonColor="#16A34A"
          textColor="#FFF"
          disabled={printing}
          loading={printing}
          onPress={async () => {
            if (trx && !printing) {
              setPrinting(true);
              try {
                await printDigitalReceipt(trx);
              } catch (error) {
                console.error("Error printing receipt:", error);
              } finally {
                setPrinting(false);
              }
            }
          }}
          style={styles.printButton}
          contentStyle={{ height: 48 }}
        >
          {printing ? "Mencetak..." : "Cetak Struk"}
        </Button>

        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          contentStyle={{ height: 48 }}
        >
          Kembali
        </Button>
      </ScrollView>
    </Surface>
  );
}

function DetailRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={styles.label}>{label}</Text>
      <Text
        variant="bodyMedium"
        style={[
          styles.value,
          color ? { color } : {},
          bold ? { fontWeight: 'bold' } : {}
        ]}
      >
        {value}
      </Text>
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
    padding: 16,
  },
  header: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: "#111827",
    flex: 1,
  },
  badge: {
    backgroundColor: "#111827",
    alignSelf: "flex-start",
    marginTop: 8,
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  label: {
    color: "#6B7280",
    fontSize: 14,
  },
  value: {
    color: "#111827",
    fontSize: 14,
    textAlign: 'right',
    flex: 1,
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  notesText: {
    marginTop: 8,
    color: "#111827",
    fontWeight: '500',
    lineHeight: 22,
  },
  printButton: {
    marginTop: 10,
    borderRadius: 12,
  },
  backButton: {
    marginTop: 10,
    borderRadius: 12,
  },
  editButton: {
    marginLeft: 12,
  },
});
