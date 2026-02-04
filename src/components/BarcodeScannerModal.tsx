import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { CameraView } from "expo-camera";

interface BarcodeScannerModalProps {
  visible: boolean;
  onScanned: (event: { data: string }) => void;
  onClose: () => void;
  title?: string;
}

export default function BarcodeScannerModal({
  visible,
  onScanned,
  onClose,
  title = "Scan Barcode Barang",
}: BarcodeScannerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.scannerContainer}>
        <CameraView
          onBarcodeScanned={visible ? onScanned : undefined}
          style={StyleSheet.absoluteFillObject}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39", "upc_a", "upc_e"],
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.scanText}>{title}</Text>
          </View>
          
          <View style={styles.unfocusContainer}></View>
          
          <View style={styles.middleContainer}>
            <View style={styles.unfocusContainer}></View>
            <View style={styles.focusedContainer}></View>
            <View style={styles.unfocusContainer}></View>
          </View>
          
          <View style={styles.unfocusContainer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Tutup Kamera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
  },
  scanText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  unfocusContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  middleContainer: {
    flexDirection: "row",
    height: 250,
  },
  focusedContainer: {
    width: 250,
    borderWidth: 2,
    borderColor: "#3B82F6",
    backgroundColor: "transparent",
    borderRadius: 20,
  },
  closeBtn: {
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    marginTop: 20,
  },
  closeBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
