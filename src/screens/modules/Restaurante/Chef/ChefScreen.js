import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
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
                    <Text style={styles.estadoComandaText}>
                      Estado: {comanda.estado || "Sin estado"}
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
                          <Text style={styles.productoPrecio}>
                            ${producto.precio}
                          </Text>
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
                  <Text style={styles.fechaText}>
                    Fecha: {fechaFormateada.fecha} {fechaFormateada.hora}
                  </Text>
                  <Text style={styles.usuarioText}>
                    Mesero: {comanda.mesero?.nombre || "No asignado"}
                  </Text>
                  {comanda.ultimo_cambio &&
                    comanda.ultimo_cambio !== comanda.fecha && (
                      <Text style={styles.ultimoCambioText}>
                        Último cambio:{" "}
                        {formatFecha(comanda.ultimo_cambio).fecha}{" "}
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
    padding: 16,
  },
  title: {
    fontSize: 24,
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
    padding: 16,
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
  },
  estadoComandaText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  comensalText: {
    fontSize: 16,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productoPrecio: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  productoEstado: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  footerInfo: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 8,
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
    fontStyle: "italic",
  },
});
