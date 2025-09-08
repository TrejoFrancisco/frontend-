// MeseroScreen

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
  Image,
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
  const [detallesProductos, setDetallesProductos] = useState({});
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [productoParaDetalle, setProductoParaDetalle] = useState(null);
  const [detalleTemp, setDetalleTemp] = useState("");

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

  const crearComanda = async () => {
    if (!token) return;

    if (!nuevaComanda.mesa || !nuevaComanda.personas) {
      Alert.alert("Error", "Mesa y número de personas son campos obligatorios");
      return;
    }

    // ✅ VERIFICAR que hay productos seleccionados
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
  };

  const editarComanda = async () => {
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
    setDetallesProductos({});
  };

  const openEditModal = (comanda) => {
    setSelectedComanda(comanda);

    const productosContados = {};
    const detallesIniciales = {};
    const contadorPorProducto = {};
    const productosArray = []; // ✅ NUEVO: Array para mantener el orden

    comanda.productos?.forEach((producto) => {
      // Contar productos
      productosContados[producto.id] =
        (productosContados[producto.id] || 0) + 1;

      // Agregar al array en orden
      productosArray.push(producto.id);

      // Mapear detalles correctamente
      if (!contadorPorProducto[producto.id]) {
        contadorPorProducto[producto.id] = 0;
      }

      const indice = contadorPorProducto[producto.id];
      const key = `${producto.id}_${indice}`;

      // ✅ CORREGIDO: Guardar detalle si existe
      if (producto.pivot?.detalle) {
        detallesIniciales[key] = producto.pivot.detalle;
      }

      contadorPorProducto[producto.id]++;
    });

    // ✅ IMPORTANTE: Establecer estados en el orden correcto
    setProductosSeleccionados(productosContados);
    setDetallesProductos(detallesIniciales);
    setBusquedaProducto("");

    setNuevaComanda({
      mesa: comanda.mesa || "",
      personas: comanda.personas?.toString() || "",
      comensal: comanda.comensal || "",
      productos: productosArray, // ✅ USAR EL ARRAY ORDENADO
    });

    setEditModalVisible(true);
  };

  const openPagoModal = (comanda) => {
    setSelectedComanda(comanda);
    // Solo contar productos entregados para el total
    const total =
      comanda.productos
        ?.filter((producto) => producto.pivot?.estado === "entregado")
        .reduce(
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

        // ✅ LIMPIAR DETALLES cuando se elimina completamente
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
        // ✅ LIMPIAR SOLO EL ÚLTIMO DETALLE
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
  };

  const actualizarProductosArray = () => {
    // ✅ ESPERAR A QUE SE ACTUALICE productosSeleccionados
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

  // Función para obtener productos de la comanda actual
  const getProductosComandaActual = () => {
    if (!selectedComanda || !selectedComanda.productos) return [];

    // Obtener IDs únicos de productos de la comanda
    const productosIds = [
      ...new Set(selectedComanda.productos.map((p) => p.id)),
    ];

    // Mapear con información completa del producto
    return productosIds
      .map((id) => {
        const producto =
          productos.find((p) => p.id === id) ||
          selectedComanda.productos.find((p) => p.id === id);
        return producto;
      })
      .filter(Boolean);
  };

  // Función para obtener productos filtrados por búsqueda (excluye los que ya están en la comanda)
  const getProductosBusqueda = () => {
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
  };

  const abrirModalDetalle = (productoId, indice) => {
    const key = `${productoId}_${indice}`;
    setProductoParaDetalle({ id: productoId, indice });
    setDetalleTemp(detallesProductos[key] || "");
    setModalDetalleVisible(true);
  };

  const guardarDetalle = () => {
    const key = `${productoParaDetalle.id}_${productoParaDetalle.indice}`;
    setDetallesProductos((prev) => ({
      ...prev,
      [key]: detalleTemp.trim() || null,
    }));
    setModalDetalleVisible(false);
    setDetalleTemp("");
    setProductoParaDetalle(null);
  };
  const renderComandaCard = (comanda) => (
    <View key={comanda.id} style={styles.comandaCard}>
      <View style={styles.comandaHeader}>
        <Text style={styles.comandaMesa}>Mesa {comanda.mesa}</Text>

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
            <View style={styles.buttonContent}>
              <Image
                source={require("../../../../../assets/editarr.png")}
                style={styles.iconImage}
              />
              <Text style={styles.actionButtonText}>Editar</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Mostrar botón ticket solo si está entregado */}
        {comanda.estado === "entregado" && (
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
        )}

        {/* Mostrar botón pagar solo si está cerrada (después de generar ticket) */}
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
  );

  const renderProductoItem = (producto, isFromBusqueda = false) => {
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
        <View style={styles.productoInfo}>
          <Text style={styles.productoClave}>{producto.clave}</Text>
          <Text style={styles.productoNombre}>
            {producto.nombre}
            {isFromBusqueda && (
              <Text style={styles.nuevoProductoTag}> (NUEVO)</Text>
            )}
          </Text>
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

        {/* ← AGREGAR ESTA SECCIÓN PARA MOSTRAR DETALLES */}
        {isSelected && (
          <View style={styles.detallesContainer}>
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
                      <Text style={styles.detalleTextoConFondo}>Editar</Text>
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
          <Text style={styles.title}>Mis Comandas</Text>
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
                  placeholder="Mesa"
                  value={nuevaComanda.mesa}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, mesa: value }))
                  }
                  keyboardType="numeric"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Número de personas"
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
                  value={nuevaComanda.mesa}
                  onChangeText={(value) =>
                    setNuevaComanda((prev) => ({ ...prev, mesa: value }))
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Número de personas"
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

                <Text style={styles.sectionTitle}>
                  Productos de la Comanda:
                </Text>

                {/* Productos actuales de la comanda */}
                {getProductosComandaActual().length === 0 ? (
                  <Text style={styles.noProductosText}>
                    No hay productos en esta comanda
                  </Text>
                ) : (
                  getProductosComandaActual().map((producto) =>
                    renderProductoItem(producto, false)
                  )
                )}

                {/* Separador visual */}
                <View style={styles.separador}>
                  <Text style={styles.separadorTexto}>
                    Agregar más productos:
                  </Text>
                </View>

                {/* Buscador de productos nuevos */}
                <TextInput
                  style={[styles.buscadorInput, styles.buscadorAgregar]}
                  placeholder="Buscar productos para agregar..."
                  value={busquedaProducto}
                  onChangeText={setBusquedaProducto}
                />

                {/* Productos encontrados en la búsqueda */}
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
                value={detalleTemp}
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
                  source={require("../../../../../assets/ticket.png")} // Ajusta la ruta según tu proyecto
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
    </View>
  );
}

const styles = StyleSheet.create({
  detallesContainer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopColor: "#e0e0e0",
  },
  detalleNumero: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
    marginRight: 6,
    minWidth: 18,
    textAlign: "center",
  },

  detalleTexto: {
    flex: 1, // Usar todo el espacio disponible
    fontSize: 10,
    color: "#888",
    fontStyle: "italic",
    // Remover maxWidth y numberOfLines para mostrar texto completo
  },

  detalleIcono: {
    fontSize: 12,
    marginLeft: 6,
    color: "#007bff",
    minWidth: 16,
    textAlign: "center",
  },

  // Estados para cuando tiene detalle (mantener igual)
  detalleItem: {
    padding: 10,
    marginVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    borderColor: "#cccccc",
    borderWidth: 1,
    alignItems: "center",       // Centra horizontalmente
    justifyContent: "center",   // Centra verticalmente
  },

  detalleItemConBorde: {
    borderTopColor: "#e0e0e0",
    borderTopWidth: 1,
  },

  detalleItemConDetalle: {
    backgroundColor: "#e8f5e9", // verde claro para indicar que ya tiene detalle
  },
  detalleContenido: {
    flexDirection: "row",
    alignItems: "center",
  },
  detalleTextoConFondo: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
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
    color: "#202124",
  },
  // ESTILOS DEL HEADER SUPERIOR

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

  // ESTILOS DEL MODAL DE TICKET

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
    marginTop: 2, // Ajuste fino para compensar altura visual
  },

  ticketModalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2c3e50",
    lineHeight: 40, // Igual que la altura de la imagen
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

  // ESTILOS DE CONTROLES DE CANTIDAD DE PRODUCTOS

  cantidadControls: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 5,
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
  cantidadButtonDisabled: {
    opacity: 0.5,
  },
  cantidadText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    minWidth: 30,
    textAlign: "center",
  },

  // ESTILOS DE INFORMACIÓN DE PRODUCTOS

  productoInfo: {
    flex: 1,
    marginRight: 10,
  },
  productoClave: {
    fontSize: 10,
    color: "#666",
    fontWeight: "bold",
  },
  productoNombre: {
    fontSize: 13,
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
    backgroundColor: "#eef7ffff",
    borderColor: "#1b89ffff",
  },

  // ESTILOS ESPECÍFICOS PARA MODAL DE EDICIÓN

  productoBusqueda: {
    backgroundColor: "#f0f8f0",
    borderColor: "#28a745",
  },
  nuevoProductoTag: {
    fontSize: 12,
    color: "#28a745",
    fontWeight: "bold",
  },
  separador: {
    marginVertical: 20,
    alignItems: "center",
  },
  separadorTexto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000ff",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  buscadorAgregar: {
    backgroundColor: "#f0f8f0",
    borderColor: "#28a745",
  },

  // ESTILOS DEL CONTENEDOR PRINCIPAL

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

  // ESTILOS DEL HEADER DE LA PANTALLA PRINCIPAL

  header: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    height: 130,
    paddingVertical: 10,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  nuevaComandaButton: {
    backgroundColor: "#3a90f4ff",
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 8,
    marginTop: "auto",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 26,
    height: 25,
    marginRight: 8,
  },
  nuevaComandaButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },

  // ESTILOS DEL ESTADO VACÍO Y CARGA

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

  // ESTILOS DE LAS TARJETAS DE COMANDA

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
    fontSize: 20,
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
    fontSize: 13,
    fontWeight: "bold",
  },
  comandaDetails: {
    marginBottom: 12,
  },
  comandaDetail: {
    fontSize: 15,
    color: "#666",
    marginBottom: 4,
  },

  // ESTILOS DE ACCIONES DE COMANDA

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
  pagoIcon: {
    width: 26,
    height: 25,
    marginRight: 8,
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

  // ESTILOS DE MODALES GENERALES

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

  // ESTILOS DE FORMULARIOS EN MODALES

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
  buscadorInput: {
    borderWidth: 1,
    borderColor: "#2D9966",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#ECFDF5",
  },
  noProductosText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
  },

  // ESTILOS DE ACCIONES DE MODALES

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

  // ESTILOS DEL MODAL DE PAGO

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
    minWidth: 50, // Más espacio para palabras largas
    fontSize: 14,
    fontWeight: "bold",
  },

  metodoPagoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "left", // Centra cada línea horizontalmente
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
});