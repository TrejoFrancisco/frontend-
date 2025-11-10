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
import { useBackHandler } from "../../../../hooks/useBackHandler";

export default function CocinaSection() {
  const { token, logout, user } = useAuth();
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

  // Manejo del botón de retroceso de Android
  const navigation = useNavigation();
  useBackHandler(navigation); // ¡Una sola línea!

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
                  "/auth/logout",
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

  const marcarComoEntregado = async (comandaProductoId, nombreProducto) => {
    if (!token) return;

    // Mostrar alerta de confirmación
    Alert.alert(
      "Confirmar Entrega",
      `¿Estás seguro de marcar como entregado:\n\n"${nombreProducto}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí, Entregar",
          style: "default",
          onPress: async () => {
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
                Alert.alert("✓ Éxito", "Producto marcado como entregado");

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
              } else {
                Alert.alert(
                  "Error",
                  "No se pudo marcar el producto como entregado. Por favor intenta de nuevo."
                );
              }
            }
          },
        },
      ],
      { cancelable: true }
    );
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
      {/* Container principal para el contenido del header */}
      <View style={styles.productoContainer}>
        {/* Fila única: Mesa + Producto + Comensal + Mesero + Prioridad */}
        <View style={styles.productoHeaderRow}>
          <Text style={styles.mesaNumber}>Mesa {producto.mesa}</Text>

          <Text style={styles.productoNombre}>{producto.nombre}</Text>

          {producto.comensal && (
            <Text style={styles.comensalDetail}>
              Comensal: {producto.comensal}
            </Text>
          )}

          <Text style={styles.meseroDetail}>
            Mesero: {producto.mesero_nombre}
          </Text>

          {/* Badge Prioridad */}
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

      {/* Botones - mantenidos igual */}
      <View style={styles.productoBotonesFila}>
        <TouchableOpacity
          style={[styles.botonAccion, styles.botonVerDetalles]}
          onPress={() => abrirVentanaDetalles(producto)}
        >
          <Text style={styles.botonAccionTexto}>Ver Detalles</Text>
        </TouchableOpacity>

        {producto.estado !== "entregado" ? (
          <TouchableOpacity
            style={[styles.botonAccion, styles.botonEntregar]}
            onPress={() =>
              marcarComoEntregado(producto.comanda_producto_id, producto.nombre)
            }
          >
            <Text style={styles.botonAccionTexto}>✓ Marcar como Entregado</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.botonAccion, styles.botonCompletado]}>
            <Text style={styles.botonAccionTexto}>✓ Entregado</Text>
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
              <Text
                style={styles.filterButtonText}
                numberOfLines={1} // ✅ AGREGADO: Limita a una línea
                ellipsizeMode="tail" // ✅ AGREGADO: Corta con "..."
              >
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
                    numberOfLines={2} // ✅ AGREGADO: Permite hasta 2 líneas
                    ellipsizeMode="tail"
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
  // =============================================================================
  // ESTILOS GENERALES DEL CONTENEDOR PRINCIPAL
  // =============================================================================

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5", // Fondo gris claro para toda la pantalla
  },

  centered: {
    justifyContent: "center",
    alignItems: "center", // Centrar contenido (usado para loading)
  },

  scrollView: {
    flex: 1, // Ocupa todo el espacio disponible
  },

  // =============================================================================
  // HEADER SUPERIOR CON SALUDO Y BOTÓN DE LOGOUT
  // =============================================================================

  topHeader: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  headerColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Distribución izquierda-derecha
  },

  leftColumn: {
    flex: 1, // Ocupa espacio disponible
  },

  rightColumn: {
    alignItems: "flex-end", // Alinear botón a la derecha
  },

  // Sección de saludo al usuario
  userGreeting: {
    flexDirection: "row",
    alignItems: "center",
  },

  welcomeIcon: {
    width: 24,
    height: 24,
    marginRight: 8, // Espacio entre icono y texto
  },

  userWelcome: {
    fontSize: 25,
    color: "#333",
    fontWeight: "bold",
    maxWidth: 195, // Evitar desbordamiento
    flexWrap: "wrap",
  },

  // Botón de cerrar sesión
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2", // Fondo rojo claro
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },

  logoutIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },

  logoutButtonText: {
    color: "#000000ff",
    fontSize: 22,
    fontWeight: "500",
  },

  // =============================================================================
  // SECCIONES DE CONTENIDO (HEADERS Y TEXTOS PRINCIPALES)
  // =============================================================================

  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  // Texto que muestra la categoría asignada
  categoriaText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    flexWrap: "wrap",
  },

  // Subtítulos como "Productos Pendientes"
  subtext: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    flexWrap: "wrap",
  },

  // Texto de carga
  loadingText: {
    fontSize: 25,
    color: "#666",
    flexWrap: "wrap",
  },

  // =============================================================================
  // TARJETAS DE ESTADÍSTICAS
  // =============================================================================

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Distribución equitativa
    marginBottom: 30,
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    // Sombra para Android
    elevation: 2,
    // Sombra para iOS
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
    color: "#007bff", // Azul principal
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

  // =============================================================================
  // SECCIÓN DE FILTROS Y ORDENAMIENTO
  // =============================================================================

  filtersContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16, // ✅ Reducido de 20 a 16
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
    gap: 12, // ✅ AGREGADO: Espacio entre título y botón
  },

  filtersTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flexShrink: 0, // ✅ AGREGADO: No se encoge
  },

  // Botón principal del filtro
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    maxWidth: "20%",
    justifyContent: "space-between",
  },

  filterButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
  },

  filterArrow: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 8,
    flexShrink: 0,
  },

  // Dropdown de opciones de filtro
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
  // =============================================================================
  // TARJETAS DE PRODUCTOS
  // =============================================================================

  productosContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Tarjeta individual de cada producto
  productoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
  },

  // Container principal
  productoContainer: {
    flex: 1,
    marginBottom: 6,
  },

  productoHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },

  mesaNumber: {
    fontWeight: "bold",
    fontSize: 25,
  },

  productoNombre: {
    fontSize: 20,
    fontWeight: "500",
  },

  comensalDetail: {
    fontSize: 17,
  },

  meseroDetail: {
    fontSize: 17,
  },

  // Badge de prioridad
  prioridadBadge: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  prioridadText: {
    fontWeight: "bold",
    fontSize: 12,
    color: "white",
  },

  // =============================================================================
  // BOTONES DE ACCIÓN EN PRODUCTOS (MANTENIDOS IGUAL)
  // =============================================================================

  // Fila que contiene los botones de acción
  productoBotonesFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 7,
    marginTop: 10,
    gap: 12,
    flexWrap: "wrap",
  },

  // Estilo base para todos los botones de acción
  botonAccion: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 5,
    minWidth: 0,
  },

  // Botón azul para ver detalles
  botonVerDetalles: {
    backgroundColor: "#007AFF",
  },

  // Botón verde para entregar
  botonEntregar: {
    backgroundColor: "#28a745",
  },

  // Botón gris para productos ya completados
  botonCompletado: {
    backgroundColor: "#6c757d",
  },

  // Texto de los botones de acción
  botonAccionTexto: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  // =============================================================================
  // ESTADO VACÍO (SIN PRODUCTOS)
  // =============================================================================

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },

  emptyText: {
    fontSize: 19,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    flexWrap: "wrap",
    textAlign: "center",
  },

  emptySubtext: {
    fontSize: 17,
    color: "#666",
    textAlign: "center",
    flexWrap: "wrap",
  },

  // =============================================================================
  // MODAL DE DETALLES DEL PRODUCTO
  // =============================================================================

  // Overlay oscuro del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Fondo semi-transparente
    justifyContent: "center",
    alignItems: "center",
  },

  // Contenedor principal del modal
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: 350,
    width: "90%",
    maxHeight: "80%", // Altura máxima para evitar desbordamiento
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  // Título del modal
  modalTitle: {
    fontSize: 25,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
    flexWrap: "wrap",
  },

  // Elementos de información en el modal
  modalItem: {
    fontSize: 18,
    color: "#333",
    marginBottom: 8,
    lineHeight: 20,
    flexWrap: "wrap",
  },

  // Etiquetas en el modal (Producto:, Mesa:, etc.)
  modalLabel: {
    fontWeight: "600",
    color: "#555",
  },

  // Botón para cerrar el modal
  cerrarButton: {
    backgroundColor: "#F44336", // Rojo
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
  },

  cerrarButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  // =============================================================================
  // SECCIÓN DE RECETA E INGREDIENTES EN EL MODAL
  // =============================================================================

  // Sección que contiene la información de la receta
  recetaSection: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#eee", // Línea separadora
  },

  // Título de la sección de ingredientes
  recetaTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
  },

  // Contenedor de todos los ingredientes
  ingredientesContainer: {
    backgroundColor: "#f8f9fa", // Fondo gris muy claro
    borderRadius: 8,
    padding: 12,
  },

  // Cada ingrediente individual
  ingredienteItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    flexWrap: "wrap", // Permite que los textos bajen si no caben
  },

  // Nombre del ingrediente
  ingredienteNombre: {
    flex: 1,
    fontSize: 18,
    color: "#495057",
    fontWeight: "500",
    flexWrap: "wrap",
  },

  // Cantidad y unidad del ingrediente
  ingredienteCantidad: {
    fontSize: 17,
    color: "#28a745", // Verde
    fontWeight: "600",
    backgroundColor: "#d4edda", // Fondo verde claro
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 1,
    textAlign: "center",
  },

  // Texto cuando no hay receta disponible
  sinRecetaText: {
    fontSize: 18,
    color: "#6c757d", // Gris
    fontStyle: "italic",
    textAlign: "center",
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    flexWrap: "wrap",
  },
});
