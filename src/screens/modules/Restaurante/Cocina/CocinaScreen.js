import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Image,
} from "react-native";
import { API } from "../../../../services/api";
import { useAuth } from "../../../../AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function CocinaSection() {
  const { token, logout, user } = useAuth();
  const navigation = useNavigation();
  const [productos, setProductos] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoriaAsignada, setCategoriaAsignada] = useState(null);
  const [stats, setStats] = useState({
    totalComandas: 0,
    totalProductos: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Estados para filtros y ordenamiento
  const [ordenamiento, setOrdenamiento] = useState("fecha_asc");
  const [showFilters, setShowFilters] = useState(false);

  const opcionesOrdenamiento = [
    { label: "Fecha: más antigua primero ", value: "fecha_asc" },
    { label: "Fecha: más reciente primero ", value: "fecha_desc" },
    { label: "Mesa: (ascendente)", value: "mesa_asc" },
    { label: "Mesa: (descendente)", value: "mesa_desc" },
    {
      label: "Prioridad: Alta → Media → Baja",
      value: "prioridad_desc",
    },
    {
      label: "Prioridad: Baja → Media → Alta",
      value: "prioridad_asc",
    },
  ];

  const abrirVentanaDetalles = (producto) => {
    setProductoSeleccionado(producto);
    setModalVisible(true);
  };

  useEffect(() => {
    if (token) {
      fetchProductos();
    }
  }, [token, ordenamiento]);

  const fetchProductos = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await API.get("/restaurante/cocina/comandas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          ordenar_por: ordenamiento,
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        setProductos(data.productos || []);
        setCategoriaAsignada(data.categoria_asignada);
        setStats({
          totalComandas: data.total_comandas || 0,
          totalProductos: data.total_productos || 0,
        });
      }
    } catch (error) {
      console.log("Error al obtener productos de cocina:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      }
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProductos();
    setRefreshing(false);
  };

  const handleOrdenamientoChange = (value) => {
    setOrdenamiento(value);
    setShowFilters(false);
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            if (token) {
              try {
                await API.post(
                  "/logout",
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
              } catch (error) {
                console.log("Error al hacer logout en servidor:", error);
              }
            }

            await logout();

            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.error("Error en logout:", error);
            Alert.alert("Error", "Hubo un problema al cerrar sesión");
          }
        },
      },
    ]);
  };

  const marcarComoEntregado = async (comandaProductoId) => {
    if (!token) return;

    try {
      const response = await API.patch(
        `/restaurante/cocina/comandas/${comandaProductoId}/estado`,
        {
          estado: "entregado",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Éxito", "Producto marcado como entregado");

        setProductos((prevProductos) =>
          prevProductos.map((producto) =>
            producto.comanda_producto_id === comandaProductoId
              ? { ...producto, estado: "entregado" }
              : producto
          )
        );

        setStats((prev) => ({
          ...prev,
          totalProductos: Math.max(0, prev.totalProductos - 1),
        }));
      }
    } catch (error) {
      console.log("Error al marcar producto como entregado:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      }
    }
  };

  const getPrioridadInfo = (prioridadNum, prioridadTexto) => {
    // Si viene el texto, usarlo directamente
    if (prioridadTexto) {
      switch (prioridadTexto.toLowerCase()) {
        case "alta":
          return { color: "#ff4444", texto: "ALTA" };
        case "media":
          return { color: "#ffaa00", texto: "MEDIA" };
        case "baja":
          return { color: "#00aa44", texto: "BAJA" };
        default:
          return { color: "#999", texto: "N/A" };
      }
    }

    // Si no, convertir desde número
    switch (prioridadNum) {
      case 1:
        return { color: "#ff4444", texto: "ALTA" };
      case 2:
        return { color: "#ffaa00", texto: "MEDIA" };
      case 3:
        return { color: "#00aa44", texto: "BAJA" };
      default:
        return { color: "#999", texto: "N/A" };
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderProductoItem = (producto) => (
    <View
      key={producto.comanda_producto_id}
      style={[
        styles.productoCard,
        producto.estado === "entregado" && styles.productoEntregado,
      ]}
    >
      {/* Header con mesa y tiempo */}
      <View style={styles.productoHeader}>
        <View style={styles.mesaTimeInfo}>
          <Text style={styles.mesaNumber}>Mesa {producto.mesa}</Text>
          <Text style={styles.pedidoTime}>
            Pedido: {formatTime(producto.fecha_pedido)}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.prioridadBadge,
              {
                backgroundColor: getPrioridadInfo(
                  producto.prioridad,
                  producto.prioridad_texto
                ).color,
              },
            ]}
          >
            <Text style={styles.prioridadText}>
              {
                getPrioridadInfo(producto.prioridad, producto.prioridad_texto)
                  .texto
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Información del producto */}
      <View style={styles.productoMainInfo}>
        <Text style={styles.productoNombre}>{producto.nombre}</Text>
        <Text style={styles.productoClave}>#{producto.clave}</Text>
      </View>

      {/* Información adicional */}
      <View style={styles.productoDetails}>
        <View style={styles.leftDetails}>
          {producto.comensal && (
            <Text style={styles.comensalText}>👤 {producto.comensal}</Text>
          )}
          <Text style={styles.meseroText}>
            Mesero: {producto.mesero_nombre}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.detallesButton}
          onPress={() => abrirVentanaDetalles(producto)}
        >
          <Text style={styles.detallesButtonText}>Ver Detalles</Text>
        </TouchableOpacity>
      </View>

      {/* Botón de acción */}
      <View style={styles.productoActions}>
        {producto.estado !== "entregado" ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.entregarButton]}
            onPress={() => marcarComoEntregado(producto.comanda_producto_id)}
          >
            <Text style={styles.actionButtonText}>✓ Marcar como Entregado</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionButton, styles.completadoButton]}>
            <Text style={styles.completadoText}>✓ Entregado</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Cargando productos de cocina...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerColumns}>
          <View style={styles.leftColumn}>
            <View style={styles.userGreeting}>
              <Image
                source={require("../../../../../assets/saludo.png")}
                style={styles.welcomeIcon}
              />
              <Text style={styles.userWelcome}>Hola, {user?.name}</Text>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Image
                source={require("../../../../../assets/cerrarC.png")}
                style={styles.logoutIcon}
              />
              <Text style={styles.logoutButtonText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          {categoriaAsignada && (
            <Text style={styles.categoriaText}>
              Categoría: {categoriaAsignada.nombre}
            </Text>
          )}
        </View>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalComandas}</Text>
            <Text style={styles.statLabel}>Comandas</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalProductos}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
        </View>

        {/* Sección de filtros */}
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Ordenar por:</Text>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Text style={styles.filterButtonText}>
                {
                  opcionesOrdenamiento.find((opt) => opt.value === ordenamiento)
                    ?.label
                }
              </Text>
              <Text style={styles.filterArrow}>{showFilters ? "▲" : "▼"}</Text>
            </TouchableOpacity>
          </View>

          {showFilters && (
            <View style={styles.filtersDropdown}>
              {opcionesOrdenamiento.map((opcion) => (
                <TouchableOpacity
                  key={opcion.value}
                  style={[
                    styles.filterOption,
                    ordenamiento === opcion.value &&
                      styles.filterOptionSelected,
                  ]}
                  onPress={() => handleOrdenamientoChange(opcion.value)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      ordenamiento === opcion.value &&
                        styles.filterOptionTextSelected,
                    ]}
                  >
                    {opcion.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.header}>
          <Text style={styles.subtext}>
            Productos Pendientes (
            {productos.filter((p) => p.estado !== "entregado").length}):
          </Text>
        </View>

        {productos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🎉 No hay productos pendientes</Text>
            <Text style={styles.emptySubtext}>
              Todos los productos de tu categoría han sido procesados
            </Text>
          </View>
        ) : (
          <View style={styles.productosContainer}>
            {productos.map((producto) => renderProductoItem(producto))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detalles del Producto</Text>

            {productoSeleccionado && (
              <>
                <Text style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Producto:</Text>{" "}
                  {productoSeleccionado.nombre}
                </Text>

                <Text style={styles.modalItem}>
                  <Text style={styles.modalLabel}>Mesa:</Text>{" "}
                  {productoSeleccionado.mesa}
                </Text>

                {productoSeleccionado.detalle && (
                  <Text style={styles.modalItem}>
                    <Text style={styles.modalLabel}>Detalles especiales:</Text>{" "}
                    {productoSeleccionado.detalle}
                  </Text>
                )}

                {/* Sección de ingredientes/materias primas */}
                {productoSeleccionado.receta &&
                productoSeleccionado.receta.materias_primas &&
                productoSeleccionado.receta.materias_primas.length > 0 ? (
                  <View style={styles.recetaSection}>
                    <Text style={styles.recetaTitle}>
                      🧾 Ingredientes necesarios:
                    </Text>
                    <View style={styles.ingredientesContainer}>
                      {productoSeleccionado.receta.materias_primas.map(
                        (ingrediente, index) => (
                          <View key={index} style={styles.ingredienteItem}>
                            <Text style={styles.ingredienteNombre}>
                              • {ingrediente.nombre}
                            </Text>
                            <Text style={styles.ingredienteCantidad}>
                              {ingrediente.cantidad} {ingrediente.unidad}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.recetaSection}>
                    <Text style={styles.sinRecetaText}>
                      ℹ️ Este producto no requiere preparación específica
                    </Text>
                  </View>
                )}
              </>
            )}

            <TouchableOpacity
              style={styles.cerrarButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cerrarButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Agregar estos estilos a tu StyleSheet existente

  // Estilos para la sección de receta en el modal
  recetaSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },

  recetaTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },

  ingredientesContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },

  ingredienteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },

  ingredienteNombre: {
    flex: 1,
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },

  ingredienteCantidad: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "600",
    backgroundColor: "#d4edda",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },

  sinRecetaText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
    textAlign: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },

  // También puedes actualizar el modalContent para que sea más grande si es necesario
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 15,
    padding: 20,
    maxHeight: "80%", // Agregar altura máxima
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  topHeader: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: "flex-end",
  },
  userGreeting: {
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  userWelcome: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoriaText: {
    fontSize: 20,
    color: "#000000ff",
    textAlign: "center",
    fontWeight: "bold",
  },
  subtext: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  filtersContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  filtersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 200,
    justifyContent: "space-between",
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  filterArrow: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 8,
  },
  filtersDropdown: {
    marginTop: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  filterOption: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  filterOptionSelected: {
    backgroundColor: "#e3f2fd",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#333",
  },
  filterOptionTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  productosContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  productoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  productoEntregado: {
    backgroundColor: "#f8f9fa",
    borderLeftColor: "#28a745",
    opacity: 0.8,
  },
  productoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  mesaTimeInfo: {
    flex: 1,
  },
  mesaNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  pedidoTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  prioridadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prioridadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  productoMainInfo: {
    marginBottom: 12,
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productoClave: {
    fontSize: 12,
    color: "#999",
  },
  productoDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  leftDetails: {
    flex: 1,
  },
  comensalText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 4,
  },
  meseroText: {
    fontSize: 13,
    color: "#777",
  },
  detallesButton: {
    marginTop: 5,
    paddingVertical: 15,
    paddingHorizontal: 18,
    backgroundColor: "#007AFF",
    borderRadius: 10,
    alignSelf: "flex-start",
    minWidth: 70,
  },
  detallesButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  productoActions: {
    marginTop: 8,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  entregarButton: {
    backgroundColor: "#28a745",
  },
  completadoButton: {
    backgroundColor: "#6c757d",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  completadoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  modalItem: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    lineHeight: 20,
  },
  modalLabel: {
    fontWeight: "600",
    color: "#555",
  },
  cerrarButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },
  cerrarButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
