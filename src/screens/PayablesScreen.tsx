import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { getDB } from "../database/initDB";

export default function PayablesScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await getDB();
      const res = await db.getAllAsync(
        `SELECT p.*, pur.created_at as purchase_date, s.phone as supplier_phone 
         FROM payables p
         JOIN purchases pur ON p.purchase_id = pur.id
         LEFT JOIN suppliers s ON p.supplier_id = s.id
         ORDER BY p.id DESC`
      );
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'pending' ? 'paid' : 'pending';
      const db = await getDB();
      await db.runAsync("UPDATE payables SET status = ? WHERE id = ?", [newStatus, id]);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💸 Hutang (ke Supplier)</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.supplier || 'Supplier Umum'}</Text>
                  {item.supplier_phone ? <Text style={styles.phone}>{item.supplier_phone}</Text> : null}
                  <Text style={styles.date}>Purchase #{item.purchase_id} | {new Date(item.purchase_date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.amount}>Rp {item.amount.toLocaleString("id-ID")}</Text>
              </View>
              <View style={styles.footer}>
                <Text style={[styles.status, item.status === 'paid' ? styles.paid : styles.pending]}>
                  {item.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                </Text>
                <TouchableOpacity 
                   onPress={() => handleUpdateStatus(item.id, item.status)}
                   style={styles.actionBtn}
                >
                   <Text style={styles.actionText}>{item.status === 'paid' ? 'Batalkan Lunas' : 'Tandai Lunas'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Tidak ada hutang</Text>}
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
  phone: { fontSize: 13, color: "#4B5563" },
  date: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  amount: { fontSize: 16, fontWeight: "bold", color: "#EF4444" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  status: { fontWeight: "bold", fontSize: 12 },
  paid: { color: "#16A34A" },
  pending: { color: "#D97706" },
  actionBtn: { backgroundColor: "#111827", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  actionText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  empty: { textAlign: "center", marginTop: 40, color: "#9CA3AF" }
});
