import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Card,
  Text,
  Button,
  List,
  Surface,
  ActivityIndicator,
  Portal,
  Modal,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  scanDevices,
  connectToDevice,
  disconnectDevice,
  getConnectedDevice,
} from '../services/BluetoothPrintService';

export default function PrinterSettingsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    const device = getConnectedDevice();
    setConnectedDevice(device);
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const foundDevices = await scanDevices();
      setDevices(foundDevices);
      setShowDeviceModal(true);
    } catch (error: any) {
      Alert.alert('Error', `Gagal scan: ${error.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleConnect = async (device: any) => {
    setConnecting(true);
    setShowDeviceModal(false);
    
    try {
      await connectToDevice(device.address);
      setConnectedDevice(device.address);
      Alert.alert(
        'Sukses',
        `Terhubung ke ${device.name || device.address}`
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        `Gagal connect: ${error.message}. Pastikan printer sudah on dan paired.`
      );
      setConnectedDevice(null);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectDevice();
      setConnectedDevice(null);
      Alert.alert('Sukses', 'Printer terputus');
    } catch (error: any) {
      Alert.alert('Error', `Gagal disconnect: ${error.message}`);
    }
  };

  const formatDeviceName = (device: any) => {
    return device.name || `Printer (${device.address})`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingTop: 20 }}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Settings Printer Bluetooth
          </Text>
          
          <Text variant="bodyMedium" style={styles.description}>
            Connect ke printer thermal 58mm untuk mencetak struk tanpa dialog system.
          </Text>

          <Divider style={styles.divider} />

          {/* Connection Status */}
          <Surface style={styles.statusCard} elevation={1}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: connectedDevice ? '#16A34A' : '#EF4444' },
                ]}
              />
              <Text variant="bodyLarge" style={styles.statusText}>
                {connectedDevice ? 'Terhubung' : 'Tidak Terhubung'}
              </Text>
            </View>
            
            {connectedDevice && (
              <Text variant="bodySmall" style={styles.deviceAddress}>
                Device: {connectedDevice}
              </Text>
            )}
          </Surface>

          {/* Action Buttons */}
          {connecting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator animating size="large" color="#6366F1" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Connecting...
              </Text>
            </View>
          ) : (
            <>
              {!connectedDevice ? (
                <Button
                  mode="contained"
                  onPress={handleScan}
                  loading={scanning}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon="bluetooth-search"
                >
                  {scanning ? 'Scanning...' : 'Scan Printer'}
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={handleDisconnect}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  icon="bluetooth-off"
                >
                  Disconnect
                </Button>
              )}
            </>
          )}

          {/* Instructions */}
          <Card style={styles.infoCard} mode="outlined">
            <Card.Content>
              <Text variant="labelLarge" style={styles.infoTitle}>
                Cara Connect:
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                1. Pastikan printer Bluetooth sudah ON{'\n'}
                2. Pairing printer di Settings Bluetooth HP{'\n'}
                3. Tap "Scan Printer" untuk mencari device{'\n'}
                4. Pilih printer dari list{'\n'}
                5. Printer siap digunakan!
              </Text>
            </Card.Content>
          </Card>
        </Card.Content>
      </Card>

      {/* Device List Modal */}
      <Portal>
        <Modal
          visible={showDeviceModal}
          onDismiss={() => setShowDeviceModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Pilih Printer
          </Text>
          <Divider style={{ marginVertical: 12 }} />
          
          {devices.length === 0 ? (
            <View style={styles.emptyState}>
              <Text variant="bodyMedium">
                {scanning ? 'Sedang scanning...' : 'Tidak ada device ditemukan'}
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.deviceList}>
              {devices.map((device, index) => (
                <List.Item
                  key={index}
                  title={formatDeviceName(device)}
                  description={device.address}
                  left={(props) => <List.Icon {...props} icon="printer" />}
                  onPress={() => handleConnect(device)}
                />
              ))}
            </ScrollView>
          )}
          
          <Button
            mode="text"
            onPress={() => setShowDeviceModal(false)}
            style={{ marginTop: 8 }}
          >
            Tutup
          </Button>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  card: {
    margin: 16,
    borderRadius: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    color: '#6B7280',
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  statusCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontWeight: '600',
  },
  deviceAddress: {
    color: '#6B7280',
    marginLeft: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  actionButton: {
    borderRadius: 12,
    marginBottom: 16,
  },
  actionButtonContent: {
    paddingVertical: 8,
  },
  infoCard: {
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
  },
  infoTitle: {
    color: '#92400E',
    marginBottom: 8,
  },
  infoText: {
    color: '#78350F',
    lineHeight: 22,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    margin: 24,
    borderRadius: 16,
    maxHeight: 500,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#111827',
  },
  deviceList: {
    maxHeight: 300,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
});
