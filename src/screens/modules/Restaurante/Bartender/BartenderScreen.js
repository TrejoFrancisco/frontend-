import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  modalVisible,
  Image,
  Alert,
} from "react-native";
import { API } from "../../../../services/api";
import { useAuth } from "../../../../AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function BarSection() {
  const { token, logout, user } = useAuth();
  const navigation = useNavigation();
  const [comandas, setComandas] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categoriaAsignada, setCategoriaAsignada] = useState(null);
  const [stats, setStats] = useState({
    totalComandas: 0,
    totalProductos: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const abrirVentanaDetalles = (producto) => {
    setProductoSeleccionado(producto);
    setModalVisible(true);
  };

  useEffect(() => {
    if (token) {
      fetchComandas();
    }
  }, [token]);

  const fetchComandas = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await API.get("/restaurante/bar/comandas_", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const data = response.data.data;
        setComandas(data.comandas || []);
        setCategoriaAsignada(data.categoria_asignada);
        setStats({
          totalComandas: data.total_comandas || 0,
          totalProductos: data.total_productos || 0,
        });
      }
    } catch (error) {
      console.log("Error al obtener comandas de Bar:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      }
      setComandas([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComandas();
    setRefreshing(false);
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
        `/restaurante/bar/comandas_/${comandaProductoId}/estado`,
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

        setComandas((prevComandas) =>
          prevComandas.map((comanda) => ({
            ...comanda,
            productos: comanda.productos.map((producto) =>
              producto.comanda_producto_id === comandaProductoId
                ? { ...producto, estado: "entregado" }
                : producto
            ),
          }))
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

  const renderProductoItem = (producto, comanda) => (
    <View
      key={producto.comanda_producto_id}
      style={[
        styles.productoCard,
        producto.estado === "entregado" && styles.productoEntregado,
      ]}
    >
      {/* Header con información principal */}
      <View style={styles.productoHeader}>
        <View style={styles.productoMainInfo}>
          <View style={styles.productoTitleRow}>
            <Text style={styles.productoNombre}>{producto.nombre}</Text>
          </View>
        </View>

        <View style={styles.productoRightInfo}>
          {/* Botón de detalles */}
          <TouchableOpacity
            style={styles.detallesButton}
            onPress={() => abrirVentanaDetalles(producto)}
          >
            <Text style={styles.detallesButtonText}>Detalles</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Información de la mesa y pedido */}
      <View style={styles.mesaInfo}>
        <View style={styles.mesaInfoLeft}>
          <View style={styles.mesaDetails}>
            {comanda.comensal && (
              <Text style={styles.comensalText}>
                Comensal: {comanda.comensal}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.tiempoInfo}>
          <Text style={styles.tiempoLabel}>Pedido</Text>
        </View>
      </View>

      {/* Información del mesero */}
      <View style={styles.meseroInfo}>
        <Text style={styles.meseroLabel}>👤 {comanda.mesero_nombre}</Text>
      </View>

      {/* Botón de acción */}
      <View style={styles.productoActions}>
        {producto.estado !== "entregado" ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.entregarButton]}
            onPress={() => marcarComoEntregado(producto.comanda_producto_id)}
          >
            <Text style={styles.actionButtonText}>Marcar como Entregado</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.actionButton, styles.completadoButton]}>
            <Text style={styles.completadoText}>Entregado</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderComandaGroup = (comanda) => (
    <View key={comanda.comanda_id} style={styles.comandaGroup}>
      <View style={styles.comandaGroupHeader}>
        <Text style={styles.comandaGroupTitle}>Mesa No. {comanda.mesa}</Text>
        <Text style={styles.comandaGroupTime}>
          {new Date(comanda.fecha_comanda).toLocaleTimeString("es-MX")}
        </Text>
      </View>

      {comanda.productos.map((producto) =>
        renderProductoItem(producto, comanda)
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Cargando productos de bar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerColumns}>
          {/* Columna izquierda: saludo y rol */}
          <View style={styles.leftColumn}>
            <View style={styles.userGreeting}>
              <Image
                source={require("../../../../../assets/saludo.png")}
                style={styles.welcomeIcon}
              />
              <Text style={styles.userWelcome}>Hola, {user?.name}</Text>
            </View>
          </View>

          {/* Columna derecha: división y botón de salir */}
          <View style={styles.rightColumn}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Image
                source={require("../../../../../assets/cerrarC.png")} // ← tu imagen personalizada
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

        <View style={styles.header}>
          <Text style={styles.subtext}>Productos Pendientes: </Text>
        </View>

        {comandas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>🎉 No hay productos pendientes</Text>
            <Text style={styles.emptySubtext}>
              Todos los productos de tu categoría han sido procesados
            </Text>
          </View>
        ) : (
          comandas.map((comanda) => renderComandaGroup(comanda))
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
                  Nombre: {productoSeleccionado.nombre}
                </Text>
                <Text style={styles.modalItem}>
                  Prioridad: {productoSeleccionado.prioridad}
                </Text>
                <Text style={styles.modalItem}>
                  Detalles: {productoSeleccionado.detalle}
                </Text>
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
  // HEADER SUPERIOR (Bienvenida y Logout)

  topHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d1d2ff",
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
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 12,
  },
  welcomeIcon: {
    width: 30,
    height: 25,
    marginRight: 5,
    resizeMode: "contain",
  },
  userWelcome: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
    maxWidth: 180, //Ancho para que el texto se acomode
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
  },
  logoutIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  logoutButtonText: {
    fontSize: 14,
    color: "#333",
  },

  // CONTENEDOR PRINCIPAL Y ESTRUCTURA BÁSICA

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
    padding: 16,
  },

  // HEADER DEL TÍTULO Y CATEGORÍA

  header: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  subtext: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "left",
    alignSelf: "flex-start",
    marginBottom: 6,
    color: "#6c757d",
  },
  categoriaText: {
    fontSize: 20,
    color: "#000000ff",
    textAlign: "center",
    fontWeight: "bold",
  },

  // SECCIÓN DE ESTADÍSTICAS

  statsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007bff",
  },
  statLabel: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 1,
  },

  // AGRUPACIÓN DE COMANDAS POR MESA

  comandaGroup: {
    marginBottom: 8,
  },
  comandaGroupHeader: {
    backgroundColor: "#343a40",
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  comandaGroupTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  comandaGroupTime: {
    color: "#adb5bd",
    fontSize: 13,
    fontWeight: "500",
  },

  // TARJETA DE PRODUCTO INDIVIDUAL

  productoCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  productoEntregado: {
    opacity: 0.7,
    backgroundColor: "#f8f9fa",
  },

  // HEADER DEL PRODUCTO (Nombre, precio, estado)

  productoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  productoMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  productoTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  productoNombre: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    flex: 1,
    marginRight: 8,
    marginTop: 10,
    textAlign: "center",
  },
  productoRightInfo: {
    alignItems: "flex-end",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalItem: {
    fontSize: 16,
    marginBottom: 6,
  },
  cerrarButton: {
    marginTop: 20,
    backgroundColor: "#FF3B30",
    paddingVertical: 8,
    borderRadius: 8,
  },
  cerrarButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "500",
  },

  // BADGES DE PRIORIDAD Y ESTADO

  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: "center",
  },
  estadoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  // INFORMACIÓN DE MESA Y TIEMPO

  mesaInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  mesaInfoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  mesaNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  mesaNumberText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  mesaDetails: {
    flex: 1,
  },
  mesaDetailText: {
    fontSize: 15,
    color: "#574953ff",
    fontWeight: "600",
  },
  comensalText: {
    fontSize: 17,
    color: "#6c757d",
    marginTop: 2,
  },
  tiempoInfo: {
    alignItems: "flex-end",
  },
  tiempoLabel: {
    fontSize: 12,
    color: "#6c757d",
    textTransform: "uppercase",
    fontWeight: "500",
  },
  tiempoText: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "bold",
    marginTop: 1,
  },

  // INFORMACIÓN DEL MESERO

  meseroInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  meseroLabel: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "bold",
  },

  // BOTONES DE ACCIÓN (Entregar/Completado)

  productoActions: {
    padding: 16,
    paddingTop: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  entregarButton: {
    backgroundColor: "#28a745",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  completadoButton: {
    backgroundColor: "#e9ecef",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  completadoText: {
    color: "#6c757d",
    fontSize: 16,
    fontWeight: "600",
  },

  // ESTADOS VACÍOS Y CARGANDO

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#28a745",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 15,
    color: "#000000ff",
  },
});
