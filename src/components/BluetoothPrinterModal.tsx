import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  Modal,
  Portal,
  Text,
  Button,
  List,
  Divider,
  IconButton,
} from "react-native-paper";
import {
  BluetoothManager,
} from "@vardrz/react-native-bluetooth-escpos-printer";

interface BluetoothPrinterModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (device: any) => void;
}

export default function BluetoothPrinterModal({
  visible,
  onClose,
  onSelect,
}: BluetoothPrinterModalProps) {
  const [pairedDevices, setPairedDevices] = useState<any[]>([]);
  const [foundDevices, setFoundDevices] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPairedDevices();
    }
    
    const deviceFoundListener = BluetoothManager.addListener(
      BluetoothManager.EVENT_DEVICE_FOUND,
      (rsp) => {
        try {
          const device = JSON.parse(rsp);
          setFoundDevices((prev) => {
            if (prev.some((d) => d.address === device.address)) return prev;
            return [...prev, device];
          });
        } catch (e) {
          console.error("Error parsing found device:", e);
        }
      }
    );

    return () => {
      deviceFoundListener.remove();
    };
  }, [visible]);

  const loadPairedDevices = async () => {
    try {
      const r = await BluetoothManager.getPairedDevices();
      const paired = r.map((item: string) => JSON.parse(item));
      setPairedDevices(paired);
    } catch (e) {
      console.error("Error loading paired devices:", e);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    setFoundDevices([]);
    try {
      await BluetoothManager.scanDevices();
      setTimeout(() => {
        setIsScanning(false);
      }, 10000); // Stop scan after 10s
    } catch (e) {
      console.error("Error scanning devices:", e);
      setIsScanning(false);
    }
  };

  const renderDevice = ({ item }: { item: any }) => (
    <List.Item
      title={item.name || "Unknown Device"}
      description={item.address}
      left={(props) => <List.Icon {...props} icon="printer" />}
      onPress={() => onSelect(item)}
    />
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text variant="titleLarge">Pilih Printer Bluetooth</Text>
          <IconButton icon="close" onPress={onClose} />
        </View>

        <View style={styles.content}>
          <Text variant="labelLarge" style={styles.sectionTitle}>
            Perangkat Terpasang (Paired)
          </Text>
          <FlatList
            data={pairedDevices}
            keyExtractor={(item) => item.address}
            renderItem={renderDevice}
            ItemSeparatorComponent={() => <Divider />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Tidak ada perangkat terpasang.</Text>
            }
            style={styles.list}
          />

          <Divider style={styles.divider} />

          <View style={styles.scanHeader}>
            <Text variant="labelLarge">Perangkat Ditemukan</Text>
            {isScanning ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Button mode="text" onPress={startScan}>
                Scan
              </Button>
            )}
          </View>

          <FlatList
            data={foundDevices}
            keyExtractor={(item) => item.address}
            renderItem={renderDevice}
            ItemSeparatorComponent={() => <Divider />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isScanning ? "Mencari..." : "Klik Scan untuk mencari."}
              </Text>
            }
            style={styles.list}
          />
        </View>

        <Button mode="contained" onPress={onClose} style={styles.closeButton}>
          Tutup
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    marginBottom: 8,
    color: "#666",
  },
  scanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  list: {
    maxHeight: 200,
  },
  emptyText: {
    padding: 10,
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
  },
  divider: {
    marginVertical: 10,
  },
  closeButton: {
    marginTop: 15,
  },
});
