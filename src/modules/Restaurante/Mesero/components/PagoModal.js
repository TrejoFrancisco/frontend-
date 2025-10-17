import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { API } from "../../../../services/api";

export default function PagoModal({
  visible,
  onClose,
  onSuccess,
  token,
  comanda,
  isUnificada = false,
}) {
  const [pagos, setPagos] = useState([{ metodo: "efectivo", monto: "" }]);
  const [loading, setLoading] = useState(false);

  // Calcular total al abrir el modal
  useEffect(() => {
    if (visible && comanda) {
      const total = calcularTotal();
      setPagos([{ metodo: "efectivo", monto: total.toString() }]);
    }
  }, [visible, comanda]);

  const calcularTotal = () => {
    if (isUnificada) {
      return comanda?.total || 0;
    }

    // Para comandas individuales, sumar productos entregados
    return (
      comanda?.productos
        ?.filter((producto) => producto.pivot?.estado === "entregado")
        .reduce((sum, p) => sum + parseFloat(p.precio_venta || 0), 0) || 0
    );
  };

  const agregarPago = () => {
    setPagos((prev) => [...prev, { metodo: "efectivo", monto: "" }]);
  };

  const actualizarPago = (index, field, value) => {
    setPagos((prev) => {
      const nuevosPagos = [...prev];
      nuevosPagos[index][field] = value;
      return nuevosPagos;
    });
  };

  const eliminarPago = (index) => {
    if (pagos.length > 1) {
      setPagos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const procesarPago = async () => {
    const pagosValidos = pagos.filter(
      (p) => p.monto && parseFloat(p.monto) > 0
    );

    if (pagosValidos.length === 0) {
      Alert.alert("Error", "Debe ingresar al menos un monto válido");
      return;
    }

    try {
      setLoading(true);

      const endpoint = isUnificada
        ? `/restaurante/mesero/comanda_unificada/pago/${comanda.id}`
        : `/restaurante/mesero/comanda_pago/${comanda.id}`;

      const response = await API.post(
        endpoint,
        {
          pagos: pagosValidos.map((p) => ({
            metodo: p.metodo,
            monto: parseFloat(p.monto),
          })),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Éxito", response.data.message);
        setPagos([{ metodo: "efectivo", monto: "" }]);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.log("Error al procesar pago:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message || "Error al procesar el pago"
      );
    } finally {
      setLoading(false);
    }
  };

  const total = calcularTotal();
  const totalPagos = pagos.reduce(
    (sum, p) => sum + (parseFloat(p.monto) || 0),
    0
  );
  const faltante = total - totalPagos;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Procesar Pago</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Información de la comanda */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {isUnificada ? "Mesas:" : "Mesa:"}
                </Text>
                <Text style={styles.infoValue}>{comanda?.mesa}</Text>
              </View>
              {isUnificada && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Comensales:</Text>
                  <Text style={styles.infoValue}>{comanda?.comensales}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total a pagar:</Text>
                <Text style={styles.infoValueTotal}>${total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Lista de pagos */}
            <ScrollView style={styles.pagosScroll}>
              {pagos.map((pago, index) => (
                <View key={index} style={styles.pagoItem}>
                  <Text style={styles.pagoLabel}>Pago #{index + 1}</Text>

                  {/* Métodos de pago */}
                  <View style={styles.metodosContainer}>
                    {["efectivo", "tarjeta", "transferencia"].map((metodo) => (
                      <TouchableOpacity
                        key={metodo}
                        style={[
                          styles.metodoPago,
                          pago.metodo === metodo && styles.metodoPagoSelected,
                        ]}
                        onPress={() => actualizarPago(index, "metodo", metodo)}
                      >
                        <Text
                          style={[
                            styles.metodoPagoText,
                            pago.metodo === metodo &&
                              styles.metodoPagoTextSelected,
                          ]}
                        >
                          {metodo.charAt(0).toUpperCase() + metodo.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Monto */}
                  <View style={styles.montoRow}>
                    <Text style={styles.montoLabel}>Monto:</Text>
                    <TextInput
                      style={styles.montoInput}
                      value={pago.monto}
                      onChangeText={(value) =>
                        actualizarPago(index, "monto", value)
                      }
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#999"
                    />
                    {pagos.length > 1 && (
                      <TouchableOpacity
                        style={styles.eliminarButton}
                        onPress={() => eliminarPago(index)}
                      >
                        <Text style={styles.eliminarText}>❌</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {/* Botón agregar pago */}
              <TouchableOpacity
                style={styles.agregarPagoButton}
                onPress={agregarPago}
              >
                <Text style={styles.agregarPagoText}>
                  + Agregar otro método de pago
                </Text>
              </TouchableOpacity>

              {/* Resumen */}
              <View style={styles.resumenContainer}>
                <View style={styles.resumenRow}>
                  <Text style={styles.resumenLabel}>Total a pagar:</Text>
                  <Text style={styles.resumenTotal}>${total.toFixed(2)}</Text>
                </View>
                <View style={styles.resumenRow}>
                  <Text style={styles.resumenLabel}>Total pagado:</Text>
                  <Text style={styles.resumenPagado}>
                    ${totalPagos.toFixed(2)}
                  </Text>
                </View>
                {faltante !== 0 && (
                  <View style={styles.resumenRow}>
                    <Text style={styles.resumenLabel}>
                      {faltante > 0 ? "Faltante:" : "Cambio:"}
                    </Text>
                    <Text
                      style={[
                        styles.resumenFaltante,
                        faltante < 0 && styles.resumenCambio,
                      ]}
                    >
                      ${Math.abs(faltante).toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Botones */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPagos([{ metodo: "efectivo", monto: "" }]);
                  onClose();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.pagarButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={procesarPago}
                disabled={loading}
              >
                <Text style={styles.pagarButtonText}>
                  {loading ? "Procesando..." : "Procesar Pago"}
                </Text>
              </TouchableOpacity>
            </View>
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
  modalWrapper: {
    width: "90%",
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxHeight: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#999",
    fontWeight: "bold",
  },
  infoContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  infoValueTotal: {
    fontSize: 17,
    color: "#28a745",
    fontWeight: "bold",
  },
  pagosScroll: {
    maxHeight: 350,
  },
  pagoItem: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pagoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  metodosContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  metodoPago: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  metodoPagoSelected: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  metodoPagoText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  metodoPagoTextSelected: {
    color: "white",
  },
  montoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  montoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    minWidth: 60,
  },
  montoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
  },
  eliminarButton: {
    marginLeft: 8,
    padding: 4,
  },
  eliminarText: {
    fontSize: 18,
  },
  agregarPagoButton: {
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 8,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  agregarPagoText: {
    color: "#007bff",
    fontWeight: "600",
    fontSize: 14,
  },
  resumenContainer: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  resumenLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  resumenTotal: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  resumenPagado: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "bold",
  },
  resumenFaltante: {
    fontSize: 16,
    color: "#dc3545",
    fontWeight: "bold",
  },
  resumenCambio: {
    color: "#28a745",
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
  pagarButton: {
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
  pagarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
