import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { API } from "../../../../services/api";
import { useAuth } from "../../../../AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function ComandaSection() {
  const { token, logout, user } = useAuth();
  const navigation = useNavigation();
  const [comandas, setComandas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);

  const [nuevaComanda, setNuevaComanda] = useState({
    mesa: "",
    personas: "",
    comensal: "",
    productos: [],
  });
  const [productosSeleccionados, setProductosSeleccionados] = useState({});

  const [pagos, setPagos] = useState([{ metodo: "efectivo", monto: "" }]);
  const [productos, setProductos] = useState([]);

  const [busquedaProducto, setBusquedaProducto] = useState("");

  useEffect(() => {
    if (token) {
      fetchComandas();
      fetchProductos();
    }
  }, [token]);

  const fetchComandas = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await API.get("/restaurante/mesero/comanda", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setComandas(response.data.data || []);
      }
    } catch (error) {
      console.log("Error al obtener comandas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
      setComandas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductos = async () => {
    if (!token) return;

    try {
      const response = await API.get("restaurante/mesero/productos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setProductos(response.data.data.productos || []);
      }
    } catch (error) {
      console.log("Error al obtener productos:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }

      setProductos([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComandas();
    setRefreshing(false);
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "#ffc107";
      case "en preparación":
        return "#fd7e14";
      case "entregado":
        return "#28a745";
      case "cerrada":
        return "#6c757d";
      case "pagada":
        return "#198754";
      default:
        return "#6c757d";
    }
  };

  const getStatusText = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "en preparación":
        return "En Preparación";
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

  const crearComanda = async () => {
    if (!token) return;

    if (!nuevaComanda.mesa || !nuevaComanda.personas) {
      Alert.alert("Error", "Mesa y número de personas son campos obligatorios");
      return;
    }

    const datos = {
      mesa: nuevaComanda.mesa,
      personas: parseInt(nuevaComanda.personas),
      comensal: nuevaComanda.comensal,
      productos: nuevaComanda.productos,
    };

    try {
      const response = await API.post("/restaurante/mesero/comanda", datos, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        Alert.alert("Éxito", response.data.message);
        setModalVisible(false);
        resetNuevaComanda();
        fetchComandas();
      }
    } catch (error) {
      console.log("Error al crear comanda:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      }
    }
  };

  const editarComanda = async () => {
    if (!token || !selectedComanda) return;

    if (!nuevaComanda.mesa || !nuevaComanda.personas) {
      Alert.alert("Error", "Mesa y número de personas son campos obligatorios");
      return;
    }

    const datos = {
      mesa: nuevaComanda.mesa,
      personas: parseInt(nuevaComanda.personas),
      comensal: nuevaComanda.comensal,
      productos: nuevaComanda.productos,
    };

    try {
      const response = await API.put(
        `/restaurante/mesero/comanda/${selectedComanda.id}`,
        datos,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Éxito", response.data.message);
        setEditModalVisible(false);
        resetNuevaComanda();
        fetchComandas();
      }
    } catch (error) {
      console.log("Error al editar comanda:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      }
    }
  };

  const generarTicket = async (comanda) => {
    if (!token) return;

    try {
      const response = await API.get(
        `/restaurante/mesero/comanda_ticket/${comanda.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setTicket(response.data.data);
        setTicketModalVisible(true);

        const comandasActualizadas = comandas.map((c) =>
          c.id === comanda.id ? { ...c, estado: "cerrada" } : c
        );
        setComandas(comandasActualizadas);
      }
    } catch (error) {
      console.log("Error al generar ticket:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      }
    }
  };

  const procesarPago = async () => {
    if (!token || !selectedComanda) return;

    const pagosValidos = pagos.filter(
      (p) => p.monto && parseFloat(p.monto) > 0
    );
    if (pagosValidos.length === 0) {
      Alert.alert("Error", "Debe ingresar al menos un monto válido");
      return;
    }

    try {
      const response = await API.post(
        `/restaurante/mesero/comanda_pago/${selectedComanda.id}`,
        {
          pagos: pagosValidos.map((p) => ({
            metodo: p.metodo,
            monto: parseFloat(p.monto),
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Éxito", response.data.message);
        setPagoModalVisible(false);
        setPagos([{ metodo: "efectivo", monto: "" }]);
        fetchComandas();
      }
    } catch (error) {
      console.log("Error al pagar comanda:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      }
    }
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

  const resetNuevaComanda = () => {
    setNuevaComanda({
      mesa: "",
      personas: "",
      comensal: "",
      productos: [],
    });
    setProductosSeleccionados({});
    setBusquedaProducto("");
  };

  const openEditModal = (comanda) => {
    setSelectedComanda(comanda);

    const productosContados = {};
    comanda.productos?.forEach((producto) => {
      productosContados[producto.id] =
        (productosContados[producto.id] || 0) + 1;
    });

    setProductosSeleccionados(productosContados);
    setNuevaComanda({
      mesa: comanda.mesa || "",
      personas: comanda.personas?.toString() || "",
      comensal: comanda.comensal || "",
      productos: comanda.productos?.map((p) => p.id) || [],
    });
    setEditModalVisible(true);
  };

  const openPagoModal = (comanda) => {
    setSelectedComanda(comanda);
    const total =
      comanda.productos?.reduce(
        (sum, producto) => sum + parseFloat(producto.precio_venta || 0),
        0
      ) || 0;
    setPagos([{ metodo: "efectivo", monto: total.toString() }]);
    setPagoModalVisible(true);
  };

  const agregarProducto = (productoId) => {
    setProductosSeleccionados((prev) => ({
      ...prev,
      [productoId]: (prev[productoId] || 0) + 1,
    }));
    actualizarProductosArray();
  };

  const quitarProducto = (productoId) => {
    setProductosSeleccionados((prev) => {
      const nuevaCantidad = (prev[productoId] || 0) - 1;
      if (nuevaCantidad <= 0) {
        const { [productoId]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [productoId]: nuevaCantidad,
      };
    });
    actualizarProductosArray();
  };

  const actualizarProductosArray = () => {
    const productosArray = [];
    Object.entries(productosSeleccionados).forEach(([productoId, cantidad]) => {
      for (let i = 0; i < cantidad; i++) {
        productosArray.push(parseInt(productoId));
      }
    });

    setNuevaComanda((prev) => ({
      ...prev,
      productos: productosArray,
    }));
  };

  useEffect(() => {
    actualizarProductosArray();
  }, [productosSeleccionados]);

  const agregarPago = () => {
    setPagos([...pagos, { metodo: "efectivo", monto: "" }]);
  };

  const actualizarPago = (index, field, value) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index][field] = value;
    setPagos(nuevosPagos);
  };

  const eliminarPago = (index) => {
    if (pagos.length > 1) {
      setPagos(pagos.filter((_, i) => i !== index));
    }
  };

  const renderComandaCard = (comanda) => (
    <View key={comanda.id} style={styles.comandaCard}>
      <View style={styles.comandaHeader}>
        <Text style={styles.comandaMesa}>Mesa: {comanda.mesa}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(comanda.estado) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(comanda.estado)}</Text>
        </View>
      </View>

      <View style={styles.comandaDetails}>
        <Text style={styles.comandaDetail}>Personas: {comanda.personas}</Text>
        {comanda.comensal && (
          <Text style={styles.comandaDetail}>Comensal: {comanda.comensal}</Text>
        )}
        <Text style={styles.comandaDetail}>
          Productos: {comanda.productos?.length || 0}
        </Text>
        <Text style={styles.comandaDetail}>
          Fecha: {new Date(comanda.fecha).toLocaleDateString("es-MX")}
        </Text>
      </View>

      <View style={styles.comandaActions}>
        {/* Mostrar botón editar solo si no es pagada y no se ha generado ticket */}
        {comanda.estado !== "pagada" && comanda.estado !== "cerrada" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(comanda)}
          >
            <Text style={styles.actionButtonText}>✏️ Editar</Text>
          </TouchableOpacity>
        )}

        {/* Mostrar botón ticket solo si está entregado */}
        {comanda.estado === "entregado" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.ticketButton]}
            onPress={() => generarTicket(comanda)}
          >
            <Text style={styles.actionButtonText}>🎫 Ticket</Text>
          </TouchableOpacity>
        )}

        {/* Mostrar botón pagar solo si está cerrada (después de generar ticket) */}
        {comanda.estado === "cerrada" && (
          <TouchableOpacity
            style={[styles.actionButton, styles.pagoButton]}
            onPress={() => openPagoModal(comanda)}
          >
            <Text style={styles.actionButtonText}>💳 Pagar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderProductoItem = (producto) => {
    const cantidad = productosSeleccionados[producto.id] || 0;
    const isSelected = cantidad > 0;

    return (
      <View
        key={producto.id}
        style={[styles.productoItem, isSelected && styles.productoSelected]}
      >
        <View style={styles.productoInfo}>
          <Text style={styles.productoClave}>{producto.clave}</Text>
          <Text style={styles.productoNombre}>{producto.nombre}</Text>
          <Text style={styles.productoPrecio}>${producto.precio_venta}</Text>
        </View>

        <View style={styles.cantidadControls}>
          <TouchableOpacity
            style={styles.cantidadButton}
            onPress={() => quitarProducto(producto.id)}
            disabled={cantidad === 0}
          >
            <Text
              style={[
                styles.cantidadButtonText,
                cantidad === 0 && styles.cantidadButtonDisabled,
              ]}
            >
              -
            </Text>
          </TouchableOpacity>

          <Text style={styles.cantidadText}>{cantidad}</Text>

          <TouchableOpacity
            style={styles.cantidadButton}
            onPress={() => agregarProducto(producto.id)}
          >
            <Text style={styles.cantidadButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      producto.clave.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  const renderPagoItem = (pago, index) => (
    <View key={index} style={styles.pagoItem}>
      <View style={styles.pagoRow}>
        <Text style={styles.label}>Método:</Text>
        <View style={styles.metodoPagoContainer}>
          {["efectivo", "tarjeta", "transferencia"].map((metodo) => (
            <TouchableOpacity
              key={metodo}
              style={[
                styles.metodoPago,
                pago.metodo === metodo && styles.metodoPagoSelected,
              ]}
              onPress={() => actualizarPago(index, "metodo", metodo)}
            >
              <Text
                style={[
                  styles.metodoPagoText,
                  pago.metodo === metodo && styles.metodoPagoTextSelected,
                ]}
              >
                {metodo}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.pagoRow}>
        <Text style={styles.label}>Monto:</Text>
        <TextInput
          style={styles.montoInput}
          value={pago.monto}
          onChangeText={(value) => actualizarPago(index, "monto", value)}
          keyboardType="numeric"
          placeholder="0.00"
        />
        {pagos.length > 1 && (
          <TouchableOpacity
            style={styles.eliminarPago}
            onPress={() => eliminarPago(index)}
          >
            <Text style={styles.eliminarPagoText}>❌</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Cargando comandas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userWelcome}>👋 Hola, {user?.name}</Text>
          <Text style={styles.userRole}>
            Rol: {user?.role === "meseros_restaurant" ? "Mesero" : user?.role}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Salir</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Mis Comandas</Text>
          <TouchableOpacity
            style={styles.nuevaComandaButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.nuevaComandaButtonText}>➕ Nueva Comanda</Text>
          </TouchableOpacity>
        </View>

        {comandas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tienes comandas registradas</Text>
            <Text style={styles.emptySubtext}>
              Crea tu primera comanda usando el botón de arriba
            </Text>
          </View>
        ) : (
          comandas.map((comanda) => renderComandaCard(comanda))
        )}
      </ScrollView>

      {/* Modal Nueva Comanda */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nueva Comanda</Text>

              <ScrollView style={styles.formScrollView}>
                <TextInput
                  style={styles.input}
                  placeholder="Mesa *"
                  value={nuevaComanda.mesa}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, mesa: value }))
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Número de personas *"
                  value={nuevaComanda.personas}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, personas: value }))
                  }
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nombre del comensal (opcional)"
                  value={nuevaComanda.comensal}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, comensal: value }))
                  }
                />

                <Text style={styles.sectionTitle}>Productos:</Text>

                {/* Buscador de productos */}
                <TextInput
                  style={styles.buscadorInput}
                  placeholder="Buscar productos por nombre o clave..."
                  value={busquedaProducto}
                  onChangeText={setBusquedaProducto}
                />

                {/* Lista de productos filtrados */}
                {productosFiltrados.length === 0 ? (
                  <Text style={styles.noProductosText}>
                    {productos.length === 0
                      ? "Cargando productos..."
                      : "No se encontraron productos"}
                  </Text>
                ) : (
                  productosFiltrados.map((producto) =>
                    renderProductoItem(producto)
                  )
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalVisible(false);
                    resetNuevaComanda();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={crearComanda}
                >
                  <Text style={styles.saveButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Editar Comanda */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Comanda</Text>

              <ScrollView style={styles.formScrollView}>
                <TextInput
                  style={styles.input}
                  placeholder="Mesa *"
                  value={nuevaComanda.mesa}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, mesa: value }))
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Número de personas *"
                  value={nuevaComanda.personas}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, personas: value }))
                  }
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nombre del comensal (opcional)"
                  value={nuevaComanda.comensal}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, comensal: value }))
                  }
                />

                <Text style={styles.sectionTitle}>Productos:</Text>

                {/* Buscador de productos */}
                <TextInput
                  style={styles.buscadorInput}
                  placeholder="Buscar productos por nombre o clave..."
                  value={busquedaProducto}
                  onChangeText={setBusquedaProducto}
                />

                {/* Lista de productos filtrados */}
                {productosFiltrados.length === 0 ? (
                  <Text style={styles.noProductosText}>
                    {productos.length === 0
                      ? "Cargando productos..."
                      : "No se encontraron productos"}
                  </Text>
                ) : (
                  productosFiltrados.map((producto) =>
                    renderProductoItem(producto)
                  )
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEditModalVisible(false);
                    resetNuevaComanda();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={editarComanda}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Ticket */}
      <Modal visible={ticketModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.ticketModalContent}>
              <Text style={styles.ticketModalTitle}>🎫 Ticket de Cuenta</Text>

              {ticket && (
                <ScrollView style={styles.ticketScrollView}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketMesa}>Mesa: {ticket.mesa}</Text>
                    <Text style={styles.ticketFecha}>
                      {new Date(ticket.fecha).toLocaleString("es-MX")}
                    </Text>
                    {ticket.comensal && (
                      <Text style={styles.ticketComensal}>
                        Comensal: {ticket.comensal}
                      </Text>
                    )}
                  </View>

                  <View style={styles.ticketDivider} />

                  <View style={styles.ticketProductos}>
                    <Text style={styles.ticketProductosTitle}>Productos:</Text>
                    {ticket.productos?.map((producto, index) => (
                      <View key={index} style={styles.ticketProductoItem}>
                        <Text style={styles.ticketProductoNombre}>
                          {producto.nombre}
                        </Text>
                        <Text style={styles.ticketProductoPrecio}>
                          ${producto.precio_venta}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.ticketDivider} />

                  <View style={styles.ticketTotal}>
                    <Text style={styles.ticketTotalText}>
                      Total: ${ticket.total}
                    </Text>
                  </View>
                </ScrollView>
              )}

              <View style={styles.ticketModalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.closeTicketButton]}
                  onPress={() => setTicketModalVisible(false)}
                >
                  <Text style={styles.closeTicketButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Pago */}
      <Modal visible={pagoModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Procesar Pago</Text>
              <Text style={styles.totalText}>
                Total: $
                {selectedComanda?.productos
                  ?.reduce((sum, p) => sum + parseFloat(p.precio_venta || 0), 0)
                  .toFixed(2) || "0.00"}
              </Text>

              <ScrollView style={styles.pagoScrollView}>
                {pagos.map((pago, index) => renderPagoItem(pago, index))}

                <TouchableOpacity
                  style={styles.agregarPagoButton}
                  onPress={agregarPago}
                >
                  <Text style={styles.agregarPagoText}>
                    + Agregar otro método de pago
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setPagoModalVisible(false);
                    setPagos([{ metodo: "efectivo", monto: "" }]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.pagarButton]}
                  onPress={procesarPago}
                >
                  <Text style={styles.pagarButtonText}>Procesar Pago</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  userInfo: {
    flex: 1,
  },
  userWelcome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 12,
    color: "#6c757d",
    textTransform: "capitalize",
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },

  ticketModalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    maxHeight: "80%",
    width: "90%",
  },
  ticketModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  ticketScrollView: {
    maxHeight: 400,
  },
  ticketHeader: {
    marginBottom: 15,
  },
  ticketMesa: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  ticketFecha: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  ticketComensal: {
    fontSize: 16,
    color: "#444",
    marginBottom: 5,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 15,
  },
  ticketProductos: {
    marginBottom: 15,
  },
  ticketProductosTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  ticketProductoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  ticketProductoNombre: {
    fontSize: 14,
    color: "#444",
    flex: 1,
  },
  ticketProductoPrecio: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  ticketTotal: {
    alignItems: "center",
  },
  ticketTotalText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#28a745",
  },
  ticketModalActions: {
    marginTop: 20,
  },
  closeTicketButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeTicketButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  cantidadControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cantidadButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  cantidadButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  cantidadText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },
  productoInfo: {
    flex: 1,
    marginRight: 10,
  },
  productoClave: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  productoNombre: {
    fontSize: 14,
    color: "#333",
    marginVertical: 2,
  },
  productoPrecio: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#28a745",
  },
  productoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  productoSelected: {
    backgroundColor: "#e7f3ff",
    borderColor: "#007bff",
  },

  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  nuevaComandaButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nuevaComandaButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  comandaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comandaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  comandaMesa: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  comandaDetails: {
    marginBottom: 12,
  },
  comandaDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  comandaActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: "#28a745",
  },
  ticketButton: {
    backgroundColor: "#17a2b8",
  },
  pagoButton: {
    backgroundColor: "#ffc107",
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrapper: {
    width: "90%",
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  formScrollView: {
    maxHeight: 400,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  productoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "white",
  },
  productoSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 2,
  },
  productoInfo: {
    flex: 1,
  },
  productoClave: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  productoNombre: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginTop: 2,
  },
  productoPrecio: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "bold",
    marginLeft: 8,
  },
  productoSeleccionado: {
    fontSize: 16,
    color: "#2196f3",
    fontWeight: "bold",
    marginLeft: 8,
  },
  buscadorInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#f8f9fa",
  },
  noProductosText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  pagarButton: {
    backgroundColor: "#ffc107",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  pagarButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#28a745",
  },
  pagoScrollView: {
    maxHeight: 300,
  },
  pagoItem: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pagoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    width: 60,
    fontSize: 14,
    fontWeight: "500",
  },
  metodoPagoContainer: {
    flexDirection: "row",
    flex: 1,
    gap: 8,
  },
  metodoPago: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  metodoPagoSelected: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  metodoPagoText: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  metodoPagoTextSelected: {
    color: "white",
  },
  montoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 8,
  },
  eliminarPago: {
    marginLeft: 8,
    padding: 4,
  },
  eliminarPagoText: {
    fontSize: 16,
  },
  agregarPagoButton: {
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 8,
    borderStyle: "dashed",
  },
  agregarPagoText: {
    color: "#007bff",
    fontWeight: "500",
  },
});
