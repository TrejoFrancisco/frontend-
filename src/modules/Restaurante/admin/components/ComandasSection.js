import React, { useState, useEffect } from "react";
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
} from "react-native";
import { API } from "../../../../services/api";

export default function ComandasPendientesSection({ token, navigation }) {
  const [comandas, setComandas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fechaReporte, setFechaReporte] = useState("");

  useEffect(() => {
    fetchComandas();
  }, []);

  const fetchComandas = async () => {
    try {
      setLoading(true);
      const response = await API.get("restaurante/admin/comandas-diarias", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setComandas(response.data.data.comandas);
        setFechaReporte(response.data.data.fecha);
      }
    } catch (error) {
      console.error("Error al obtener comandas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComandas();
    setRefreshing(false);
  };

  const abrirModalConfirmacion = (comanda) => {
    setSelectedComanda(comanda);
    setModalVisible(true);
  };

  const marcarComoPendiente = async () => {
    if (!selectedComanda) return;

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
        setModalVisible(false);
        await fetchComandas(); // Refrescar la lista
      }
    } catch (error) {
      console.error("Error al marcar como pendiente:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message ||
        "Error al marcar la comanda como pendiente"
      );
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "#ffc107"; // Amarillo
      case "entregado":
        return "#28a745"; // Verde
      case "cerrada":
        return "#6c757d"; // Gris
      case "pagada":
        return "#007bff"; // Azul
      default:
        return "#6c757d";
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "entregado":
        return "Entregado";
      case "cerrada":
        return "Cerrada";
      case "pagada":
        return "Pagada";
      default:
        return estado;
    }
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const renderComandaItem = (comanda) => {
    const puedeMarcarPendiente =
      comanda.estado !== "pendiente" && comanda.estado !== "pagada";

    return (
      <View key={comanda.id} style={styles.comandaCard}>
        <View style={styles.comandaHeaderRow}>
          {/* Columna 1: Mesa */}
          <View style={styles.colItem}>
            <Text style={styles.comandaLabel}>Mesa: <Text style={styles.comandaTitle}>{comanda.mesa}</Text></Text>
          </View>

          {/* Columna 2: Mesero */}
          <View style={styles.colItem}>
            <Text style={styles.comandaLabel}>Mesero: <Text style={styles.comandaDetail}>{comanda.mesero?.name || "Sin asignar"}</Text></Text>
          </View>

          {/* Columna 3: Fecha */}
          <View style={styles.colItem}>
            <Text style={styles.comandaLabel}>Fecha: <Text style={styles.comandaDetail}>{formatearFecha(comanda.created_at)}</Text></Text>
          </View>

          {/* Columna 4: Total */}
          <View style={styles.colItem}>
            <Text style={styles.comandaLabel}>Total: <Text style={styles.comandaDetail}>${comanda.total_calculado?.toFixed(2) || "0.00"}</Text></Text>
          </View>

          {/* Columna 5: Estado */}
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

        {/* Productos de la comanda */}
        <View style={styles.productosContainer}>
          <Text style={styles.productosTitle}>
            Productos ({comanda.productos?.length || 0}):
          </Text>
          <View style={styles.productosRow}>
            {comanda.productos &&
              comanda.productos.map((producto, index) => (
                <View key={`${producto.id}-${index}`} style={styles.productoItem}>
                  <Text style={styles.productoNombre}>{producto.nombre}</Text>
                  <View style={styles.productoDetails}>
                    <Text style={styles.productoPrice}>
                      ${producto.precio_venta}
                    </Text>
                    <View
                      style={[
                        styles.productoStatus,
                        {
                          backgroundColor: getEstadoColor(producto.pivot.estado),
                        },
                      ]}
                    >
                      <Text style={styles.productoStatusText}>
                        {getEstadoTexto(producto.pivot.estado)}
                      </Text>
                    </View>
                  </View>
                  {producto.pivot.detalle && (
                    <Text style={styles.productoDetalle}>
                      Detalle: {producto.pivot.detalle}
                    </Text>
                  )}
                </View>
              ))}
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.comandaActions}>
          {puedeMarcarPendiente ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.pendienteButton]}
              onPress={() => abrirModalConfirmacion(comanda)}
            >
              <Image
                source={require("../../../../../assets/editarr.png")}
                style={styles.iconImage}
              />
              <Text style={styles.actionButtonText}>Marcar como Pendiente</Text>
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
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
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

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {comandas.filter((c) => c.estado === "pendiente").length}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {comandas.filter((c) => c.estado === "entregado").length}
            </Text>
            <Text style={styles.statLabel}>Entregadas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {comandas.filter((c) => c.estado === "cerrada").length}
            </Text>
            <Text style={styles.statLabel}>Cerradas</Text>
          </View>
        </View>

        {/* Lista de comandas */}
        <View style={styles.comandasList}>
          {comandas.length === 0 ? (
            <Text style={styles.emptyText}>No hay comandas pendientes hoy</Text>
          ) : (
            comandas.map((comanda) => renderComandaItem(comanda))
          )}
        </View>
      </ScrollView>

      {/* Modal de Confirmación */}
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
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={marcarComoPendiente}
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
  // ===== CONTENEDOR PRINCIPAL =====
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

  // ===== TÍTULOS Y TEXTO =====
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
  },
  emptyText: {
    textAlign: "center",
    fontSize: 17,
    color: "#6c757d",
    fontStyle: "italic",
    marginVertical: 20,
  },

  // ===== ESTADÍSTICAS =====
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

  // ===== LISTA DE COMANDAS =====
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // ===== HEADER DE COMANDA =====
  comandaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
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

  // ===== DETALLES DE COMANDA =====

  comandaTitle: {
    fontWeight: 'bold',
    fontSize: 25,
    color: '#000', // o el color que prefieras
  },
  comandaDetail: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#000', // o el color que prefieras
  },

  comandaLabel: {
    fontSize: 19,
    fontWeight: '600',
    color: '#555',
  },


  // ===== PRODUCTOS =====
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
    flexDirection: 'row',
    flexWrap: 'wrap', // Permite que los elementos pasen a la siguiente línea
  },
  productoItem: {
      width: 180, // Ajusta según necesites
      marginRight: 12,
      marginBottom: 12,
      padding: 12,
      backgroundColor: '#f5f5f5',
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

    // ===== ACCIONES DE COMANDA =====
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

    // ===== MODAL =====
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

    // ===== RESUMEN EN MODAL =====
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

    // ===== BOTONES DEL MODAL =====
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