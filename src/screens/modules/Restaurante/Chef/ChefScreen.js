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

export default function ChefComandasSection() {
  const { token, logout, user } = useAuth();
  const navigation = useNavigation();

  const [comandas, setComandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        // Procesar las comandas para asegurar que todos los campos necesarios existan
        const comandasProcesadas = (response.data.data.comandas || []).map(
          (comanda) => ({
            ...comanda,
            productos: (comanda.productos || []).map((producto) => ({
              ...producto,
              estado: producto.estado || "pendiente", // Valor por defecto si es undefined
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
      return {
        fecha: "Fecha inválida",
        hora: "",
      };
    }
  };

  // Función auxiliar para capitalizar el estado de manera segura
  const capitalizeEstado = (estado) => {
    if (!estado || typeof estado !== "string") {
      return "Pendiente"; // Valor por defecto
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
      {/* Header agregado  */}
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
          comandas.map((comanda) => {
            const fechaFormateada = formatFecha(comanda.fecha);

            return (
              <View key={comanda.id} style={styles.comandaContainer}>
                {/* Encabezado de la comanda con número de mesa */}
                <View style={styles.mesaHeader}>
                  <Text style={styles.mesaText}>
                    Mesa {comanda.mesa || "N/A"}
                  </Text>
                  <View style={styles.mesaInfo}>
                    <Text style={styles.personasText}>
                      {comanda.personas || 0} personas
                    </Text>
                  </View>
                </View>

                {/* Información adicional de la comanda */}
                {comanda.comensal && (
                  <Text style={styles.comensalText}>
                    Comensal: {comanda.comensal}
                  </Text>
                )}

                {/* Lista de productos */}
                <View style={styles.productosContainer}>
                  {!comanda.productos || comanda.productos.length === 0 ? (
                    <Text style={styles.sinProductosText}>Sin productos</Text>
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

                {/* Información del pie de comanda */}
                <View style={styles.footerInfo}>
                  <View style={styles.fechaContainer}>
                    <Text style={styles.fechaText}>Fecha: {fechaFormateada.fecha}</Text>
                    <Text style={styles.fechaText}>Hora: {fechaFormateada.hora}</Text>
                  </View>


                  <Text style={styles.usuarioText}>
                    Mesero: {comanda.mesero?.nombre || "No asignado"}
                  </Text>
                  {comanda.ultimo_cambio &&
                    comanda.ultimo_cambio !== comanda.fecha && (
                      <Text style={styles.ultimoCambioText}>
                        Último cambio: {" "}
                        {formatFecha(comanda.ultimo_cambio).hora}
                      </Text>
                    )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
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
  scrollContainer: {
    flex: 1,
  },
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
  comandaContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 10,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mesaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#e0e0e0",
    marginBottom: 12,
  },
  mesaText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2196F3",
  },
  mesaInfo: {
    alignItems: "flex-end",
  },
  personasText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  estadoComandaText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  comensalText: {
    fontSize: 18,
    color: "#333",
    marginBottom: 12,
    fontWeight: "500",
  },
  productosContainer: {
    marginBottom: 12,
  },
  sinProductosText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  productoContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
  },
  // ESTILOS DEL HEADER SUPERIOR

  topHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
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
    gap: 40, // separa los elementos dentro del contenedor
    paddingHorizontal: 16,
  },

  leftColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  rightColumn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },


  userGreeting: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
    maxWidth: 195, //Ancho para que el texto se acomode
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


  // Estilos para productos pendientes (azul)
  productoPendiente: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  textoProductoPendiente: {
    color: "#1565C0",
  },
  // Estilos para productos entregados (verde)
  productoEntregado: {
    backgroundColor: "#E8F5E8",
    borderColor: "#4CAF50",
  },
  textoProductoEntregado: {
    color: "#2E7D32",
  },
  // Estilos para productos cancelados (rojo)
  productoCancelado: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F44336",
  },
  textoProductoCancelado: {
    color: "#C62828",
  },
  productoNombre: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  productoDetalle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  productoFooter: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  productoEstado: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  footerInfo: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
  },
  fechaContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},
  fechaText: {
    fontSize: 12,
    color: "#666",
  },
  usuarioText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  ultimoCambioText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
    fontWeight: "bold",
  },
});
