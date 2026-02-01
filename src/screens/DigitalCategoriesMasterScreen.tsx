import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { 
  getDigitalCategories, 
  addDigitalCategory, 
  updateDigitalCategory,
  deleteDigitalCategory, 
  DigitalCategory 
} from "../database/digital_products";

export default function DigitalCategoriesMasterScreen() {
  const [categories, setCategories] = useState<DigitalCategory[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DigitalCategory | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("✨");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await getDigitalCategories();
    setCategories(data);
  };

  const handleSave = async () => {
    if (!name) {
      Alert.alert("Error", "Mohon isi nama kategori");
      return;
    }

    try {
      if (editingCategory) {
        await updateDigitalCategory(editingCategory.id, name, icon);
      } else {
        await addDigitalCategory(name, icon);
      }
      setModalVisible(false);
      resetForm();
      loadCategories();
    } catch (e) {
      Alert.alert("Error", "Gagal menyimpan kategori");
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setName("");
    setIcon("✨");
  };

  const openEdit = (cat: DigitalCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Hapus", "Yakin ingin menghapus kategori ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
          await deleteDigitalCategory(id);
          loadCategories();
        } 
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📁 Kategori Digital</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetForm(); setModalVisible(true); }}>
          <Text style={styles.addBtnText}>+ Kategori</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.catIcon}>{item.icon}</Text>
              <Text style={styles.catName}>{item.name}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn}>
                <Text>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCategory ? "Edit Kategori" : "Tambah Kategori"}</Text>
            
            <Text style={styles.inputLabel}>Nama Kategori</Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName} 
              placeholder="Misal: VOUCHER" 
            />

            <Text style={styles.inputLabel}>Icon (Emoji)</Text>
            <TextInput 
              style={styles.input} 
              value={icon} 
              onChangeText={setIcon} 
              placeholder="✨" 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#111827', fontWeight: 'bold' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{editingCategory ? "Update" : "Simpan"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#FFF', fontWeight: 'bold' },
  card: { 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2 
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { fontSize: 24, marginRight: 12 },
  catName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  actions: { flexDirection: 'row' },
  iconBtn: { padding: 8, marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#4B5563', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12 },
  modalActions: { flexDirection: 'row', marginTop: 24, gap: 12 },
  btn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F3F4F6' },
  saveBtn: { backgroundColor: '#3B82F6' },
});
