import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { getDigitalTransactions, DigitalTransaction } from "../database/pulsa";

export default function DigitalTransactionHistoryScreen() {
  const navigation = useNavigation<any>();
  const [transactions, setTransactions] = useState<DigitalTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDigitalTransactions();
      setTransactions(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "PULSA": return "#3B82F6";
      case "PLN": return "#F59E0B";
      case "TRANSFER": return "#10B981";
      case "GAME": return "#8B5CF6";
      default: return "#6B7280";
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📜 Riwayat Digital</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        onRefresh={loadData}
        refreshing={loading}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate("DigitalDetail", { trxId: item.id })}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: getCategoryColor(item.category) }]}>
                <Text style={styles.badgeText}>{item.category}</Text>
              </View>
              <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            </View>
            
            <View style={styles.cardBody}>
              <View style={{ flex: 1 }}>
                <Text style={styles.phoneText}>{item.phone_number}</Text>
                {item.customer_name && <Text style={styles.customerText}>{item.customer_name}</Text>}
                <Text style={styles.providerText}>{item.provider}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amountText}>Rp {item.selling_price.toLocaleString("id-ID")}</Text>
                <Text style={styles.profitText}>Untung: Rp {item.profit.toLocaleString("id-ID")}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Belum ada transaksi digital</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#111827" },
  listContainer: { paddingBottom: 20 },
  card: { backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "bold" },
  dateText: { fontSize: 12, color: "#6B7280" },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phoneText: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  customerText: { fontSize: 13, color: "#374151", marginVertical: 2 },
  providerText: { fontSize: 12, color: "#6B7280" },
  amountText: { fontSize: 16, fontWeight: "bold", color: "#111827" },
  profitText: { fontSize: 11, color: "#16A34A", fontWeight: '600', marginTop: 4 },
  emptyContainer: { alignItems: "center", marginTop: 50 },
  emptyText: { color: "#9CA3AF", fontSize: 16 }
});
