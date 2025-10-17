import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { API } from "../../../../services/api";
import { useAuth } from "../../../../AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useBackHandler } from "../../../../hooks/useBackHandler";

export default function ComandaSection() {
  const { token, logout, user } = useAuth();
  const [comandas, setComandas] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [unificarModalVisible, setUnificarModalVisible] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [detallesProductos, setDetallesProductos] = useState({});
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [productoParaDetalle, setProductoParaDetalle] = useState(null);
  const [detalleTemp, setDetalleTemp] = useState("undefined");
  const [mesasSeleccionadas, setMesasSeleccionadas] = useState([]);
  const [comandasUnificadas, setComandasUnificadas] = useState([]);
  const [comandasSeleccionadas, setComandasSeleccionadas] = useState([]);

  const navigation = useNavigation();
  useBackHandler(navigation);

  const [nuevaComanda, setNuevaComanda] = useState({
    nombre: "",
    mesa: "",
    personas: "",
    comensal: "",
    productos: [],
  });

  const [productosSeleccionados, setProductosSeleccionados] = useState({});
  const [pagos, setPagos] = useState([{ metodo: "efectivo", monto: "" }]);
  const [productos, setProductos] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");

  // ========================================
  // FUNCIONES MEMOIZADAS CON useCallback
  // ========================================

  const fetchComandas = useCallback(async () => {
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
        setComandas(response.data.data.comandas || []);
        setComandasUnificadas(response.data.data.comandas_unificadas || []);
      }
    } catch (error) {
      console.log("Error al obtener comandas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
      setComandas([]);
      setComandasUnificadas([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigation]);

  const fetchProductos = useCallback(async () => {
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
  }, [token, navigation]);

  useEffect(() => {
    if (token) {
      fetchComandas();
      fetchProductos();
    }
  }, [token, fetchComandas, fetchProductos]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComandas();
    setRefreshing(false);
  }, [fetchComandas]);

  const resetNuevaComanda = useCallback(() => {
    setNuevaComanda({
      mesa: "",
      personas: "",
      comensal: "",
      productos: [],
    });
    setProductosSeleccionados({});
    setBusquedaProducto("");
    setDetallesProductos({});
  }, []);

  const crearComanda = useCallback(async () => {
    if (!token) return;

    if (!nuevaComanda.mesa || !nuevaComanda.personas) {
      Alert.alert("Error", "Mesa y número de personas son campos obligatorios");
      return;
    }

    if (nuevaComanda.productos.length === 0) {
      Alert.alert("Error", "Debe seleccionar al menos un producto");
      return;
    }

    const productosConDetalle = nuevaComanda.productos.map(
      (productoId, index) => {
        const key = `${productoId}_${index}`;
        return {
          id: productoId,
          detalle: detallesProductos[key] || null,
        };
      }
    );

    const datos = {
      mesa: nuevaComanda.mesa,
      personas: parseInt(nuevaComanda.personas),
      comensal: nuevaComanda.comensal || null,
      productos: productosConDetalle,
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
      } else {
        Alert.alert("Error", "Ocurrió un error al crear la comanda");
      }
    }
  }, [
    token,
    nuevaComanda,
    detallesProductos,
    resetNuevaComanda,
    fetchComandas,
    navigation,
  ]);

  const editarComanda = useCallback(async () => {
    if (!token || !selectedComanda) return;

    if (!nuevaComanda.mesa || !nuevaComanda.personas) {
      Alert.alert("Error", "Mesa y número de personas son campos obligatorios");
      return;
    }

    if (nuevaComanda.productos.length === 0) {
      Alert.alert("Error", "Debe seleccionar al menos un producto");
      return;
    }

    const productosConDetalle = nuevaComanda.productos.map(
      (productoId, index) => {
        const key = `${productoId}_${index}`;
        return {
          id: productoId,
          detalle: detallesProductos[key] || null,
        };
      }
    );

    const datos = {
      mesa: nuevaComanda.mesa,
      personas: parseInt(nuevaComanda.personas),
      comensal: nuevaComanda.comensal || null,
      productos: productosConDetalle,
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
      } else {
        Alert.alert("Error", "Ocurrió un error al editar la comanda");
      }
    }
  }, [
    token,
    selectedComanda,
    nuevaComanda,
    detallesProductos,
    resetNuevaComanda,
    fetchComandas,
    navigation,
  ]);

  const generarTicket = useCallback(
    async (comanda) => {
      if (!token) return;

      Alert.alert(
        "Generar Ticket",
        "¿Está seguro de generar el ticket? Esta acción marcará los productos pendientes como cancelados.",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Generar",
            onPress: async () => {
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
                  fetchComandas();
                }
              } catch (error) {
                console.log("Error al generar ticket:", error);
                if (error.response?.status === 401) {
                  navigation.navigate("Login");
                } else if (error.response?.data?.error) {
                  Alert.alert("Error", error.response.data.error.message);
                }
              }
            },
          },
        ]
      );
    },
    [token, fetchComandas, navigation]
  );

  const generarTicketMultiple = useCallback(
    async (comandaUnificada) => {
      if (!token) return;

      try {
        const response = await API.get(
          `/restaurante/mesero/comanda_ticket_multiple/${comandaUnificada.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setTicket(response.data.ticket);
          setTicketModalVisible(true);
          fetchComandas();
        }
      } catch (error) {
        console.log("Error al generar ticket múltiple:", error);
        if (error.response?.status === 401) {
          navigation.navigate("Login");
        } else if (error.response?.data?.error) {
          Alert.alert("Error", error.response.data.error.message);
        }
      }
    },
    [token, fetchComandas, navigation]
  );

  const procesarPago = useCallback(async () => {
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
  }, [token, selectedComanda, pagos, fetchComandas, navigation]);

  const unificarComandasSeleccionadas = useCallback(async () => {
    if (!token) return;

    if (comandasSeleccionadas.length < 2) {
      Alert.alert(
        "Error",
        "Debe seleccionar al menos 2 comandas para unificar"
      );
      return;
    }

    try {
      const response = await API.post(
        "/restaurante/mesero/comandas/unificar",
        {
          comandas_ids: comandasSeleccionadas,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert("Éxito", response.data.message);
        setUnificarModalVisible(false);
        setComandasSeleccionadas([]);
        fetchComandas();
      }
    } catch (error) {
      console.log("Error al unificar comandas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      } else {
        Alert.alert("Error", "Ocurrió un error al unificar las comandas");
      }
    }
  }, [token, comandasSeleccionadas, fetchComandas, navigation]);

  const handleLogout = useCallback(() => {
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
  }, [token, logout, navigation]);

  const openEditModal = useCallback((comanda) => {
    setSelectedComanda(comanda);

    const productosContados = {};
    const detallesIniciales = {};
    const contadorPorProducto = {};
    const productosArray = [];

    comanda.productos?.forEach((producto) => {
      productosContados[producto.id] =
        (productosContados[producto.id] || 0) + 1;

      productosArray.push(producto.id);

      if (!contadorPorProducto[producto.id]) {
        contadorPorProducto[producto.id] = 0;
      }

      const indice = contadorPorProducto[producto.id];
      const key = `${producto.id}_${indice}`;

      if (producto.pivot?.detalle) {
        detallesIniciales[key] = producto.pivot.detalle;
      }

      contadorPorProducto[producto.id]++;
    });

    setProductosSeleccionados(productosContados);
    setDetallesProductos(detallesIniciales);
    setBusquedaProducto("");

    setNuevaComanda({
      mesa: comanda.mesa || "",
      personas: comanda.personas?.toString() || "",
      comensal: comanda.comensal || "",
      productos: productosArray,
    });

    setEditModalVisible(true);
  }, []);

  const openPagoModal = useCallback((comanda) => {
    setSelectedComanda(comanda);
    const total =
      comanda.productos
        ?.filter((producto) => producto.pivot?.estado === "entregado")
        .reduce(
          (sum, producto) => sum + parseFloat(producto.precio_venta || 0),
          0
        ) || 0;

    setPagos([{ metodo: "efectivo", monto: total.toString() }]);
    setPagoModalVisible(true);
  }, []);

  const agregarProducto = useCallback((productoId) => {
    setProductosSeleccionados((prev) => ({
      ...prev,
      [productoId]: (prev[productoId] || 0) + 1,
    }));
  }, []);

  const quitarProducto = useCallback((productoId) => {
    setProductosSeleccionados((prev) => {
      const nuevaCantidad = (prev[productoId] || 0) - 1;
      if (nuevaCantidad <= 0) {
        const { [productoId]: removed, ...rest } = prev;

        setDetallesProductos((prevDetalles) => {
          const nuevosDetalles = { ...prevDetalles };
          Object.keys(nuevosDetalles).forEach((key) => {
            if (key.startsWith(`${productoId}_`)) {
              delete nuevosDetalles[key];
            }
          });
          return nuevosDetalles;
        });

        return rest;
      } else {
        setDetallesProductos((prevDetalles) => {
          const nuevosDetalles = { ...prevDetalles };
          const keyToRemove = `${productoId}_${nuevaCantidad}`;
          if (nuevosDetalles[keyToRemove]) {
            delete nuevosDetalles[keyToRemove];
          }
          return nuevosDetalles;
        });
      }

      return {
        ...prev,
        [productoId]: nuevaCantidad,
      };
    });
  }, []);

  const actualizarProductosArray = useCallback(() => {
    setTimeout(() => {
      const productosArray = [];
      Object.entries(productosSeleccionados).forEach(
        ([productoId, cantidad]) => {
          for (let i = 0; i < cantidad; i++) {
            productosArray.push(parseInt(productoId));
          }
        }
      );

      setNuevaComanda((prev) => ({
        ...prev,
        productos: productosArray,
      }));
    }, 0);
  }, [productosSeleccionados]);

  useEffect(() => {
    actualizarProductosArray();
  }, [actualizarProductosArray]);

  const agregarPago = useCallback(() => {
    setPagos((prev) => [...prev, { metodo: "efectivo", monto: "" }]);
  }, []);

  const actualizarPago = useCallback((index, field, value) => {
    setPagos((prev) => {
      const nuevosPagos = [...prev];
      nuevosPagos[index][field] = value;
      return nuevosPagos;
    });
  }, []);

  const eliminarPago = useCallback((index) => {
    setPagos((prev) => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  }, []);

  const getProductosComandaActual = useCallback(() => {
    if (!selectedComanda || !selectedComanda.productos) return [];

    const productosIds = [
      ...new Set(selectedComanda.productos.map((p) => p.id)),
    ];

    return productosIds
      .map((id) => {
        const producto =
          productos.find((p) => p.id === id) ||
          selectedComanda.productos.find((p) => p.id === id);
        return producto;
      })
      .filter(Boolean);
  }, [selectedComanda, productos]);

  const getProductosBusqueda = useCallback(() => {
    if (!busquedaProducto.trim()) return [];

    const productosComandaIds =
      selectedComanda?.productos?.map((p) => p.id) || [];

    return productos.filter(
      (producto) =>
        !productosComandaIds.includes(producto.id) &&
        (producto.nombre
          .toLowerCase()
          .includes(busquedaProducto.toLowerCase()) ||
          producto.clave.toLowerCase().includes(busquedaProducto.toLowerCase()))
    );
  }, [busquedaProducto, selectedComanda, productos]);

  const abrirModalDetalle = useCallback(
    (productoId, indice) => {
      const key = `${productoId}_${indice}`;
      setProductoParaDetalle({ id: productoId, indice });
      setDetalleTemp(detallesProductos[key] || "");
      setModalDetalleVisible(true);
    },
    [detallesProductos]
  );

  const guardarDetalle = useCallback(() => {
    const key = `${productoParaDetalle.id}_${productoParaDetalle.indice}`;
    setDetallesProductos((prev) => ({
      ...prev,
      [key]: detalleTemp.trim() || null,
    }));
    setModalDetalleVisible(false);
    setDetalleTemp("");
    setProductoParaDetalle(null);
  }, [productoParaDetalle, detalleTemp]);

  // Función para calcular el total de productos seleccionados
  const calcularTotal = useCallback(() => {
    let total = 0;
    Object.entries(productosSeleccionados).forEach(([productoId, cantidad]) => {
      const producto = productos.find((p) => p.id === parseInt(productoId));
      if (producto) {
        total += parseFloat(producto.precio_venta) * cantidad;
      }
    });
    return total.toFixed(2);
  }, [productosSeleccionados, productos]);

  // Función para acortar nombre de comensal
  const acortarComensal = useCallback((nombre) => {
    if (!nombre) return "";
    if (nombre.length <= 15) return nombre;
    return nombre.substring(0, 15) + "...";
  }, []);

  // Función para manejar unificación de mesas
  const toggleComandaSeleccionada = useCallback((comandaId) => {
    setComandasSeleccionadas((prev) => {
      if (prev.includes(comandaId)) {
        return prev.filter((id) => id !== comandaId);
      } else {
        return [...prev, comandaId];
      }
    });
  }, []);

  const confirmarUnificacion = useCallback(() => {
    if (comandasSeleccionadas.length < 2) {
      Alert.alert(
        "Error",
        "Debe seleccionar al menos 2 comandas para unificar"
      );
      return;
    }

    const mesasSeleccionadas = comandas
      .filter((c) => comandasSeleccionadas.includes(c.id))
      .map((c) => c.mesa)
      .join(", ");

    Alert.alert(
      "Unificar Comandas",
      `¿Desea unificar las comandas de las mesas ${mesasSeleccionadas}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Unificar",
          onPress: unificarComandasSeleccionadas,
        },
      ]
    );
  }, [comandasSeleccionadas, comandas, unificarComandasSeleccionadas]);

  // ========================================
  // RENDERIZADO DE COMPONENTES
  // ========================================

  const renderComandaCard = useCallback(
    (comanda) => (
      <View key={comanda.id} style={styles.comandaCard}>
        <View style={styles.comandaHeaderRow}>
          <Text style={styles.comandaMesa}>Mesa {comanda.mesa}</Text>

          {comanda.comensal && (
            <Text style={styles.comandaComensal}>
              {acortarComensal(comanda.comensal)}
            </Text>
          )}

          <Text style={styles.comandaDetail}>Personas: {comanda.personas}</Text>

          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>
              Productos: {comanda.productos?.length || 0}
            </Text>
          </View>

          <Text style={styles.comandaDetail}>
            {new Date(comanda.fecha).toLocaleDateString("es-MX")}
          </Text>
        </View>

        <View style={styles.comandaActions}>
          {comanda.estado !== "pagada" && comanda.estado !== "cerrada" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => openEditModal(comanda)}
            >
              <View style={styles.buttonContent}>
                <Image
                  source={require("../../../../../assets/editarr.png")}
                  style={styles.iconImage}
                />
                <Text style={styles.actionButtonText}>Editar</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.ticketButton]}
            onPress={() => generarTicket(comanda)}
          >
            <View style={styles.buttonContent}>
              <Image
                source={require("../../../../../assets/ticket.png")}
                style={styles.iconImage}
              />
              <Text style={styles.actionButtonText}>Ticket</Text>
            </View>
          </TouchableOpacity>
          {comanda.estado === "cerrada" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.pagoButton]}
              onPress={() => openPagoModal(comanda)}
            >
              <View style={styles.buttonContent}>
                <Image
                  source={require("../../../../../assets/card.png")}
                  style={styles.pagoIcon}
                />
                <Text style={styles.actionButtonText}>Pagar</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ),
    [openEditModal, generarTicket, openPagoModal, acortarComensal]
  );

  const renderComandaUnificada = useCallback(
    (comandaUnificada) => (
      <View
        key={`unificada-${comandaUnificada.id}`}
        style={styles.comandaCardUnificada}
      >
        <View style={styles.unificadaBadge}>
          <Text style={styles.unificadaBadgeText}>UNIFICADA</Text>
        </View>

        <View style={styles.comandaHeaderRow}>
          <Text style={styles.comandaMesa}>Mesas: {comandaUnificada.mesa}</Text>

          <Text style={styles.comandaDetail}>
            Comensales: {comandaUnificada.comensales}
          </Text>

          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>
              Productos: {comandaUnificada.productos?.length || 0}
            </Text>
          </View>

          <Text style={styles.comandaDetail}>
            {new Date(comandaUnificada.fecha).toLocaleDateString("es-MX")}
          </Text>
        </View>

        <View style={styles.comandaActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.ticketButton]}
            onPress={() => {
              Alert.alert(
                "Generar Ticket Unificado",
                "¿Está seguro de generar el ticket unificado?",
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Generar",
                    onPress: () => generarTicketMultiple(comandaUnificada),
                  },
                ]
              );
            }}
          >
            <View style={styles.buttonContent}>
              <Image
                source={require("../../../../../assets/ticket.png")}
                style={styles.iconImage}
              />
              <Text style={styles.actionButtonText}>Ticket</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [generarTicketMultiple]
  );

  const renderProductoItem = useCallback(
    (producto, isFromBusqueda = false) => {
      const cantidad = productosSeleccionados[producto.id] || 0;
      const isSelected = cantidad > 0;

      return (
        <View
          key={`${producto.id}-${isFromBusqueda ? "busqueda" : "comanda"}`}
          style={[
            styles.productoItem,
            isSelected && styles.productoSelected,
            isFromBusqueda && styles.productoBusqueda,
          ]}
        >
          <View style={styles.productoContainer}>
            <View style={styles.productoInfo}>
              <Text style={styles.productoClave}>{producto.clave}</Text>
              <Text style={styles.productoNombre}>
                {producto.nombre}
                {isFromBusqueda && (
                  <Text style={styles.nuevoProductoTag}> (NUEVO)</Text>
                )}
              </Text>
              <Text style={styles.productoPrecio}>
                ${producto.precio_venta}
              </Text>
            </View>

            <View style={styles.cantidadControls}>
              <TouchableOpacity
                style={[
                  styles.cantidadButton,
                  cantidad === 0 && styles.cantidadButtonDisabled,
                ]}
                onPress={() => quitarProducto(producto.id)}
                disabled={cantidad === 0}
              >
                <Text style={styles.cantidadButtonText}>-</Text>
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

          {isSelected && (
            <View style={styles.detallesContainer}>
              <View style={styles.detallesSeparador} />

              {Array.from({ length: cantidad }, (_, index) => {
                const key = `${producto.id}_${index}`;
                const detalleGuardado = detallesProductos[key];

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.detalleItem,
                      styles.detalleItemConBorde,
                      detalleGuardado && styles.detalleItemConDetalle,
                    ]}
                    onPress={() => abrirModalDetalle(producto.id, index)}
                    activeOpacity={0.7}
                  >
                    {detalleGuardado ? (
                      <View style={styles.detalleContenido}>
                        <Text style={styles.detalleTextoConFondo}>
                          #{index + 1} {detalleGuardado.substring(0, 20)}
                          {detalleGuardado.length > 20 ? "..." : ""}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.detalleTexto}>
                        #{index + 1} Agregar detalle
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      );
    },
    [
      productosSeleccionados,
      detallesProductos,
      agregarProducto,
      quitarProducto,
      abrirModalDetalle,
    ]
  );

  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      producto.clave.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  const renderPagoItem = useCallback(
    (pago, index) => (
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
            placeholderTextColor="#999"
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
    ),
    [pagos, actualizarPago, eliminarPago]
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
        <View style={styles.headerContainer}>
          <View style={styles.rowWrap}>
            <Text style={styles.contentTitle}>Mis Comandas</Text>

            <TouchableOpacity
              style={styles.nuevaComandaButton}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.buttonContent}>
                <Image
                  source={require("../../../../../assets/agreg.png")}
                  style={styles.iconImage}
                />
                <Text style={styles.nuevaComandaButtonText}>Nueva Comanda</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unificarButton}
              onPress={() => setUnificarModalVisible(true)}
            >
              <Text style={styles.unificarButtonText}>Unificar Mesas</Text>
            </TouchableOpacity>
          </View>
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
        {comandasUnificadas.map((comandaUnificada) =>
          renderComandaUnificada(comandaUnificada)
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
                  placeholder="Mesa"
                  placeholderTextColor="#999999"
                  value={nuevaComanda.mesa}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, mesa: value }))
                  }
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Número de personas"
                  placeholderTextColor="#999999"
                  value={nuevaComanda.personas}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, personas: value }))
                  }
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nombre del comensal"
                  placeholderTextColor="#999999"
                  value={nuevaComanda.comensal}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, comensal: value }))
                  }
                />

                <Text style={styles.sectionTitle}>Productos:</Text>

                <TextInput
                  style={styles.buscadorInput}
                  placeholder="Buscar productos por nombre o clave..."
                  placeholderTextColor="#999999"
                  value={busquedaProducto}
                  onChangeText={setBusquedaProducto}
                />

                {/* Sección de productos seleccionados */}
                {Object.keys(productosSeleccionados).length > 0 && (
                  <View style={styles.productosSeleccionadosContainer}>
                    <Text style={styles.productosSeleccionadosTitle}>
                      Productos Seleccionados:
                    </Text>
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalMonto}>${calcularTotal()}</Text>
                    </View>
                  </View>
                )}

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
                    setDetallesProductos({});
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

      {/* Modal Editar Comanda  */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Comanda</Text>

              <ScrollView style={styles.formScrollView}>
                <TextInput
                  style={styles.input}
                  placeholder="Mesa"
                  placeholderTextColor="#999"
                  value={nuevaComanda.mesa}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, mesa: value }))
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Número de personas"
                  placeholderTextColor="#999"
                  value={nuevaComanda.personas}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, personas: value }))
                  }
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nombre del comensal (opcional)"
                  placeholderTextColor="#999"
                  value={nuevaComanda.comensal}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, comensal: value }))
                  }
                />

                <Text style={styles.sectionTitle}>
                  Productos de la Comanda:
                </Text>

                {/* Mostrar total en edición */}
                {Object.keys(productosSeleccionados).length > 0 && (
                  <View style={styles.productosSeleccionadosContainer}>
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalLabel}>Total:</Text>
                      <Text style={styles.totalMonto}>${calcularTotal()}</Text>
                    </View>
                  </View>
                )}

                {getProductosComandaActual().length === 0 ? (
                  <Text style={styles.noProductosText}>
                    No hay productos en esta comanda
                  </Text>
                ) : (
                  getProductosComandaActual().map((producto) =>
                    renderProductoItem(producto, false)
                  )
                )}

                <View style={styles.separador}>
                  <Text style={styles.separadorTexto}>
                    Agregar más productos:
                  </Text>
                </View>

                <TextInput
                  style={[styles.buscadorInput, styles.buscadorAgregar]}
                  placeholder="Buscar productos para agregar..."
                  placeholderTextColor="#666"
                  value={busquedaProducto}
                  onChangeText={setBusquedaProducto}
                />

                {busquedaProducto.trim() !== "" && (
                  <>
                    {getProductosBusqueda().length === 0 ? (
                      <Text style={styles.noProductosText}>
                        No se encontraron productos nuevos
                      </Text>
                    ) : (
                      getProductosBusqueda().map((producto) =>
                        renderProductoItem(producto, true)
                      )
                    )}
                  </>
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setEditModalVisible(false);
                    resetNuevaComanda();
                    setDetallesProductos({});
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

      {/* Modal Detalle Producto */}
      <Modal visible={modalDetalleVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Detalle del Producto</Text>

              <TextInput
                style={styles.detalleInput}
                placeholder="Ejemplo: Con hielos, sin cebolla, etc."
                placeholderTextColor="#999999"
                value={detalleTemp || undefined} 
                onChangeText={setDetalleTemp}
                multiline={true}
                numberOfLines={3}
              />



              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setModalDetalleVisible(false);
                    setDetalleTemp("");
                    setProductoParaDetalle(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={guardarDetalle}
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
              <View style={styles.ticketModalTitleContainer}>
                <Image
                  source={require("../../../../../assets/ticket.png")}
                  style={styles.ticketIcon}
                />
                <Text style={styles.ticketModalTitle}>Ticket de Cuenta</Text>
              </View>

              {ticket && (
                <ScrollView style={styles.ticketScrollView}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketNegocio}>{ticket.negocio}</Text>
                    <Text style={styles.ticketMesa}>Mesa {ticket.mesa}</Text>
                    <Text style={styles.ticketFecha}>
                      {new Date(ticket.fecha).toLocaleString("es-MX")}
                    </Text>
                  </View>

                  {ticket.comensal && (
                    <Text style={styles.ticketComensal}>
                      Comensal: {ticket.comensal}
                    </Text>
                  )}
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
                  ?.filter((producto) => producto.pivot?.estado === "entregado")
                  .reduce((sum, p) => sum + parseFloat(p.precio_venta || 0), 0)
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

      {/* Modal Unificar Mesas */}
      <Modal visible={unificarModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Unificar Mesas</Text>
              <Text style={styles.modalSubtitle}>
                Selecciona las mesas que deseas unificar:
              </Text>

              <ScrollView style={styles.mesasScrollView}>
                {comandas
                  .filter(
                    (c) => c.estado !== "pagada" && c.estado !== "cerrada"
                  )
                  .map((comanda) => (
                    <TouchableOpacity
                      key={comanda.id}
                      style={[
                        styles.mesaItem,
                        comandasSeleccionadas.includes(comanda.id) &&
                        styles.mesaItemSelected,
                      ]}
                      onPress={() => toggleComandaSeleccionada(comanda.id)}
                    >
                      <Text style={styles.mesaItemText}>
                        Mesa {comanda.mesa}
                      </Text>
                      <Text style={styles.mesaItemDetalle}>
                        {comanda.personas} personas -{" "}
                        {comanda.productos?.length || 0} productos
                      </Text>
                      {comanda.comensal && (
                        <Text style={styles.mesaItemComensal}>
                          Comensal: {comanda.comensal}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setUnificarModalVisible(false);
                    setComandasSeleccionadas([]);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={confirmarUnificacion}
                >
                  <Text style={styles.saveButtonText}>Unificar</Text>
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

  topHeader: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginBottom: 5,
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
    fontSize: 25,
    color: "#333",
    fontWeight: "bold",
    maxWidth: 195,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
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
    fontSize: 22,
    color: "#000000ff",
    fontWeight: "500",
  },

  headerContainer: {
    paddingVertical: 5,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  contentTitle: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  nuevaComandaButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 150,
    maxWidth: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#007bff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  unificarButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#6c757d",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unificarButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 24,
    height: 24,
    marginRight: 6,
    resizeMode: "contain",
  },
  nuevaComandaButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    flexShrink: 1,
    textAlign: "center",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#999",
    fontSize: 15,
  },
  loadingText: {
    fontSize: 20,
    color: "#000000ff",
  },

  comandaCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comandaHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  comandaMesa: {
    fontWeight: "bold",
    fontSize: 23,
  },
  comandaComensal: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
  },
  comandaDetail: {
    fontSize: 17,
  },
  productBadge: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productBadgeText: {
    fontWeight: "bold",
    fontSize: 17,
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
    backgroundColor: "#f9ebc3ff",
  },
  ticketButton: {
    backgroundColor: "#a5eef9ff",
  },
  pagoButton: {
    backgroundColor: "#cbf3ffff",
  },
  actionButtonText: {
    color: "#545454ff",
    fontSize: 12,
    fontWeight: "bold",
  },
  pagoIcon: {
    width: 26,
    height: 25,
    marginRight: 8,
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
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
    color: "#333",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  buscadorInput: {
    borderWidth: 1,
    borderColor: "#2D9966",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#ECFDF5",
    color: "#333",
  },
  buscadorAgregar: {
    backgroundColor: "#f0f8f0",
    borderColor: "#28a745",
  },
  noProductosText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
  },

  productosSeleccionadosContainer: {
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#4caf50",
  },
  productosSeleccionadosTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 8,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 6,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalMonto: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4caf50",
  },

  productoItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  productoSelected: {
    backgroundColor: "#eef7ffff",
    borderColor: "#1b89ffff",
  },
  productoBusqueda: {
    backgroundColor: "#f0f8f0",
    borderColor: "#28a745",
  },

  productoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    flexWrap: "wrap",
    gap: 10,
  },
  productoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 200,
    marginRight: 10,
    gap: 30,
    flexWrap: "wrap",
  },
  productoClave: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  productoNombre: {
    fontSize: 16,
    color: "#333",
    marginVertical: 2,
  },
  productoPrecio: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#28a745",
  },
  nuevoProductoTag: {
    fontSize: 16,
    color: "#28a745",
    fontWeight: "bold",
  },

  cantidadControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginRight: 20,
  },
  cantidadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  cantidadButtonDisabled: {
    opacity: 0.3,
  },
  cantidadButtonText: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  cantidadText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },

  detallesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
    flexBasis: "100%",
    marginLeft: 15,
    marginTop: 12,
  },
  detallesSeparador: {
    width: 1,
    height: 20,
    backgroundColor: "#ccc",
    marginRight: 8,
  },
  detalleItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detalleItemConBorde: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  detalleItemConDetalle: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4caf50",
  },
  detalleContenido: {
    flexDirection: "row",
    alignItems: "center",
  },
  detalleTexto: {
    fontSize: 13,
    color: "#666",
  },
  detalleTextoConFondo: {
    fontSize: 13,
    color: "#2e7d32",
    fontWeight: "600",
  },
  detalleInput: {
    borderWidth: 1,
    borderColor: "#326de3ff",
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 80,
    backgroundColor: "#fff",
    color: '#000', // importante para que el texto sea visible,
  },

  separador: {
    marginVertical: 20,
    alignItems: "center",
  },
  separadorTexto: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#000000ff",
    paddingHorizontal: 20,
    paddingVertical: 8,
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
    backgroundColor: "#F44336",
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  pagarButton: {
    backgroundColor: "#4ec56bff",
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

  ticketModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    maxHeight: "100%",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  ticketModalTitleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  ticketIcon: {
    width: 45,
    height: 40,
    marginRight: 15,
    resizeMode: "contain",
    marginTop: 2,
  },
  ticketModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    lineHeight: 40,
  },
  ticketScrollView: {
    maxHeight: 420,
  },
  ticketHeader: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  ticketNegocio: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 10,
  },
  ticketMesa: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#34495e",
    marginBottom: 5,
  },
  ticketFecha: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 5,
  },
  ticketComensal: {
    fontSize: 16,
    color: "#555",
    marginBottom: 5,
  },
  ticketDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 15,
  },
  ticketProductos: {
    marginBottom: 15,
  },
  ticketProductosTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 5,
  },
  ticketProductoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  ticketProductoNombre: {
    fontSize: 15,
    color: "#444",
    flex: 1,
  },
  ticketProductoPrecio: {
    fontSize: 15,
    fontWeight: "600",
    color: "#27ae60",
  },
  ticketTotal: {
    alignItems: "center",
    marginTop: 15,
  },
  ticketTotalText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#27ae60",
  },
  ticketModalActions: {
    marginTop: 25,
    flexDirection: "row",
  },
  closeTicketButton: {
    backgroundColor: "#ff3535ff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  closeTicketButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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
    minWidth: 50,
    fontSize: 14,
    fontWeight: "bold",
  },
  metodoPagoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "left",
    gap: 8,
    marginVertical: 12,
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
    color: "#333",
  },
  eliminarPago: {
    marginLeft: 8,
    padding: 4,
  },
  eliminarPagoText: {
    fontSize: 14,
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

  mesasScrollView: {
    maxHeight: 300,
  },
  mesaItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
  },
  mesaItemSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 2,
  },
  mesaItemText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  mesaItemDetalle: {
    fontSize: 14,
    color: "#666",
  },

  // Agregar estos estilos al final del objeto styles

  comandaCardUnificada: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unificadaBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFC107",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  unificadaBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  mesaItemComensal: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
});
