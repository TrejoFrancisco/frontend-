import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { API } from "../../../../services/api";
import { useAuth } from "../../../../AuthContext";
import { useNavigation } from "@react-navigation/native";
import { Dimensions } from "react-native";
import { useBackHandler } from "../../../../hooks/useBackHandler";

const screenWidth = Dimensions.get("window").width;
const isMobile = screenWidth <= 480;

export default function ChefComandasSection() {
  const { token, logout, user } = useAuth();

  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Manejo del botón de retroceso de Android
  const navigation = useNavigation();
  useBackHandler(navigation); // ¡Una sola línea!

  useEffect(() => {
    fetchComandas();
  }, []);

  const fetchComandas = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await API.get("/restaurante/chef/comandas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const comandasProcesadas = (response.data.data.comandas || []).map(
          (comanda) => ({
            ...comanda,
            productos: (comanda.productos || []).map((producto) => ({
              ...producto,
              estado: producto.estado || "pendiente",
              detalle: producto.detalle || null,
              nombre: producto.nombre || "Producto sin nombre",
              precio: producto.precio || 0,
            })),
          })
        );

        setComandas(comandasProcesadas);
      }
    } catch (error) {
      console.log("Error al obtener comandas:", error);
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
      { text: "Cancelar", style: "cancel" },
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
                  { headers: { Authorization: `Bearer ${token}` } }
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

  const getProductoEstadoStyle = (estado) => {
    switch (estado) {
      case "pendiente":
        return styles.productoPendiente;
      case "entregado":
        return styles.productoEntregado;
      case "cancelado":
        return styles.productoCancelado;
      default:
        return styles.productoPendiente;
    }
  };

  const getProductoTextStyle = (estado) => {
    switch (estado) {
      case "pendiente":
        return styles.textoProductoPendiente;
      case "entregado":
        return styles.textoProductoEntregado;
      case "cancelado":
        return styles.textoProductoCancelado;
      default:
        return styles.textoProductoPendiente;
    }
  };

  const formatFecha = (fecha) => {
    try {
      const date = new Date(fecha);
      return {
        fecha: date.toLocaleDateString(),
        hora: date.toLocaleTimeString(),
      };
    } catch (error) {
      return { fecha: "Fecha inválida", hora: "" };
    }
  };

  const capitalizeEstado = (estado) => {
    if (!estado || typeof estado !== "string") {
      return "Pendiente";
    }
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando comandas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header agregado */}
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

      <Text style={styles.title}>Comandas de Cocina</Text>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {comandas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay comandas disponibles</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {comandas.map((comanda) => {
              const fechaFormateada = formatFecha(comanda.fecha);
              const isExpanded = expandedId === comanda.id; // solo una abierta

              return (
                <View key={comanda.id} style={styles.comandaWrapper}>
                  {/* Tocar el header de mesa para expandir */}
                  <TouchableOpacity
                    onPress={() =>
                      setExpandedId((prev) =>
                        prev === comanda.id ? null : comanda.id
                      )
                    }
                    style={styles.mesaHeader}
                    activeOpacity={1}
                  >
                    <Text style={styles.mesaText}>
                      Mesa {comanda.mesa || "N/A"}
                    </Text>
                    <Text style={styles.personasText}>
                      {comanda.personas || 0} personas
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.comandaContainer}>
                      {comanda.comensal && (
                        <Text style={styles.comensalText}>
                          Comensal: {comanda.comensal}
                        </Text>
                      )}

                      {/* Lista de productos */}
                      <View style={styles.productosContainer}>
                        {!comanda.productos ||
                        comanda.productos.length === 0 ? (
                          <Text style={styles.sinProductosText}>
                            Sin productos
                          </Text>
                        ) : (
                          comanda.productos.map((producto, index) => (
                            <View
                              key={`${producto.id || index}-${index}`}
                              style={[
                                styles.productoContainer,
                                getProductoEstadoStyle(producto.estado),
                              ]}
                            >
                              <Text
                                style={[
                                  styles.productoNombre,
                                  getProductoTextStyle(producto.estado),
                                ]}
                              >
                                {producto.nombre}
                              </Text>

                              {producto.detalle && (
                                <Text style={styles.productoDetalle}>
                                  Detalle: {producto.detalle}
                                </Text>
                              )}

                              <View style={styles.productoFooter}>
                                <Text style={styles.productoEstado}>
                                  {capitalizeEstado(producto.estado)}
                                </Text>
                              </View>
                            </View>
                          ))
                        )}
                      </View>

                      {/* Información pie de comanda */}
                      <View style={styles.footerInfo}>
                        <View style={styles.fechaContainer}>
                          <Text style={styles.fechaText}>
                            Fecha: {fechaFormateada.fecha}
                          </Text>
                          <Text style={styles.fechaText}>
                            Hora: {fechaFormateada.hora}
                          </Text>
                        </View>

                        <Text style={styles.usuarioText}>
                          Mesero: {comanda.mesero?.nombre || "No asignado"}
                        </Text>
                        {comanda.ultimo_cambio &&
                          comanda.ultimo_cambio !== comanda.fecha && (
                            <Text style={styles.ultimoCambioText}>
                              Último cambio:{" "}
                              {formatFecha(comanda.ultimo_cambio).hora}
                            </Text>
                          )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ===== CONTENEDOR PRINCIPAL =====
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flex: 1,
  },

  // ===== TÍTULO =====
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },

  // ===== ESTADOS DE CARGA =====
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },

  // ===== ESTADO VACÍO =====
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },

  // ===== GRID RESPONSIVO =====
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center", // Siempre centrado
    alignItems: "flex-start", // Alineación superior
    paddingHorizontal: 60,
    gap: 15, // Espacio entre elementos
  },

  comandaWrapper: {
    width:
      screenWidth <= 600
        ? "95%"
        : screenWidth <= 768
        ? "45%"
        : screenWidth <= 1024
        ? "30%"
        : "280px",
    maxWidth: 500, // Ancho máximo
    minWidth: 300, // Ancho mínimo
    marginBottom: 15,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },

  // ===== HEADER DE MESA =====
  mesaHeader: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: "#f0f8ffff",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#adc9ffff",
    minHeight: 60,
    flexDirection: "row",
  },

  mesaText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#002e54ff",
    flex: 1,
  },

  personasText: {
    fontSize: 20,
    color: "#454545ff",
    fontWeight: "bold",
    marginTop: 2,
    textAlign: "right",
    flex: 1,
  },

  // ===== CONTENEDOR DE COMANDA =====
  comandaContainer: {
    backgroundColor: "#fff",
    padding: 12,
    minHeight: 200,
  },

  comensalText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 10,
    fontWeight: "500",
    lineHeight: 22,
  },

  // ===== PRODUCTOS =====
  productosContainer: {
    marginBottom: 12,
    flex: 1,
  },

  productoContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    position: "relative",
    minHeight: 60,
    flexDirection: "column",
    justifyContent: "flex-start",
  },

  productoNombre: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
    paddingRight: 80,
    lineHeight: 20,
    color: "#333",
  },

  productoDetalle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 6,
    fontStyle: "italic",
    paddingRight: 60,
    lineHeight: 16,
  },

  productoFooter: {
    position: "absolute",
    right: 8,
    top: 8,
  },

  productoEstado: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 70,
  },

  sinProductosText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },

  // ===== ESTILOS DE ESTADO DE PRODUCTO =====
  productoPendiente: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  textoProductoPendiente: {
    color: "#1565C0",
  },
  productoEntregado: {
    backgroundColor: "#E8F5E8",
    borderColor: "#4CAF50",
  },
  textoProductoEntregado: {
    color: "#2E7D32",
  },
  productoCancelado: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  textoProductoCancelado: {
    color: "#C62828",
  },

  // ===== INFORMACIÓN DEL PIE =====
  footerInfo: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
    marginTop: 8,
  },

  fechaContainer: {
    flexDirection: screenWidth <= 600 ? "column" : "row",
    justifyContent: "space-between",
    alignItems: screenWidth <= 600 ? "flex-start" : "center",
    marginBottom: 4,
    gap: screenWidth <= 600 ? 2 : 0,
  },

  fechaText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 18,
  },

  usuarioText: {
    fontSize: 15,
    color: "#666",
    marginTop: 3,
    fontWeight: "500",
  },

  ultimoCambioText: {
    fontSize: 15,
    color: "#999",
    marginTop: 3,
    fontWeight: "bold",
  },

  // ===== HEADER SUPERIOR =====
  topHeader: {
    backgroundColor: "#fff",
    paddingTop: 40,
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
    justifyContent: "flex-end",
  },

  // ===== SALUDO DE USUARIO =====
  userGreeting: {
    flexDirection: "row",
    alignItems: "center",
  },
  welcomeIcon: {
    width: 30,
    height: 25,
    marginRight: 5,
    resizeMode: "contain",
  },
  userWelcome: {
    fontSize: 25,
    color: "#333",
    fontWeight: "bold",
    maxWidth: 195,
  },

  // ===== BOTÓN LOGOUT =====
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 15,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
  },
  logoutIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  logoutButtonText: {
    fontSize: 22,
    color: "#000000ff",
    fontWeight: "500",
  },
});
