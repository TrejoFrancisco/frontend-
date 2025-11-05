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
} from "react-native";
import { API } from "../../../../services/api";
import DetalleArqueoModal from "./DetalleArqueoModal";

export default function HistorialArqueosModal({ visible, onClose, token }) {
  const [arqueos, setArqueos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Modal de detalle
  const [detalleModalVisible, setDetalleModalVisible] = useState(false);
  const [selectedArqueoId, setSelectedArqueoId] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchHistorial();
    }
  }, [visible]);

  const fetchHistorial = async (page = 1) => {
    try {
      setLoading(true);

      const response = await API.get(
        `/restaurante/cajero/historial-arqueos?page=${page}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setArqueos(response.data.data.data || []);
        setCurrentPage(response.data.data.current_page);
        setLastPage(response.data.data.last_page);
      }
    } catch (error) {
      console.log("Error al obtener historial:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message ||
          "Error al obtener el historial de arqueos"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (arqueoId) => {
    setSelectedArqueoId(arqueoId);
    setDetalleModalVisible(true);
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
      });
    } catch (error) {
      return "N/A";
    }
  };

  // Helper para convertir a número seguro
  const toSafeNumber = (value, decimals = 2) => {
    return Number(value || 0).toFixed(decimals);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>📚 Historial de Arqueos</Text>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007bff" />
                  <Text style={styles.loadingText}>Cargando historial...</Text>
                </View>
              ) : (
                <>
                  <ScrollView style={styles.historialScroll}>
                    {arqueos.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>
                          No hay arqueos registrados
                        </Text>
                      </View>
                    ) : (
                      arqueos.map((arqueo) => (
                        <TouchableOpacity
                          key={arqueo.id}
                          style={styles.arqueoCard}
                          onPress={() => handleVerDetalle(arqueo.id)}
                        >
                          <View style={styles.arqueoHeader}>
                            <Text style={styles.arqueoId}>
                              Arqueo #{arqueo.id}
                            </Text>
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

                          <View style={styles.arqueoBody}>
                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>📅 Fecha:</Text>
                              <Text style={styles.infoValue}>
                                {formatearFecha(arqueo.fecha)}
                              </Text>
                            </View>

                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>👤 Cajero:</Text>
                              <Text style={styles.infoValue}>
                                {arqueo.cajero?.name || "N/A"}
                              </Text>
                            </View>

                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>🕐 Apertura:</Text>
                              <Text style={styles.infoValue}>
                                {formatearHora(arqueo.hora_apertura)}
                              </Text>
                            </View>

                            {arqueo.hora_cierre && (
                              <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>🕐 Cierre:</Text>
                                <Text style={styles.infoValue}>
                                  {formatearHora(arqueo.hora_cierre)}
                                </Text>
                              </View>
                            )}

                            <View style={styles.divider} />

                            <View style={styles.infoRow}>
                              <Text style={styles.infoLabel}>
                                💰 Monto Inicial:
                              </Text>
                              <Text style={styles.infoValueBold}>
                                ${toSafeNumber(arqueo.monto_inicial)}
                              </Text>
                            </View>

                            {arqueo.estado === "cerrado" && (
                              <>
                                <View style={styles.infoRow}>
                                  <Text style={styles.infoLabel}>
                                    💵 Monto Final:
                                  </Text>
                                  <Text style={styles.infoValueSuccess}>
                                    ${toSafeNumber(arqueo.monto_final_real)}
                                  </Text>
                                </View>

                                {Number(arqueo.diferencia || 0) !== 0 && (
                                  <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>
                                      ⚠️ Diferencia:
                                    </Text>
                                    <Text style={styles.infoValueDanger}>
                                      ${toSafeNumber(arqueo.diferencia)}
                                    </Text>
                                  </View>
                                )}
                              </>
                            )}
                          </View>

                          <View style={styles.arqueoFooter}>
                            <Text style={styles.verDetalleText}>
                              👁️ Ver detalle completo →
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>

                  {/* Paginación */}
                  {lastPage > 1 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity
                        style={[
                          styles.pageButton,
                          currentPage === 1 && styles.pageButtonDisabled,
                        ]}
                        onPress={() => fetchHistorial(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <Text
                          style={[
                            styles.pageButtonText,
                            currentPage === 1 && styles.pageButtonTextDisabled,
                          ]}
                        >
                          ← Anterior
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.pageInfo}>
                        Página {currentPage} de {lastPage}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.pageButton,
                          currentPage === lastPage && styles.pageButtonDisabled,
                        ]}
                        onPress={() => fetchHistorial(currentPage + 1)}
                        disabled={currentPage === lastPage}
                      >
                        <Text
                          style={[
                            styles.pageButtonText,
                            currentPage === lastPage &&
                              styles.pageButtonTextDisabled,
                          ]}
                        >
                          Siguiente →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity style={styles.cerrarButton} onPress={onClose}>
                <Text style={styles.cerrarButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Detalle */}
      <DetalleArqueoModal
        visible={detalleModalVisible}
        onClose={() => {
          setDetalleModalVisible(false);
          setSelectedArqueoId(null);
        }}
        token={token}
        arqueoId={selectedArqueoId}
      />
    </>
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
    maxHeight: "90%",
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  historialScroll: {
    maxHeight: "75%",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  arqueoCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  arqueoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  arqueoId: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
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
  arqueoBody: {
    padding: 12,
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
  divider: {
    height: 1,
    backgroundColor: "#dee2e6",
    marginVertical: 8,
  },
  arqueoFooter: {
    backgroundColor: "#e9ecef",
    padding: 10,
    alignItems: "center",
  },
  verDetalleText: {
    fontSize: 13,
    color: "#007bff",
    fontWeight: "600",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#007bff",
    borderRadius: 6,
  },
  pageButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  pageButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  pageButtonTextDisabled: {
    color: "#999",
  },
  pageInfo: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
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
