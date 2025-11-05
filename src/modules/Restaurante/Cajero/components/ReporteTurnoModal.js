import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { API } from "../../../../services/api";

export default function ReporteTurnoModal({ visible, onClose, token }) {
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchReporte();
    }
  }, [visible]);

  const fetchReporte = async () => {
    try {
      setLoading(true);

      const response = await API.get("/restaurante/cajero/reporte-turno", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setReporte(response.data.data);
      }
    } catch (error) {
      console.log("Error al obtener reporte:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message || "Error al obtener el reporte"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!reporte) {
    return null;
  }
  // Función helper para formatear fecha
  const formatearFecha = (fecha) => {
    try {
      if (!fecha) return "Fecha no disponible";
      return new Date(fecha).toLocaleString("es-MX");
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha no disponible";
    }
  };
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 Reporte del Turno</Text>

            <ScrollView style={styles.reporteScroll}>
              {/* Info del arqueo */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Información del Turno</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>
                    {formatearFecha(reporte.arqueo.fecha)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Hora Apertura:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(reporte.arqueo.hora_apertura).toLocaleTimeString(
                      "es-MX"
                    )}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Monto Inicial:</Text>
                  <Text style={styles.infoValue}>
                    ${reporte.arqueo.monto_inicial.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Resumen */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Resumen de Ventas</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Comandas Cobradas:</Text>
                  <Text style={styles.infoValueBold}>
                    {reporte.resumen.comandas_cobradas}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Ventas:</Text>
                  <Text style={styles.infoValueBold}>
                    ${reporte.resumen.total_ventas.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Descuentos:</Text>
                  <Text style={styles.infoValueDanger}>
                    -${reporte.resumen.total_descuentos.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Efectivo en Caja:</Text>
                  <Text style={styles.infoValueSuccess}>
                    $
                    {reporte.resumen.efectivo_en_caja.toFixed(2) -
                      reporte.resumen.total_descuentos.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Pagos por método */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pagos por Método</Text>
                <View style={styles.metodosContainer}>
                  <View style={styles.metodoItem}>
                    <Text style={styles.metodoLabel}>💵 Efectivo</Text>
                    <Text style={styles.metodoMonto}>
                      ${reporte.resumen.pagos_por_metodo.efectivo.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.metodoItem}>
                    <Text style={styles.metodoLabel}>💳 Tarjeta</Text>
                    <Text style={styles.metodoMonto}>
                      ${reporte.resumen.pagos_por_metodo.tarjeta.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.metodoItem}>
                    <Text style={styles.metodoLabel}>🏦 Transferencia</Text>
                    <Text style={styles.metodoMonto}>
                      $
                      {reporte.resumen.pagos_por_metodo.transferencia.toFixed(
                        2
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.cerrarButton} onPress={onClose}>
              <Text style={styles.cerrarButtonText}>Cerrar</Text>
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
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  reporteScroll: {
    maxHeight: 500,
  },
  section: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  infoValueBold: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  infoValueSuccess: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "bold",
  },
  infoValueDanger: {
    fontSize: 14,
    color: "#dc3545",
    fontWeight: "bold",
  },
  metodosContainer: {
    gap: 8,
  },
  metodoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  metodoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  metodoMonto: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#28a745",
  },
  cerrarButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cerrarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
