import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { API } from "../../../../services/api";

export default function ComandasPendientesSection({ token, navigation }) {
  const [comandas, setComandas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fechaReporte, setFechaReporte] = useState("");

  const fetchComandas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get("restaurante/admin/comandas-diarias", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setComandas(response.data.data.comandas || []);
        setFechaReporte(response.data.data.fecha || "");
      }
    } catch (error) {
      console.error("Error al obtener comandas:", error);
      if (error.response?.status === 401) {
        if (typeof navigation?.navigate === "function") {
          navigation.navigate("Login");
        }
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.error?.message ||
            "Error al obtener las comandas pendientes"
        );
      }
    } finally {
      setLoading(false);
    }
  }, [token, navigation]);

  useEffect(() => {
    fetchComandas();
  }, [fetchComandas]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComandas();
    setRefreshing(false);
  }, [fetchComandas]);

  const abrirModalConfirmacion = useCallback((comanda) => {
    setSelectedComanda(comanda);
    setModalVisible(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    setSelectedComanda(null);
  }, []);

  const marcarComoPendiente = useCallback(async () => {
    if (!selectedComanda?.id) {
      Alert.alert("Error", "No se pudo obtener el ID de la comanda");
      return;
    }

    try {
      const response = await API.patch(
        `restaurante/admin/comandas/${selectedComanda.id}/marcar-pendiente`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Éxito", "Comanda marcada como pendiente correctamente");
        cerrarModal();
        await fetchComandas();
      }
    } catch (error) {
      console.error("Error al marcar como pendiente:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message ||
          "Error al marcar la comanda como pendiente"
      );
    }
  }, [selectedComanda, token, fetchComandas, cerrarModal]);

  const getEstadoColor = useCallback((estado) => {
    const estadoMap = {
      pendiente: "#ffc107",
      entregado: "#28a745",
      cerrada: "#6c757d",
      pagada: "#007bff",
    };
    return estadoMap[estado] || "#6c757d";
  }, []);

  const getEstadoTexto = useCallback((estado) => {
    const estadoMap = {
      pendiente: "Pendiente",
      entregado: "Entregado",
      cerrada: "Cerrada",
      pagada: "Pagada",
    };
    return estadoMap[estado] || estado;
  }, []);

  const formatearFecha = useCallback((fecha) => {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return "Fecha inválida";
    }
  }, []);

  const estadisticas = useMemo(() => {
    return {
      pendientes: comandas.filter((c) => c.estado === "pendiente").length,
      entregadas: comandas.filter((c) => c.estado === "entregado").length,
      cerradas: comandas.filter((c) => c.estado === "cerrada").length,
    };
  }, [comandas]);

  const renderComandaItem = useCallback(
    (comanda) => {
      const puedeMarcarPendiente =
        comanda.estado !== "pendiente" && comanda.estado !== "pagada";

      return (
        <View key={comanda.id} style={styles.comandaCard}>
          <View style={styles.comandaHeaderRow}>
            <View style={styles.colItem}>
              <Text style={styles.comandaLabel}>
                Mesa: <Text style={styles.comandaTitle}>{comanda.mesa}</Text>
              </Text>
            </View>

            <View style={styles.colItem}>
              <Text style={styles.comandaLabel}>
                Mesero:{" "}
                <Text style={styles.comandaDetail}>
                  {comanda.mesero?.name || "Sin asignar"}
                </Text>
              </Text>
            </View>

            <View style={styles.colItem}>
              <Text style={styles.comandaLabel}>
                Fecha:{" "}
                <Text style={styles.comandaDetail}>
                  {formatearFecha(comanda.created_at)}
                </Text>
              </Text>
            </View>

            <View style={styles.colItem}>
              <Text style={styles.comandaLabel}>
                Total:{" "}
                <Text style={styles.comandaDetail}>
                  ${(comanda.total_calculado || 0).toFixed(2)}
                </Text>
              </Text>
            </View>

            <View style={styles.colItem}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getEstadoColor(comanda.estado) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getEstadoTexto(comanda.estado)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.productosContainer}>
            <Text style={styles.productosTitle}>
              Productos ({comanda.productos?.length || 0}):
            </Text>
            <View style={styles.productosRow}>
              {comanda.productos && comanda.productos.length > 0 ? (
                comanda.productos.map((producto, index) => (
                  <View
                    key={`${producto.id}-${index}`}
                    style={styles.productoItem}
                  >
                    <Text style={styles.productoNombre}>{producto.nombre}</Text>
                    <View style={styles.productoDetails}>
                      <Text style={styles.productoPrice}>
                        ${product.precio_venta || "0.00"}
                      </Text>
                      <View
                        style={[
                          styles.productoStatus,
                          {
                            backgroundColor: getEstadoColor(
                              producto.pivot?.estado || "pendiente"
                            ),
                          },
                        ]}
                      >
                        <Text style={styles.productoStatusText}>
                          {getEstadoTexto(
                            producto.pivot?.estado || "pendiente"
                          )}
                        </Text>
                      </View>
                    </View>
                    {producto.pivot?.detalle && (
                      <Text style={styles.productoDetalle}>
                        Detalle: {producto.pivot.detalle}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyProductsText}>
                  Sin productos registrados
                </Text>
              )}
            </View>
          </View>

          <View style={styles.comandaActions}>
            {puedeMarcarPendiente ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.pendienteButton]}
                onPress={() => abrirModalConfirmacion(comanda)}
                activeOpacity={0.7}
              >
                <Image
                  source={require("../../../../../assets/editarr.png")}
                  style={styles.iconImage}
                />
                <Text style={styles.actionButtonText}>
                  Marcar como Pendiente
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noActionText}>
                {comanda.estado === "pendiente"
                  ? "Ya está pendiente"
                  : "No se puede modificar"}
              </Text>
            )}
          </View>
        </View>
      );
    },
    [getEstadoColor, getEstadoTexto, formatearFecha, abrirModalConfirmacion]
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Cargando comandas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Comandas del Día</Text>
        <Text style={styles.subtitle}>{fechaReporte}</Text>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estadisticas.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estadisticas.entregadas}</Text>
            <Text style={styles.statLabel}>Entregadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estadisticas.cerradas}</Text>
            <Text style={styles.statLabel}>Cerradas</Text>
          </View>
        </View>

        <View style={styles.comandasList}>
          {comandas.length === 0 ? (
            <Text style={styles.emptyText}>No hay comandas pendientes hoy</Text>
          ) : (
            comandas.map((comanda) => renderComandaItem(comanda))
          )}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Confirmar Acción</Text>

              <Text style={styles.modalSubtitle}>
                ¿Estás seguro de que deseas marcar como PENDIENTE la comanda de
                la Mesa {selectedComanda?.mesa}?
              </Text>

              <View style={styles.comandaResumen}>
                <Text style={styles.resumenText}>
                  ID: {selectedComanda?.id}
                </Text>
                <Text style={styles.resumenText}>
                  Estado actual: {getEstadoTexto(selectedComanda?.estado)}
                </Text>
                <Text style={styles.resumenText}>
                  Comensal: {selectedComanda?.comensal || "Sin especificar"}
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={cerrarModal}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={marcarComoPendiente}
                  activeOpacity={0.7}
                >
                  <Text style={styles.submitButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#2c3e50",
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 16,
    textAlign: "center",
    color: "#6c757d",
  },
  loadingText: {
    fontSize: 18,
    color: "#6c757d",
    marginTop: 10,
  },
  emptyText: {
    textAlign: "center",
    fontSize: 17,
    color: "#6c757d",
    fontStyle: "italic",
    marginVertical: 20,
  },
  emptyProductsText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    minWidth: 80,
    flex: 1,
    marginHorizontal: 5,
    minHeight: 80,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    flexWrap: "wrap",
  },
  statLabel: {
    fontSize: 20,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },

  comandasList: {
    paddingBottom: 20,
  },
  comandaCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  comandaHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  colItem: {
    flex: 1,
    minWidth: 100,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },

  comandaTitle: {
    fontWeight: "bold",
    fontSize: 25,
    color: "#000",
  },
  comandaDetail: {
    fontSize: 18,
    fontWeight: "normal",
    color: "#000",
  },
  comandaLabel: {
    fontSize: 19,
    fontWeight: "600",
    color: "#555",
  },

  productosContainer: {
    marginBottom: 18,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 8,
  },
  productosTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2c3e50",
  },
  productosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  productoItem: {
    width: 180,
    marginRight: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
  },
  productoNombre: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 4,
  },
  productoDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  productoPrice: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#28a745",
  },
  productoStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  productoStatusText: {
    color: "white",
    fontSize: 13,
    fontWeight: "bold",
  },
  productoDetalle: {
    fontSize: 15,
    color: "#6c757d",
    fontStyle: "italic",
  },

  comandaActions: {
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  pendienteButton: {
    backgroundColor: "#349f39ff",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  iconImage: {
    width: 20,
    height: 20,
  },
  noActionText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#2c3e50",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: "center",
    color: "#495057",
  },

  comandaResumen: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  resumenText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#495057",
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    padding: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
  },
  submitButton: {
    backgroundColor: "#ffc107",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
