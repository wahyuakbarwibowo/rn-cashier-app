import React, { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, View, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Product } from "../types/database";
import { deleteProduct, getProducts } from "../database/products";
import {
  Button,
  Card,
  Divider,
  Surface,
  Subheading,
  Text,
  Title,
  useTheme,
} from "react-native-paper";

interface ProductCardProps {
  item: Product;
  onEdit: () => void;
  onDelete: () => void;
  onPress: () => void;
  onAddStock: () => void;
}

function ProductCard({
  item,
  onEdit,
  onDelete,
  onPress,
  onAddStock,
}: ProductCardProps) {
  return (
    <Card style={styles.productCard} mode="elevated" onPress={onPress}>
      <Card.Content>
        <View style={styles.productHeader}>
          <View>
            <Title style={styles.productName}>{item.name}</Title>
            <View style={styles.productMeta}>
              <Subheading style={styles.productPrice}>
                Rp {(item.selling_price ?? 0).toLocaleString("id-ID")}
              </Subheading>
              <Text style={styles.productStock}>Stok: {item.stock}</Text>
            </View>
          </View>
          {item.code ? (
            <Text style={styles.productCode}>{item.code}</Text>
          ) : null}
        </View>
      </Card.Content>
      <Divider />
      <Card.Actions style={styles.cardActions}>
        <Button
          mode="contained-tonal"
          compact
          buttonColor="#10B981"
          textColor="#FFF"
          onPress={onAddStock}
          style={styles.actionButtonPrimary}
        >
          + Stok
        </Button>
        <Button
          mode="text"
          compact
          textColor="#2563EB"
          onPress={onEdit}
          style={styles.actionButton}
        >
          Ubah
        </Button>
        <Button
          mode="text"
          compact
          textColor="#DC2626"
          onPress={onDelete}
          style={styles.actionButton}
        >
          Hapus
        </Button>
      </Card.Actions>
    </Card>
  );
}

export default function ProductsScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
  const theme = useTheme();

  const loadProducts = useCallback(async (page: number = 0) => {
    try {
      const isInitialLoad = page === 0;
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const offset = page * PAGE_SIZE;
      const items = await getProducts(PAGE_SIZE, offset);

      if (isInitialLoad) {
        setProducts(items);
        setCurrentPage(0);
      } else {
        setProducts(prev => [...prev, ...items]);
        setCurrentPage(page);
      }

      setHasMore(items.length === PAGE_SIZE);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts(0);
    }, [loadProducts])
  );

  const handleEndReached = () => {
    if (!loadingMore && !loading && hasMore) {
      loadProducts(currentPage + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts(0);
  };

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
        onEdit={() => navigation.navigate("ProductForm", { product: item })}
        onDelete={() => item.id && handleDelete(item.id)}
        onPress={() =>
          navigation.navigate("ProductDetail", {
            product: item,
          })
        }
        onAddStock={() =>
          navigation.navigate("PurchaseForm", { addProductId: item.id })
        }
      />
    ),
    [handleDelete, navigation]
  );

  const listEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        Belum ada produk. Tambahkan produk baru terlebih dahulu.
      </Text>
      <Button
        mode="contained"
        buttonColor="#111827"
        textColor="#FFF"
        onPress={() => navigation.navigate("ProductForm")}
        style={styles.actionButtonEmpty}
      >
        Tambah Produk
      </Button>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background || "#F3F4F6" },
      ]}
    >
      <Surface
        style={[styles.headerSurface, { backgroundColor: theme.colors.surface }]}
      >
        <View>
          <Title style={styles.title}>Daftar Produk</Title>
          <Subheading style={styles.subtitle}>
            {products.length} produk tersedia
          </Subheading>
        </View>
        <Button
          mode="contained"
          buttonColor="#111827"
          textColor="#FFF"
          onPress={() => navigation.navigate("ProductForm")}
          style={styles.addButton}
        >
          Tambah Produk
        </Button>
      </Surface>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id?.toString() ?? ""}
        renderItem={renderProductItem}
        ItemSeparatorComponent={() => <Divider style={styles.listDivider} />}
        contentContainerStyle={styles.listContent}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E11D48']}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#111827" />
            </View>
          ) : null
        }
        ListEmptyComponent={listEmptyComponent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSurface: {
    margin: 16,
    marginBottom: 4,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 13,
    color: "#6B7280",
  },
  addButton: {
    height: 44,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  listDivider: {
    backgroundColor: "#E5E7EB",
    height: 1,
    marginVertical: 6,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
  },
  actionButtonEmpty: {
    alignSelf: "center",
  },
  productCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  productPrice: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },
  productStock: {
    fontSize: 13,
    color: "#6B7280",
    marginLeft: 12,
  },
  productCode: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  cardActions: {
    justifyContent: "flex-end",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingBottom: 6,
  },
  actionButton: {
    marginLeft: 6,
  },
  actionButtonPrimary: {
    flex: 1,
    marginLeft: 0,
  },
});
