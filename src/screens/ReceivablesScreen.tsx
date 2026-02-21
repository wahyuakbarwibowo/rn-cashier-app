import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  RefreshControl,
} from "react-native";
import { getDB } from "../database/initDB";
import { getShopProfile } from "../database/settings";
import { useFocusEffect } from "@react-navigation/native";

export default function ReceivablesScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shopName, setShopName] = useState("");

  const loadData = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const db = await getDB();
      const [res, shop] = await Promise.all([
        db.getAllAsync(
          `SELECT r.*, c.name as customer_name, c.phone as customer_phone, s.created_at as sale_date
           FROM receivables r
           JOIN customers c ON r.customer_id = c.id
           JOIN sales s ON r.sale_id = s.id
           ORDER BY r.status DESC, r.id DESC`
        ),
        getShopProfile()
      ]);
      setData(res);
      if (shop) setShopName(shop.name ?? "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }) + " WIB";
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
      const db = await getDB();
      await db.runAsync("UPDATE receivables SET status = ? WHERE id = ?", [newStatus, id]);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleTagihWA = (item: any) => {
    if (!item.customer_phone || item.customer_phone.trim() === "") {
      Alert.alert("Error", "Nomor WhatsApp pelanggan tidak tersedia.");
      return;
    }

    let phone = item.customer_phone.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) {
      phone = "62" + phone.slice(1);
    } else if (!phone.startsWith("62")) {
      phone = "62" + phone;
    }

    const date = formatDate(item.sale_date);
    const amount = item.amount.toLocaleString("id-ID");
    const message = `Halo Kak ${item.customer_name},\n\nKami dari *${shopName || "Toko Kasir"}* menginformasikan perihal piutang sebesar *Rp ${amount}* dari transaksi tanggal ${date}.\n\nMohon untuk segera melakukan pembayaran. Terima kasih 🙏`;

    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        Linking.openURL(webUrl);
      }
    }).catch(() => {
      Alert.alert("Error", "Gagal membuka WhatsApp");
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💰 Piutang Pelanggan</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#E11D48']}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.customer_name}</Text>
                  <Text style={styles.date}>TRX-{item.sale_id} | {formatDate(item.sale_date)}</Text>
                </View>
                <Text style={styles.amount}>Rp {item.amount.toLocaleString("id-ID")}</Text>
              </View>
              <View style={styles.footer}>
                <Text style={[styles.status, item.status === 'paid' ? styles.paid : styles.pending]}>
                  {item.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                </Text>
                <View style={styles.actionRow}>
                  {item.status === 'pending' && (
                    <TouchableOpacity
                      onPress={() => handleTagihWA(item)}
                      style={[styles.actionBtn, styles.waBtn]}
                    >
                      <Text style={styles.actionText}>💬 Tagih WA</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleUpdateStatus(item.id, item.status)}
                    style={styles.actionBtn}
                  >
                    <Text style={styles.actionText}>{item.status === 'paid' ? 'Batalkan Lunas' : 'Selesaikan'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Tidak ada piutang</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  card: { backgroundColor: "#FFF", padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 16, fontWeight: "bold" },
  date: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  amount: { fontSize: 16, fontWeight: "bold", color: "#EF4444" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  status: { fontWeight: "bold", fontSize: 12 },
  paid: { color: "#16A34A" },
  pending: { color: "#D97706" },
  actionBtn: { backgroundColor: "#111827", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  waBtn: { backgroundColor: "#16A34A" },
  actionRow: { flexDirection: "row" },
  actionText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  empty: { textAlign: "center", marginTop: 40, color: "#9CA3AF" }
});
