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

export default function CierreCajaModal({
  visible,
  onClose,
  onSuccess,
  token,
  arqueoId,
}) {
  const [montoFinalReal, setMontoFinalReal] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCerrarCaja = async () => {
    if (!montoFinalReal || parseFloat(montoFinalReal) < 0) {
      Alert.alert("Error", "Debes ingresar el monto final contado");
      return;
    }

    Alert.alert(
      "Confirmar Cierre",
      "¿Estás seguro de cerrar la caja? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar Caja",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const response = await API.post(
                `/restaurante/cajero/cierre/${arqueoId}`,
                {
                  monto_final_real: parseFloat(montoFinalReal),
                  notas: notas || null,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.data.success) {
                const data = response.data.data;
                const diferencia = data.arqueo.diferencia;

                let mensaje = "Caja cerrada exitosamente.\n\n";
                mensaje += `Monto Esperado: $${data.arqueo.monto_final_sistema}\n`;
                mensaje += `Monto Contado: $${data.arqueo.monto_final_real}\n`;

                if (diferencia !== 0) {
                  mensaje += `\nDiferencia: $${Math.abs(diferencia)} ${
                    diferencia > 0 ? "(sobrante)" : "(faltante)"
                  }`;
                }

                Alert.alert("Cierre Exitoso", mensaje);
                setMontoFinalReal("");
                setNotas("");
                onSuccess();
                onClose();
              }
            } catch (error) {
              console.log("Error al cerrar caja:", error);
              Alert.alert(
                "Error",
                error.response?.data?.error?.message ||
                  "Error al cerrar la caja"
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🔒 Cierre de Caja</Text>

          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              ⚠️ Cuenta el efectivo en caja antes de cerrar
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Monto Final Contado *</Text>
            <TextInput
              style={styles.input}
              value={montoFinalReal}
              onChangeText={setMontoFinalReal}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notas del Cierre (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notas}
              onChangeText={setNotas}
              placeholder="Observaciones del cierre..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setMontoFinalReal("");
                setNotas("");
                onClose();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.cerrarButton,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleCerrarCaja}
              disabled={loading}
            >
              <Text style={styles.cerrarButtonText}>
                {loading ? "Cerrando..." : "Cerrar Caja"}
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
    marginBottom: 16,
    textAlign: "center",
  },
  warningContainer: {
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    color: "#856404",
    fontWeight: "500",
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
  cerrarButton: {
    backgroundColor: "#dc3545",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  cerrarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
