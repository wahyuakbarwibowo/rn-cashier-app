import { StyleSheet } from "react-native";

export const modalStyles = StyleSheet.create({
  // Modal Container & Content
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  content: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },

  // ScrollView
  scrollView: {
    showsVerticalScrollIndicator: false,
    scrollEnabled: true,
    bounces: false,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },

  // Actions
  modalActions: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#F3F4F6",
  },
  saveBtn: {
    backgroundColor: "#111827",
  },
  btnText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  cancelBtnText: {
    color: "#111827",
    fontWeight: "bold",
  },

  // Close Button
  closeBtn: {
    backgroundColor: "#111827",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  closeBtnText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
