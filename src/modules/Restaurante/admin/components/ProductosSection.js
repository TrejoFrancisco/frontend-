import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { API } from "../../../../services/api";

export default function ProductosSection({ token, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [recetas, setRecetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [vistaTabla, setVistaTabla] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const productosPorPagina = 10;

  const [productoData, setProductoData] = useState({
    clave: "",
    nombre: "",
    categoria_id: "",
    receta_id: "",
    prioridad: "",
    costo_unitario: "",
    precio_venta: "",
    existencia_inicial: "",
    unidad: "",
    estado: "activo",
  });

  // Cargar datos iniciales con manejo de errores mejorado
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        await Promise.all([
          fetchProductos(isMounted),
          fetchRecetas(isMounted),
          fetchCategorias(isMounted),
        ]);
      } catch (err) {
        if (isMounted) {
          console.error("Error loading initial data:", err);
          setError("Error al cargar los datos iniciales");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filtrar productos cuando cambia el texto de búsqueda
  useEffect(() => {
    if (!Array.isArray(productos)) {
      setProductosFiltrados([]);
      return;
    }

    if (textoBusqueda.trim() === "") {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter((producto) => {
        const nombre = producto?.nombre?.toLowerCase() || "";
        const clave = producto?.clave?.toLowerCase() || "";
        const busqueda = textoBusqueda.toLowerCase();
        return nombre.includes(busqueda) || clave.includes(busqueda);
      });
      setProductosFiltrados(filtrados);
    }
    setPaginaActual(1);
  }, [textoBusqueda, productos]);

  const fetchProductos = async (isMounted = true) => {
    try {
      const response = await API.get("/restaurante/admin/productos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (isMounted && response.data.success) {
        const productosData = response.data.data?.productos || [];
        setProductos(productosData);
        setProductosFiltrados(productosData);
      }
    } catch (error) {
      if (isMounted) {
        console.error("Error al obtener productos:", error);
        if (error.response?.status === 401) {
          Alert.alert(
            "Sesión expirada",
            "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
            [{ text: "OK", onPress: () => navigation.navigate("Login") }]
          );
        }
      }
    }
  };

  const fetchRecetas = async (isMounted = true) => {
    try {
      const response = await API.get("/restaurante/admin/recetas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (isMounted && response.data.success) {
        setRecetas(response.data.data || []);
      }
    } catch (error) {
      if (isMounted) {
        console.error("Error al obtener recetas:", error);
      }
    }
  };

  const fetchCategorias = async (isMounted = true) => {
    try {
      const response = await API.get("/restaurante/admin/categorias", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (isMounted && response.data.success) {
        setCategorias(response.data.data || []);
      }
    } catch (error) {
      if (isMounted) {
        console.error("Error al obtener categorías:", error);
      }
    }
  };

  const handleInputChange = useCallback(
    (field, value) => {
      setProductoData((prev) => {
        const newData = { ...prev, [field]: value };

        if (field === "receta_id") {
          if (value) {
            newData.existencia_inicial = "";
            newData.unidad = "";

            const recetaSeleccionada = recetas.find(
              (r) => r.id.toString() === value
            );
            if (recetaSeleccionada?.costo_redondeado) {
              newData.costo_unitario =
                recetaSeleccionada.costo_redondeado.toString();
            }
          } else {
            newData.costo_unitario = "";
          }
        }

        if (
          field === "precio_venta" ||
          field === "costo_unitario" ||
          field === "existencia_inicial"
        ) {
          const regex = /^\d*\.?\d*$/;
          if (value && !regex.test(value)) {
            return prev;
          }
        }

        return newData;
      });
    },
    [recetas]
  );

  const limpiarBusqueda = useCallback(() => {
    setTextoBusqueda("");
  }, []);

  const indexUltimoProducto = paginaActual * productosPorPagina;
  const indexPrimerProducto = indexUltimoProducto - productosPorPagina;
  const productosActuales = productosFiltrados.slice(
    indexPrimerProducto,
    indexUltimoProducto
  );
  const totalPaginas = Math.ceil(
    productosFiltrados.length / productosPorPagina
  );

  const cambiarPagina = useCallback((numeroPagina) => {
    setPaginaActual(numeroPagina);
  }, []);

  const paginaSiguiente = useCallback(() => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  }, [paginaActual, totalPaginas]);

  const paginaAnterior = useCallback(() => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  }, [paginaActual]);

  const obtenerNumerosPagina = useCallback(() => {
    const numeros = [];
    const maxVisible = 5;

    if (totalPaginas <= maxVisible) {
      for (let i = 1; i <= totalPaginas; i++) {
        numeros.push(i);
      }
    } else {
      if (paginaActual <= 3) {
        for (let i = 1; i <= 4; i++) {
          numeros.push(i);
        }
        numeros.push("...");
        numeros.push(totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        numeros.push(1);
        numeros.push("...");
        for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
          numeros.push(i);
        }
      } else {
        numeros.push(1);
        numeros.push("...");
        for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
          numeros.push(i);
        }
        numeros.push("...");
        numeros.push(totalPaginas);
      }
    }

    return numeros;
  }, [paginaActual, totalPaginas]);

  const resetForm = useCallback(() => {
    setProductoData({
      clave: "",
      nombre: "",
      categoria_id: "",
      receta_id: "",
      prioridad: "",
      costo_unitario: "",
      precio_venta: "",
      existencia_inicial: "",
      unidad: "",
      estado: "activo",
    });
    setEditMode(false);
    setEditingProductId(null);
  }, []);

  const validarFormulario = useCallback(() => {
    if (!productoData.clave || !productoData.clave.trim()) {
      Alert.alert("Error", "La clave es requerida");
      return false;
    }

    if (!productoData.nombre || !productoData.nombre.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return false;
    }

    if (!productoData.categoria_id) {
      Alert.alert("Error", "La categoría es requerida");
      return false;
    }

    if (!productoData.prioridad) {
      Alert.alert("Error", "La prioridad es requerida");
      return false;
    }

    if (!productoData.precio_venta) {
      Alert.alert("Error", "El precio de venta es requerido");
      return false;
    }

    const precioVenta = parseFloat(productoData.precio_venta);
    if (isNaN(precioVenta) || precioVenta <= 0) {
      Alert.alert(
        "Error",
        "El precio de venta debe ser un número válido mayor a 0"
      );
      return false;
    }

    if (productoData.receta_id) {
      if (!productoData.costo_unitario) {
        Alert.alert(
          "Error",
          "El costo unitario es requerido para productos con receta"
        );
        return false;
      }
      const costoUnitario = parseFloat(productoData.costo_unitario);
      if (isNaN(costoUnitario) || costoUnitario < 0) {
        Alert.alert(
          "Error",
          "El costo unitario debe ser un número válido mayor o igual a 0"
        );
        return false;
      }
    }

    if (!productoData.receta_id) {
      if (!productoData.existencia_inicial) {
        Alert.alert(
          "Error",
          "La existencia inicial es requerida para productos sin receta"
        );
        return false;
      }

      if (!productoData.unidad) {
        Alert.alert(
          "Error",
          "La unidad es requerida para productos sin receta"
        );
        return false;
      }

      const existencia = parseFloat(productoData.existencia_inicial);
      if (isNaN(existencia) || existencia < 0) {
        Alert.alert(
          "Error",
          "La existencia inicial debe ser un número válido mayor o igual a 0"
        );
        return false;
      }
    }

    return true;
  }, [productoData]);

  const guardarProducto = async () => {
    if (!validarFormulario()) return;

    try {
      const dataToSend = {
        clave: productoData.clave.trim(),
        nombre: productoData.nombre.trim(),
        categoria_id: parseInt(productoData.categoria_id),
        receta_id: productoData.receta_id
          ? parseInt(productoData.receta_id)
          : null,
        prioridad: parseFloat(productoData.prioridad),
        precio_venta: parseFloat(productoData.precio_venta),
        estado: productoData.estado,
      };

      if (productoData.receta_id) {
        dataToSend.costo_unitario = parseFloat(productoData.costo_unitario);
      } else {
        if (productoData.costo_unitario && productoData.costo_unitario.trim()) {
          dataToSend.costo_unitario = parseFloat(productoData.costo_unitario);
        }
      }

      if (!productoData.receta_id) {
        dataToSend.existencia_inicial = parseFloat(
          productoData.existencia_inicial
        );
        dataToSend.unidad = productoData.unidad;
      }

      let response;
      if (editMode) {
        response = await API.put(
          `/restaurante/admin/productos/${editingProductId}`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await API.post("/restaurante/admin/productos", dataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (response.data.success) {
        Alert.alert(
          "Éxito",
          editMode
            ? "Producto actualizado correctamente"
            : "Producto guardado correctamente"
        );
        resetForm();
        setModalVisible(false);
        fetchProductos();
      }
    } catch (error) {
      console.error("Error al guardar producto:", error);

      let errorMessage = "Error al guardar el producto";

      if (error.response?.data?.error?.details) {
        const details = error.response.data.error.details;
        const errores = Object.entries(details)
          .map(([campo, mensajes]) => `${campo}: ${mensajes.join(", ")}`)
          .join("\n");
        errorMessage = `Errores de validación:\n${errores}`;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert("Error", errorMessage);
    }
  };

  const editarProducto = useCallback((producto) => {
    if (!producto) return;

    setProductoData({
      clave: producto.clave || "",
      nombre: producto.nombre || "",
      categoria_id: producto.categoria_id?.toString() || "",
      receta_id: producto.receta_id ? producto.receta_id.toString() : "",
      prioridad: producto.prioridad?.toString() || "",
      costo_unitario: producto.costo_unitario?.toString() || "",
      precio_venta: producto.precio_venta?.toString() || "",
      existencia_inicial: producto.existencia?.toString() || "",
      unidad: producto.unidad || "",
      estado: producto.estado || "activo",
    });
    setEditMode(true);
    setEditingProductId(producto.id);
    setModalVisible(true);
  }, []);

  const cambiarEstadoProducto = useCallback(
    (id, estadoActual, nombre) => {
      const nuevoEstado = estadoActual === "activo" ? "inactivo" : "activo";

      Alert.alert(
        "Cambiar Estado",
        `¿Deseas ${nuevoEstado === "activo" ? "activar" : "desactivar"
        } el producto "${nombre}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar",
            onPress: async () => {
              try {
                const response = await API.patch(
                  `/restaurante/admin/productos/${id}/estado`,
                  { estado: nuevoEstado },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
                if (response.data.success) {
                  Alert.alert("Éxito", "Estado actualizado correctamente");
                  fetchProductos();
                }
              } catch (error) {
                console.error("Error al cambiar estado:", error);
                Alert.alert(
                  "Error",
                  error.response?.data?.error?.message ||
                  "Error al cambiar el estado del producto"
                );
              }
            },
          },
        ]
      );
    },
    [token]
  );

  const abrirModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const renderPaginacion = useCallback(() => {
    if (productosFiltrados.length === 0) return null;

    return (
      <View style={styles.paginacionContainer}>
        <TouchableOpacity
          style={[
            styles.paginacionBoton,
            paginaActual === 1 && styles.paginacionBotonDisabled,
          ]}
          onPress={paginaAnterior}
          disabled={paginaActual === 1}
        >
          <Text style={styles.paginacionTexto}>←</Text>
        </TouchableOpacity>

        <View style={styles.paginacionNumeros}>
          {obtenerNumerosPagina().map((numero, index) => {
            if (numero === "...") {
              return (
                <Text key={`dots-${index}`} style={styles.paginacionPuntos}>
                  ...
                </Text>
              );
            }
            return (
              <TouchableOpacity
                key={numero}
                style={[
                  styles.paginacionNumero,
                  paginaActual === numero && styles.paginacionNumeroActivo,
                ]}
                onPress={() => cambiarPagina(numero)}
              >
                <Text
                  style={[
                    styles.paginacionNumeroTexto,
                    paginaActual === numero &&
                    styles.paginacionNumeroTextoActivo,
                  ]}
                >
                  {numero}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.paginacionBoton,
            paginaActual === totalPaginas && styles.paginacionBotonDisabled,
          ]}
          onPress={paginaSiguiente}
          disabled={paginaActual === totalPaginas}
        >
          <Text style={styles.paginacionTexto}>→</Text>
        </TouchableOpacity>
      </View>
    );
  }, [
    productosFiltrados.length,
    paginaActual,
    totalPaginas,
    paginaAnterior,
    paginaSiguiente,
    obtenerNumerosPagina,
    cambiarPagina,
  ]);

  const renderProductoItem = useCallback(
    (item) => {
      if (!item) return null;

      return (
        <View key={item.id} style={styles.productCard}>
          <View style={styles.productHeaderRow}>
            <View style={styles.colItem}>
              <Text style={styles.productName}>
                {item.nombre || "Sin nombre"}
              </Text>
            </View>

            <View style={styles.colItem}>
              <Text style={styles.productLabel}>Prioridad:</Text>
              <Text style={styles.productDetail}>
                {item.prioridad || "N/A"}
              </Text>
            </View>

            <View style={styles.colItem}>
              <Text style={styles.productLabel}>Tipo:</Text>
              <Text style={styles.productDetail}>
                {item.receta_id ? "Con receta" : "Producto directo"}
              </Text>
            </View>

            <View style={styles.colItem}>
              <Text style={styles.productCode}>{item.clave || "N/A"}</Text>
            </View>

            <View style={styles.colItem}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  {
                    backgroundColor:
                      item.estado === "activo" ? "#32b551" : "#ffc107",
                  },
                ]}
                onPress={() =>
                  cambiarEstadoProducto(item.id, item.estado, item.nombre)
                }
              >
                <Text style={styles.statusButtonText}>
                  {item.estado === "activo" ? "Activo" : "Inactivo"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.colItem}>
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => editarProducto(item)}
                >
                  <Image
                    source={require("../../../../../assets/editarr.png")}
                    style={styles.iconImage}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [cambiarEstadoProducto, editarProducto]
  );

  // Pantalla de carga
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando productos...</Text>
        </View>
      </View>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              fetchProductos();
              fetchRecetas();
              fetchCategorias();
            }}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Gestión de Productos</Text>
        <TouchableOpacity style={styles.createButton} onPress={abrirModal}>
          <View style={styles.inlineContent}>
            <Image
              source={require("../../../../../assets/mas.png")}
              style={styles.icon}
            />
            <Text style={styles.createButtonText}>Agregar Producto</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              !vistaTabla && styles.viewToggleButtonActive,
            ]}
            onPress={() => setVistaTabla(false)}
          >
            <Text
              style={[
                styles.viewToggleText,
                !vistaTabla && styles.viewToggleTextActive,
              ]}
            >
              Lista
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              vistaTabla && styles.viewToggleButtonActive,
            ]}
            onPress={() => setVistaTabla(true)}
          >
            <Text
              style={[
                styles.viewToggleText,
                vistaTabla && styles.viewToggleTextActive,
              ]}
            >
              Tabla
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o clave..."
              value={textoBusqueda}
              onChangeText={setTextoBusqueda}
            />
            {textoBusqueda.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={limpiarBusqueda}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!vistaTabla && (
          <View style={styles.productsList}>
            {productosActuales.map((producto) => renderProductoItem(producto))}

            {productosFiltrados.length === 0 && textoBusqueda.length > 0 && (
              <Text style={styles.emptyText}>
                No se encontraron productos que coincidan con "{textoBusqueda}"
              </Text>
            )}

            {productos.length === 0 && (
              <Text style={styles.emptyText}>No hay productos registrados</Text>
            )}
          </View>
        )}

        {!vistaTabla && renderPaginacion()}

        {vistaTabla && (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.columnClave]}>
                Clave
              </Text>
              <Text style={[styles.tableHeaderText, styles.columnNombre]}>
                Nombre
              </Text>
              <Text style={[styles.tableHeaderText, styles.columnPrecio]}>
                Precio
              </Text>
              <View style={[styles.columnEstado, styles.headerEstadoContainer]}>
                <Text style={styles.tableHeaderText}>Estado</Text>
              </View>
              <View
                style={[styles.columnAcciones, styles.headerActionsContainer]}
              >
                <Text style={styles.tableHeaderText}>Acciones</Text>
              </View>
            </View>

            {productosActuales.map((producto, index) => (
              <View
                key={producto.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                ]}
              >
                <Text style={[styles.tableCellText, styles.columnClave]}>
                  {producto.clave || "N/A"}
                </Text>
                <Text
                  style={[styles.tableCellText, styles.columnNombre]}
                  numberOfLines={2}
                >
                  {producto.nombre || "Sin nombre"}
                </Text>
                <Text style={[styles.tableCellText, styles.columnPrecio]}>
                  ${producto.precio_venta || "0.00"}
                </Text>
                <View style={[styles.tableCell, styles.columnEstado]}>
                  <TouchableOpacity
                    style={[
                      styles.estadoBadge,
                      producto.estado === "activo"
                        ? styles.estadoActivo
                        : styles.estadoInactivo,
                    ]}
                    onPress={() =>
                      cambiarEstadoProducto(
                        producto.id,
                        producto.estado,
                        producto.nombre
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.estadoText,
                        producto.estado === "activo"
                          ? styles.estadoTextoActivo
                          : styles.estadoTextoInactivo,
                      ]}
                    >
                      {producto.estado === "activo" ? "Activo" : "Inactivo"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.columnAcciones, styles.actionsContainer]}>
                  <TouchableOpacity onPress={() => editarProducto(producto)}>
                    <Image
                      source={require("../../../../../assets/editarr.png")}
                      style={styles.icon}
                      accessibilityLabel="Editar producto"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {productosFiltrados.length === 0 && textoBusqueda.length > 0 && (
              <View style={styles.tableEmptyRow}>
                <Text style={styles.emptyText}>
                  No se encontraron productos que coincidan con "{textoBusqueda}
                  "
                </Text>
              </View>
            )}

            {productos.length === 0 && (
              <View style={styles.tableEmptyRow}>
                <Text style={styles.emptyText}>
                  No hay productos registrados
                </Text>
              </View>
            )}
          </View>
        )}

        {vistaTabla && renderPaginacion()}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalWrapper}>
            <ScrollView
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editMode ? "Editar Producto" : "Agregar Producto"}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Clave"
                  placeholderTextColor="#888"
                  value={productoData.clave || undefined}
                  onChangeText={(text) => handleInputChange("clave", text)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  placeholderTextColor="#888"
                  value={productoData.nombre || undefined}
                  onChangeText={(text) => handleInputChange("nombre", text)}
                />

                <Text style={styles.label}>Categoría</Text>
                <Picker
                  selectedValue={productoData.categoria_id || "default"}
                  onValueChange={(value) => {
                    if (value !== "default") handleInputChange("categoria_id", value);
                  }}
                  style={[styles.picker, { color: productoData.categoria_id ? "#000" : "#888" }]}
                >
                  <Picker.Item label="Selecciona una categoría" value="default" />
                  {categorias.map((categoria) => (
                    <Picker.Item
                      key={categoria.id}
                      label={categoria.nombre}
                      value={categoria.id.toString()}
                    />
                  ))}
                </Picker>

                <Text style={styles.label}>Receta (Opcional)</Text>
                <Picker
                  selectedValue={productoData.receta_id || "default"}
                  onValueChange={(value) => {
                    if (value !== "default") handleInputChange("receta_id", value);
                  }}
                  style={[styles.picker, { color: productoData.receta_id ? "#000" : "#888" }]}
                >
                  <Picker.Item label="Sin receta (producto directo)" value="default" />
                  {recetas.map((receta) => (
                    <Picker.Item
                      key={receta.id}
                      label={`${receta.clave} - ${receta.nombre}`}
                      value={receta.id.toString()}
                    />
                  ))}
                </Picker>

                <Text style={styles.label}>Prioridad</Text>
                <Picker
                  selectedValue={productoData.prioridad || "default"}
                  onValueChange={(value) => {
                    if (value !== "default") handleInputChange("prioridad", value);
                  }}
                  style={[styles.picker, { color: productoData.prioridad ? "#000" : "#888" }]}
                >
                  <Picker.Item label="Selecciona una prioridad" value="default" />
                  <Picker.Item label="1 - Alta" value="1" />
                  <Picker.Item label="2 - Media" value="2" />
                  <Picker.Item label="3 - Baja" value="3" />
                </Picker>

                <View>
                  <Text style={styles.label}>
                    Costo unitario{" "}
                    {productoData.receta_id ? "(Automático)" : "(Opcional)"}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      productoData.receta_id && styles.inputReadOnly,
                    ]}
                    placeholder={
                      productoData.receta_id
                        ? "Se calculará automáticamente"
                        : "Costo unitario (opcional)"
                    }
                    placeholderTextColor="#888"
                    keyboardType="decimal-pad"
                    value={productoData.costo_unitario || undefined}
                    onChangeText={(text) => handleInputChange("costo_unitario", text)}
                    editable={!productoData.receta_id}
                  />
                  {productoData.receta_id && productoData.costo_unitario && (
                    <Text style={styles.helperText}>
                      Costo de la receta: $
                      {parseFloat(productoData.costo_unitario).toFixed(2)}
                    </Text>
                  )}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Precio de venta"
                  placeholderTextColor="#888"
                  keyboardType="decimal-pad"
                  value={productoData.precio_venta || undefined}
                  onChangeText={(text) => handleInputChange("precio_venta", text)}
                />

                {!productoData.receta_id && (
                  <TextInput
                    style={styles.input}
                    placeholder="Existencia inicial"
                    placeholderTextColor="#888"
                    keyboardType="decimal-pad"
                    value={productoData.existencia_inicial || undefined}
                    onChangeText={(text) =>
                      handleInputChange("existencia_inicial", text)
                    }
                  />
                )}

                {!productoData.receta_id && (
                  <>
                    <Text style={styles.label}>Unidad</Text>
                    <Picker
                      selectedValue={productoData.unidad || "default"}
                      onValueChange={(value) => {
                        if (value !== "default") handleInputChange("unidad", value);
                      }}
                      style={[styles.picker, { color: productoData.unidad ? "#000" : "#888" }]}
                    >
                      <Picker.Item label="Selecciona una unidad" value="default" />
                      <Picker.Item label="Pieza" value="pieza" />
                      <Picker.Item label="Kilogramo" value="kg" />
                      <Picker.Item label="Gramo" value="g" />
                      <Picker.Item label="Litro" value="l" />
                      <Picker.Item label="Mililitro" value="ml" />
                      <Picker.Item label="Botella" value="botella" />
                      <Picker.Item label="Lata" value="lata" />
                      <Picker.Item label="Caja" value="caja" />
                      <Picker.Item label="Paquete" value="paquete" />
                    </Picker>
                  </>
                )}

                <Text style={styles.label}>Estado del Producto</Text>
                <Picker
                  selectedValue={productoData.estado || "default"}
                  onValueChange={(value) => {
                    if (value !== "default") handleInputChange("estado", value);
                  }}
                  style={[styles.picker, { color: productoData.estado ? "#000" : "#888" }]}
                >
                  <Picker.Item label="Selecciona un estado" value="default" />
                  <Picker.Item label="Activo" value="activo" />
                  <Picker.Item label="Inactivo" value="inactivo" />
                </Picker>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={guardarProducto}
                  >
                    <Text style={styles.submitButtonText}>
                      {editMode ? "Actualizar" : "Guardar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  viewToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#dcdcdcff",
    borderColor: "#b7b7b7ff",
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 2,
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  viewToggleButtonActive: {
    backgroundColor: "#007AFF",
  },
  viewToggleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000ff",
  },
  viewToggleTextActive: {
    color: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2D9966",
    borderRadius: 20,
    padding: 10,
    fontSize: 18,
    backgroundColor: "#ECFDF5",
  },
  clearButton: {
    marginLeft: 8,
    padding: 6,
  },
  clearButtonText: {
    fontSize: 20,
    color: "#666",
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
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
  productHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  colItem: {
    flex: 1,
    minWidth: 150,
  },
  productLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  productDetail: {
    fontSize: 17,
  },
  productCode: {
    fontSize: 17,
    fontWeight: "500",
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  productActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
  },
  actionButton: {
    padding: 7,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#f9ebc3ff",
    paddingHorizontal: 16,
    minWidth: 48,
  },
  tableContainer: {
    width: "100%",
    marginHorizontal: 3,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 19,
    color: "#333",
    flexWrap: "wrap",
  },
  headerEstadoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: "#fff",
  },
  tableRowOdd: {
    backgroundColor: "#fff",
  },
  tableCell: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tableCellText: {
    fontSize: 18,
    color: "#444",
    flexWrap: "wrap",
  },
  columnClave: {
    flex: 2,
    paddingHorizontal: 8,
  },
  columnNombre: {
    flex: 3,
    paddingHorizontal: 8,
  },
  columnPrecio: {
    flex: 2,
    paddingHorizontal: 4,
  },
  columnEstado: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  columnAcciones: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "center",
  },
  estadoActivo: {
    backgroundColor: "#d4edda",
  },
  estadoInactivo: {
    backgroundColor: "#f8d7da",
  },
  estadoText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  estadoTextoActivo: {
    color: "#155724",
  },
  estadoTextoInactivo: {
    color: "#721c24",
  },
  tableEmptyRow: {
    padding: 20,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalScrollView: {
    maxHeight: "90%",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#F44336",
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#28a745",
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
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  iconImage: {
    width: 27,
    height: 27,
  },
  emptyText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  paginacionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 10,
  },
  paginacionBoton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  paginacionBotonDisabled: {
    backgroundColor: "#ccc",
  },
  paginacionTexto: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  paginacionNumeros: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  paginacionNumero: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  paginacionNumeroActivo: {
    backgroundColor: "#4CAF50",
  },
  paginacionNumeroTexto: {
    fontSize: 16,
    color: "#333",
  },
  paginacionNumeroTextoActivo: {
    color: "#fff",
    fontWeight: "bold",
  },
  paginacionPuntos: {
    fontSize: 16,
    color: "#666",
    marginHorizontal: 4,
  },
  inputReadOnly: {
    backgroundColor: "#f0f0f0",
    color: "#666",
  },
  helperText: {
    fontSize: 14,
    color: "#2D9966",
    marginTop: 4,
    fontWeight: "600",
  },
});
