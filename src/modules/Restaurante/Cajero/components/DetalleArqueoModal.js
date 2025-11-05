import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
// ✅ Importar desde la API legacy (igual que ReportesSection)
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { API } from "../../../../services/api";

export default function DetalleArqueoModal({
  visible,
  onClose,
  token,
  arqueoId,
}) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const toSafeNumber = (value, decimals = 2) => {
    return Number(value || 0).toFixed(decimals);
  };

  useEffect(() => {
    if (visible && arqueoId) {
      fetchDetalle();
    }
  }, [visible, arqueoId]);

  const fetchDetalle = async () => {
    try {
      setLoading(true);

      const response = await API.get(
        `/restaurante/cajero/detalle-arqueo/${arqueoId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setDetalle(response.data.data);
      }
    } catch (error) {
      console.log("Error al obtener detalle:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message ||
          "Error al obtener el detalle del arqueo"
      );
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Función de descarga usando el mismo patrón que ReportesSection
  const descargarExcel = async () => {
    try {
      setDownloadingExcel(true);

      // Construir la URL con el parámetro format=excel
      const response = await API.get(
        `/restaurante/cajero/detalle-arqueo/${arqueoId}?format=excel`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success && response.data.data?.excel_url) {
        const excelUrl = response.data.data.excel_url;
        const filename =
          response.data.data.filename || `detalle_arqueo_${arqueoId}.xlsx`;

        console.log("Descargando desde:", excelUrl);

        // Usar FileSystem.documentDirectory como en ReportesSection
        const downloadDir = FileSystem.documentDirectory;
        const fileUri = downloadDir + filename;

        console.log("Guardando en:", fileUri);

        const downloadResult = await FileSystem.downloadAsync(
          excelUrl,
          fileUri
        );

        if (downloadResult.status === 200) {
          Alert.alert(
            "✅ Descarga Exitosa",
            "El archivo Excel se ha descargado correctamente.",
            [
              {
                text: "Compartir",
                onPress: async () => {
                  try {
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(downloadResult.uri);
                    } else {
                      Alert.alert(
                        "Info",
                        "Compartir no está disponible en este dispositivo"
                      );
                    }
                  } catch (shareError) {
                    console.error("Error al compartir:", shareError);
                    Alert.alert("Error", "No se pudo compartir el archivo");
                  }
                },
              },
              { text: "OK" },
            ]
          );
        } else {
          throw new Error(
            `Error en la descarga. Status: ${downloadResult.status}`
          );
        }
      } else {
        throw new Error("No se recibió la URL del archivo Excel");
      }
    } catch (error) {
      console.error("Error al descargar Excel:", error);
      Alert.alert(
        "Error al descargar",
        error.response?.data?.error?.message ||
          error.message ||
          "No se pudo generar el archivo Excel"
      );
    } finally {
      setDownloadingExcel(false);
    }
  };

  const formatearFecha = (fecha) => {
    try {
      if (!fecha) return "N/A";
      return new Date(fecha).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  const formatearHora = (fecha) => {
    try {
      if (!fecha) return "N/A";
      return new Date(fecha).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      return "N/A";
    }
  };

  if (loading || !detalle) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Cargando detalle...</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const { arqueo, resumen, descuentos_aplicados, pagos } = detalle;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            {/* HEADER CON TÍTULO Y BOTÓN EXCEL */}
            <View style={styles.headerContainer}>
              <Text style={styles.modalTitle}>
                📋 Detalle de Arqueo #{arqueo.id}
              </Text>

              <TouchableOpacity
                style={[
                  styles.excelButton,
                  downloadingExcel && styles.excelButtonDisabled,
                ]}
                onPress={descargarExcel}
                disabled={downloadingExcel}
              >
                {downloadingExcel ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.excelIcon}>📊</Text>
                    <Text style={styles.excelButtonText}>Excel</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detalleScroll}>
              {/* Información General del Arqueo */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Información General</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>
                    {formatearFecha(arqueo.fecha)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Cajero:</Text>
                  <Text style={styles.infoValue}>
                    {arqueo.cajero?.name || "N/A"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Estado:</Text>
                  <View
                    style={[
                      styles.estadoBadge,
                      arqueo.estado === "abierto"
                        ? styles.estadoAbierto
                        : styles.estadoCerrado,
                    ]}
                  >
                    <Text style={styles.estadoBadgeText}>
                      {arqueo.estado === "abierto"
                        ? "🟢 ABIERTO"
                        : "🔴 CERRADO"}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Hora Apertura:</Text>
                  <Text style={styles.infoValue}>
                    {formatearHora(arqueo.hora_apertura)}
                  </Text>
                </View>

                {arqueo.hora_cierre && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Hora Cierre:</Text>
                    <Text style={styles.infoValue}>
                      {formatearHora(arqueo.hora_cierre)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Resumen Financiero */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💰 Resumen Financiero</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Monto Inicial:</Text>
                  <Text style={styles.infoValue}>
                    ${toSafeNumber(arqueo.monto_inicial)}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Comandas Cobradas:</Text>
                  <Text style={styles.infoValueBold}>
                    {resumen.comandas_cobradas || 0}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Ventas:</Text>
                  <Text style={styles.infoValueSuccess}>
                    ${toSafeNumber(resumen.total_ventas)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Total Descuentos:</Text>
                  <Text style={styles.infoValueDanger}>
                    -${toSafeNumber(resumen.total_descuentos)}
                  </Text>
                </View>

                {arqueo.estado === "cerrado" && (
                  <>
                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Monto Final Sistema:</Text>
                      <Text style={styles.infoValue}>
                        ${toSafeNumber(arqueo.monto_final_sistema)}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Monto Final Real:</Text>
                      <Text style={styles.infoValue}>
                        ${toSafeNumber(arqueo.monto_final_real)}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Diferencia:</Text>
                      <Text
                        style={[
                          styles.infoValueBold,
                          Number(arqueo.diferencia || 0) !== 0
                            ? styles.diferenciaWarning
                            : styles.infoValueSuccess,
                        ]}
                      >
                        ${toSafeNumber(arqueo.diferencia)}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Pagos por Método */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💳 Pagos por Método</Text>

                <View style={styles.metodoItem}>
                  <Text style={styles.metodoLabel}>💵 Efectivo</Text>
                  <Text style={styles.metodoMonto}>
                    ${toSafeNumber(resumen.pagos_por_metodo?.efectivo)}
                  </Text>
                </View>

                <View style={styles.metodoItem}>
                  <Text style={styles.metodoLabel}>💳 Tarjeta</Text>
                  <Text style={styles.metodoMonto}>
                    ${toSafeNumber(resumen.pagos_por_metodo?.tarjeta)}
                  </Text>
                </View>

                <View style={styles.metodoItem}>
                  <Text style={styles.metodoLabel}>🏦 Transferencia</Text>
                  <Text style={styles.metodoMonto}>
                    ${toSafeNumber(resumen.pagos_por_metodo?.transferencia)}
                  </Text>
                </View>
              </View>

              {/* Descuentos Aplicados */}
              {descuentos_aplicados && descuentos_aplicados.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    🎫 Descuentos Aplicados
                  </Text>

                  {descuentos_aplicados.map((descuento, index) => (
                    <View key={index} style={styles.descuentoCard}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Comanda:</Text>
                        <Text style={styles.infoValue}>
                          #{descuento.comanda_id} - Mesa {descuento.mesa}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Descuento:</Text>
                        <Text style={styles.infoValueDanger}>
                          {toSafeNumber(descuento.descuento_porcentaje, 0)}% ($
                          {toSafeNumber(descuento.descuento_monto)})
                        </Text>
                      </View>

                      {descuento.motivo && (
                        <View style={styles.motivoContainer}>
                          <Text style={styles.motivoLabel}>Motivo:</Text>
                          <Text style={styles.motivoText}>
                            {descuento.motivo}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Lista de Pagos */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  📝 Historial de Pagos ({pagos?.length || 0})
                </Text>

                {pagos && pagos.length > 0 ? (
                  pagos.map((pago) => (
                    <View key={pago.id} style={styles.pagoCard}>
                      <View style={styles.pagoHeader}>
                        <Text style={styles.pagoComanda}>
                          Comanda #{pago.comanda_id}
                        </Text>
                        <Text style={styles.pagoMesa}>
                          Mesa: {pago.comanda?.mesa || "N/A"}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Método:</Text>
                        <Text style={styles.metodoTag}>
                          {pago.metodo_pago === "efectivo" && "💵"}
                          {pago.metodo_pago === "tarjeta" && "💳"}
                          {pago.metodo_pago === "transferencia" && "🏦"}{" "}
                          {(pago.metodo_pago || "").toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Subtotal:</Text>
                        <Text style={styles.infoValue}>
                          ${toSafeNumber(pago.subtotal)}
                        </Text>
                      </View>

                      {Number(pago.descuento_monto || 0) > 0 && (
                        <View style={styles.infoRow}>
                          <Text style={styles.infoLabel}>Descuento:</Text>
                          <Text style={styles.infoValueDanger}>
                            -{toSafeNumber(pago.descuento_porcentaje, 0)}% ($
                            {toSafeNumber(pago.descuento_monto)})
                          </Text>
                        </View>
                      )}

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Monto Pagado:</Text>
                        <Text style={styles.infoValueBold}>
                          ${toSafeNumber(pago.monto)}
                        </Text>
                      </View>

                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Total Final:</Text>
                        <Text style={styles.infoValueSuccess}>
                          ${toSafeNumber(pago.total_final)}
                        </Text>
                      </View>

                      <View style={styles.pagoFooter}>
                        <Text style={styles.pagoFecha}>
                          {formatearFecha(pago.created_at)}{" "}
                          {formatearHora(pago.created_at)}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noPagosText}>
                    No hay pagos registrados
                  </Text>
                )}
              </View>

              {/* Notas */}
              {arqueo.notas && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>📝 Notas</Text>
                  <Text style={styles.notasText}>{arqueo.notas}</Text>
                </View>
              )}
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
    width: "95%",
    maxHeight: "95%",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxHeight: "100%",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  excelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  excelButtonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.7,
  },
  excelIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  excelButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  detalleScroll: {
    maxHeight: "85%",
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
    alignItems: "center",
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
  diferenciaWarning: {
    color: "#dc3545",
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  estadoAbierto: {
    backgroundColor: "#d4edda",
  },
  estadoCerrado: {
    backgroundColor: "#f8d7da",
  },
  estadoBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  metodoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
  descuentoCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  motivoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  motivoLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  motivoText: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  pagoCard: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pagoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pagoComanda: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007bff",
  },
  pagoMesa: {
    fontSize: 13,
    color: "#666",
  },
  metodoTag: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#495057",
  },
  pagoFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  pagoFecha: {
    fontSize: 11,
    color: "#999",
    textAlign: "right",
  },
  noPagosText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  notasText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
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
