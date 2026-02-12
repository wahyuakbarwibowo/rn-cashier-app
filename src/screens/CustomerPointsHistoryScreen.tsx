import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { getDB } from "../database/initDB";
import { CustomerPointsHistory } from "../types/database";

export default function CustomerPointsHistoryScreen() {
    const route = useRoute<any>();
    const { customerId, customerName } = route.params;

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [history, setHistory] = useState<CustomerPointsHistory[]>([]);

    useEffect(() => {
        loadHistory();
    }, [customerId]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const db = await getDB();
            const data = await db.getAllAsync<CustomerPointsHistory>(
                "SELECT * FROM customer_points_history WHERE customer_id = ? ORDER BY created_at DESC",
                [customerId]
            );
            setHistory(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadHistory();
    };

    const renderItem = ({ item }: { item: CustomerPointsHistory }) => (
        <View style={styles.historyCard}>
            <View style={styles.historyInfo}>
                <Text style={styles.historyType}>
                    {item.type === 'EARNED' ? '➕ Dapat Poin' : item.type === 'REDEEMED' ? '➖ Tukar Poin' : '⚙️ Penyesuaian'}
                </Text>
                <Text style={styles.historyNotes}>{item.notes || 'Tanpa catatan'}</Text>
                <Text style={styles.historyDate}>
                    {new Date(item.created_at!).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                    })}
                </Text>
            </View>
            <View style={styles.historyValue}>
                <Text style={[
                    styles.pointsText,
                    item.points > 0 ? styles.positivePoints : styles.negativePoints
                ]}>
                    {item.points > 0 ? `+${item.points}` : item.points} Pts
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{customerName}</Text>
                <Text style={styles.headerSubtitle}>Riwayat Poin Pelanggan</Text>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#FB7185" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id!.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Belum ada riwayat poin.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    header: {
        backgroundColor: "#FFF",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 2,
    },
    listContent: {
        padding: 16,
    },
    historyCard: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    historyInfo: {
        flex: 1,
    },
    historyType: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 4,
    },
    historyNotes: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 11,
        color: "#9CA3AF",
    },
    historyValue: {
        alignItems: "flex-end",
    },
    pointsText: {
        fontSize: 16,
        fontWeight: "bold",
    },
    positivePoints: {
        color: "#10B981",
    },
    negativePoints: {
        color: "#EF4444",
    },
    emptyContainer: {
        marginTop: 50,
        alignItems: "center",
    },
    emptyText: {
        color: "#9CA3AF",
        fontSize: 14,
    },
});
