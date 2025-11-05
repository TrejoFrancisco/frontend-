import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { API } from "../../../../services/api";

export default function AperturaCajaModal({
  visible,
  onClose,
  onSuccess,
  token,
}) {
  const [montoInicial, setMontoInicial] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAbrirCaja = async () => {
    if (!montoInicial || parseFloat(montoInicial) < 0) {
      Alert.alert("Error", "Debes ingresar un monto inicial válido");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post(
        "/restaurante/cajero/apertura",
        {
          monto_inicial: parseFloat(montoInicial),
          notas: notas || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Éxito", response.data.message);
        setMontoInicial("");
        setNotas("");
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.log("Error al abrir caja:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message || "Error al abrir la caja"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🔓 Apertura de Caja</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Monto Inicial *</Text>
            <TextInput
              style={styles.input}
              value={montoInicial}
              onChangeText={setMontoInicial}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notas}
              onChangeText={setNotas}
              placeholder="Comentarios adicionales..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setMontoInicial("");
                setNotas("");
                onClose();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.abrirButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleAbrirCaja}
              disabled={loading}
            >
              <Text style={styles.abrirButtonText}>
                {loading ? "Abriendo..." : "Abrir Caja"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  abrirButton: {
    backgroundColor: "#28a745",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  abrirButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
