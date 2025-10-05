import React, { useState, useEffect } from "react";
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
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [vistaTabla, setVistaTabla] = useState(false);
  const [productoData, setProductoData] = useState({
    clave: "",
    nombre: "",
    categoria_id: "",
    receta_id: "",
    prioridad: "",
    costo_receta: "",
    costo_redondeado: "",
    precio_venta: "",
    existencia_inicial: "",
    unidad: "",
    estado: "activo",
  });
  
  // Estado para el modal de costos
  const [modalCostosVisible, setModalCostosVisible] = useState(false);
  const [costosCalculados, setCostosCalculados] = useState({
    costo_receta: 0,
    costo_redondeado: 0
  });

  useEffect(() => {
    fetchProductos();
    fetchRecetas();
    fetchCategorias();
  }, []);

  // Filtrar productos cuando cambia el texto de búsqueda
  useEffect(() => {
    if (textoBusqueda.trim() === "") {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(textoBusqueda.toLowerCase()) ||
        producto.clave.toLowerCase().includes(textoBusqueda.toLowerCase())
      );
      setProductosFiltrados(filtrados);
    }
  }, [textoBusqueda, productos]);

  const fetchProductos = async () => {
    try {
      const response = await API.get("/restaurante/admin/productos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const productosData = response.data.data.productos;
        setProductos(productosData);
        setProductosFiltrados(productosData);
      }
    } catch (error) {
      console.error("Error al obtener productos:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    }
  };

  const fetchRecetas = async () => {
    try {
      const response = await API.get("/restaurante/admin/recetas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setRecetas(response.data.data);
      }
    } catch (error) {
      console.error("Error al obtener recetas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await API.get("/restaurante/admin/categorias", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (error) {
      console.error("Error al obtener categorías:", error);
    }
  };

  // Nueva función para calcular costos de receta
  const calcularCostosReceta = async (recetaId) => {
    if (!recetaId) return;

    setLoadingCosts(true);
    try {
      const response = await API.get(
        `/restaurante/admin/recetas/${recetaId}/costos`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const { costo_receta, costo_redondeado } = response.data.data;

        // Costo receta con más precisión (4 decimales)
        const costoRecetaFormateado = parseFloat(costo_receta).toFixed(4);
        // Costo redondeado con formato estándar (2 decimales)
        const costoRedondeadoFormateado = parseFloat(costo_redondeado).toFixed(2);

        setProductoData((prev) => ({
          ...prev,
          costo_receta: costoRecetaFormateado,
          costo_redondeado: costoRedondeadoFormateado,
        }));

        // Guardar los costos y mostrar modal
        setCostosCalculados({
          costo_receta: costoRecetaFormateado,
          costo_redondeado: costoRedondeadoFormateado
        });
        setModalCostosVisible(true);
      }
    } catch (error) {
      console.error("Error al calcular costos:", error);
      Alert.alert("Error", "No se pudieron calcular los costos de la receta");
    } finally {
      setLoadingCosts(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProductoData((prev) => {
      const newData = { ...prev, [field]: value };

      // Limpiar campos cuando se deselecciona una receta
      if (field === "receta_id") {
        if (value) {
          // Si se selecciona una receta, limpiar campos de producto sin receta
          newData.existencia_inicial = "";
          newData.unidad = "";
          // Calcular costos automáticamente
          calcularCostosReceta(value);
        } else {
          // Si se deselecciona la receta, limpiar costos calculados
          newData.costo_receta = "";
          newData.costo_redondeado = "";
        }
      }

      return newData;
    });
  };

  const limpiarBusqueda = () => {
    setTextoBusqueda("");
  };

  const resetForm = () => {
    setProductoData({
      clave: "",
      nombre: "",
      categoria_id: "",
      receta_id: "",
      prioridad: "",
      costo_receta: "",
      costo_redondeado: "",
      precio_venta: "",
      existencia_inicial: "",
      unidad: "",
      estado: "activo",
    });
    setEditMode(false);
    setEditingProductId(null);
  };

  const validarFormulario = () => {
    const camposRequeridos = [
      "clave",
      "nombre",
      "categoria_id",
      "prioridad",
      "costo_receta",
      "costo_redondeado",
      "precio_venta",
    ];

    for (let campo of camposRequeridos) {
      if (!productoData[campo]) {
        Alert.alert("Error", `El campo ${campo} es requerido`);
        return false;
      }
    }

    // Validar campos específicos para productos sin receta
    if (!productoData.receta_id) {
      if (!productoData.existencia_inicial || !productoData.unidad) {
        Alert.alert(
          "Error",
          "Los campos existencia inicial y unidad son requeridos para productos sin receta"
        );
        return false;
      }
    }

    return true;
  };

  const guardarProducto = async () => {
    if (!validarFormulario()) return;

    try {
      const dataToSend = {
        clave: productoData.clave,
        nombre: productoData.nombre,
        categoria_id: parseInt(productoData.categoria_id),
        receta_id: productoData.receta_id
          ? parseInt(productoData.receta_id)
          : null,
        prioridad: parseFloat(productoData.prioridad),
        costo_receta: parseFloat(productoData.costo_receta),
        costo_redondeado: parseFloat(productoData.costo_redondeado),
        precio_venta: parseFloat(productoData.precio_venta),
        estado: productoData.estado,
      };

      // Solo agregar campos de inventario si no tiene receta
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
      Alert.alert(
        "Error",
        error.response?.data?.error?.message || "Error al guardar el producto"
      );
    }
  };

  const editarProducto = (producto) => {
    setProductoData({
      clave: producto.clave,
      nombre: producto.nombre,
      categoria_id: producto.categoria_id.toString(),
      receta_id: producto.receta_id ? producto.receta_id.toString() : "",
      prioridad: producto.prioridad.toString(),
      costo_receta: producto.costo_receta.toString(),
      costo_redondeado: producto.costo_redondeado.toString(),
      precio_venta: producto.precio_venta.toString(),
      existencia_inicial: producto.existencia
        ? producto.existencia.toString()
        : "",
      unidad: producto.unidad || "",
      estado: producto.estado,
    });
    setEditMode(true);
    setEditingProductId(producto.id);
    setModalVisible(true);
  };

  const eliminarProducto = (id, nombre) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de que deseas eliminar el producto "${nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await API.delete(
                `/restaurante/admin/productos/${id}`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              if (response.data.success) {
                Alert.alert("Éxito", "Producto eliminado correctamente");
                fetchProductos();
              }
            } catch (error) {
              console.error("Error al eliminar producto:", error);
              Alert.alert(
                "Error",
                error.response?.data?.error?.message ||
                "Error al eliminar el producto"
              );
            }
          },
        },
      ]
    );
  };

  const abrirModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const renderProductoItem = (item) => (
    <View key={item.id} style={styles.productCard}>
      <View style={styles.productHeaderRow}>
        {/* Columna 1: Nombre */}
        <View style={styles.colItem}>
          <Text style={styles.productName}>{item.nombre}</Text>
        </View>

        {/* Columna 2: Prioridad */}
        <View style={styles.colItem}>
          <Text style={styles.productLabel}>Prioridad:</Text>
          <Text style={styles.productDetail}>{item.prioridad}</Text>
        </View>

        {/* Columna 3: Tipo */}
        <View style={styles.colItem}>
          <Text style={styles.productLabel}>Tipo:</Text>
          <Text style={styles.productDetail}>
            {item.receta_id ? "Con receta" : "Producto directo"}
          </Text>
        </View>

        {/* Columna 4: Clave */}
        <View style={styles.colItem}>
          <Text style={styles.productCode}>{item.clave}</Text>
        </View>

        {/* Columna 5: Estado como botón */}
        <View style={styles.colItem}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              { backgroundColor: item.estado === "activo" ? "#32b551" : "#ffc107" },
            ]}
            disabled
          >
            <Text style={styles.statusButtonText}>
              {item.estado === "activo" ? "Activo" : "Inactivo"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Columna 6: Acciones */}
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

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => eliminarProducto(item.id, item.nombre)}
            >
              <Image
                source={require("../../../../../assets/eliminar.png")}
                style={styles.iconImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

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

        {/* Toggle Vista Tabla/Lista */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              !vistaTabla && styles.viewToggleButtonActive
            ]}
            onPress={() => setVistaTabla(false)}
          >
            <Text style={[
              styles.viewToggleText,
              !vistaTabla && styles.viewToggleTextActive
            ]}>Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              vistaTabla && styles.viewToggleButtonActive
            ]}
            onPress={() => setVistaTabla(true)}
          >
            <Text style={[
              styles.viewToggleText,
              vistaTabla && styles.viewToggleTextActive
            ]}>Tabla</Text>
          </TouchableOpacity>
        </View>

        {/* Buscador */}
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
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Vista de Lista */}
        {!vistaTabla && (
          <View style={styles.productsList}>
            {productosFiltrados.map((producto) => renderProductoItem(producto))}

            {productosFiltrados.length === 0 && textoBusqueda.length > 0 && (
              <Text style={styles.emptyText}>
                No se encontraron productos que coincidan con "{textoBusqueda}"
              </Text>
            )}

            {productos.length === 0 && (
              <Text style={styles.emptyText}>
                No hay productos registrados
              </Text>
            )}
          </View>
        )}

        {/* Vista de Tabla */}
        {vistaTabla && (
          <View style={styles.tableContainer}>
            {/* Encabezados de la tabla */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.columnClave]}>Clave</Text>
              <Text style={[styles.tableHeaderText, styles.columnNombre]}>Nombre</Text>
              <Text style={[styles.tableHeaderText, styles.columnPrecio]}>Precio</Text>
              <View style={[styles.columnEstado, styles.headerEstadoContainer]}>
                <Text style={styles.tableHeaderText}>Estado</Text>
              </View>
              <View style={[styles.columnAcciones, styles.headerActionsContainer]}>
                <Text style={styles.tableHeaderText}>Acciones</Text>
              </View>
            </View>

            {/* Filas de la tabla */}
            {productosFiltrados.map((producto, index) => (
              <View
                key={producto.id}
                style={[
                  styles.tableRow,
                  index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd
                ]}
              >
                <Text style={[styles.tableCellText, styles.columnClave]}>
                  {producto.clave}
                </Text>
                <Text style={[styles.tableCellText, styles.columnNombre]} numberOfLines={2}>
                  {producto.nombre}
                </Text>
                <Text style={[styles.tableCellText, styles.columnPrecio]}>
                  ${producto.precio_venta || '0.00'}
                </Text>
                <View style={[styles.tableCell, styles.columnEstado]}>
                  <View style={[
                    styles.estadoBadge,
                    producto.estado === 'activo' ? styles.estadoActivo : styles.estadoInactivo
                  ]}>
                    <Text style={[
                      styles.estadoText,
                      producto.estado === 'activo' ? styles.estadoTextoActivo : styles.estadoTextoInactivo
                    ]}>
                      {producto.estado === 'activo' ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.columnAcciones, styles.actionsContainer]}>
                  <TouchableOpacity
                    onPress={() => editarProducto(producto)}
                  >
                    <Image
                      source={require('../../../../../assets/editarr.png')}
                      style={styles.icon}
                      accessibilityLabel="Editar producto"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Mensajes si no hay resultados */}
            {productosFiltrados.length === 0 && textoBusqueda.length > 0 && (
              <View style={styles.tableEmptyRow}>
                <Text style={styles.emptyText}>
                  No se encontraron productos que coincidan con "{textoBusqueda}"
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
      </ScrollView>

      {/* Modal de Formulario de Producto */}
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

                {/* 1. CLAVE */}
                <TextInput
                  style={styles.input}
                  placeholder="Clave"
                  value={productoData.clave}
                  onChangeText={(text) => handleInputChange("clave", text)}
                />

                {/* 2. NOMBRE */}
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={productoData.nombre}
                  onChangeText={(text) => handleInputChange("nombre", text)}
                />

                {/* 3. CATEGORÍA */}
                <Text style={styles.label}>Categoría</Text>
                <Picker
                  selectedValue={productoData.categoria_id}
                  onValueChange={(value) =>
                    handleInputChange("categoria_id", value)
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona una categoría" value="" />
                  {categorias.map((categoria) => (
                    <Picker.Item
                      key={categoria.id}
                      label={categoria.nombre}
                      value={categoria.id.toString()}
                    />
                  ))}
                </Picker>

                {/* 4. RECETA */}
                <Text style={styles.label}>Receta (Opcional)</Text>
                <Picker
                  selectedValue={productoData.receta_id}
                  onValueChange={(value) =>
                    handleInputChange("receta_id", value)
                  }
                  style={styles.picker}
                  enabled={!loadingCosts}
                >
                  <Picker.Item label="Sin receta (producto directo)" value="" />
                  {recetas.map((receta) => (
                    <Picker.Item
                      key={receta.id}
                      label={`${receta.clave} - ${receta.nombre}`}
                      value={receta.id.toString()}
                    />
                  ))}
                </Picker>

                {loadingCosts && (
                  <Text style={styles.loadingText}>
                    Calculando costos de la receta...
                  </Text>
                )}

                {/* 5. PRIORIDAD */}
                <Text style={styles.label}>Prioridad</Text>
                <Picker
                  selectedValue={productoData.prioridad}
                  onValueChange={(value) =>
                    handleInputChange("prioridad", value)
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona una prioridad" value="" />
                  <Picker.Item label="1 - Alta" value="1" />
                  <Picker.Item label="2 - Media" value="2" />
                  <Picker.Item label="3 - Baja" value="3" />
                </Picker>

                {/* 6. COSTO RECETA */}
                <TextInput
                  style={[
                    styles.input,
                    productoData.receta_id && productoData.costo_receta
                      ? styles.suggestedInput
                      : null,
                  ]}
                  placeholder="Costo receta"
                  keyboardType="decimal-pad"
                  value={productoData.costo_receta}
                  onChangeText={(text) =>
                    handleInputChange("costo_receta", text)
                  }
                />

                {/* 7. COSTO REDONDEADO */}
                <TextInput
                  style={[
                    styles.input,
                    productoData.receta_id && productoData.costo_redondeado
                      ? styles.suggestedInput
                      : null,
                  ]}
                  placeholder="Costo redondeado"
                  keyboardType="decimal-pad"
                  value={productoData.costo_redondeado}
                  onChangeText={(text) =>
                    handleInputChange("costo_redondeado", text)
                  }
                />

                {/* 8. PRECIO VENTA */}
                <TextInput
                  style={styles.input}
                  placeholder="Precio de venta"
                  keyboardType="decimal-pad"
                  value={productoData.precio_venta}
                  onChangeText={(text) =>
                    handleInputChange("precio_venta", text)
                  }
                />

                {/* 9. EXISTENCIA - Solo para productos sin receta */}
                {!productoData.receta_id && (
                  <TextInput
                    style={styles.input}
                    placeholder="Existencia inicial"
                    keyboardType="decimal-pad"
                    value={productoData.existencia_inicial}
                    onChangeText={(text) =>
                      handleInputChange("existencia_inicial", text)
                    }
                  />
                )}

                {/* 10. UNIDAD - Solo para productos sin receta */}
                {!productoData.receta_id && (
                  <>
                    <Text style={styles.label}>Unidad</Text>
                    <Picker
                      selectedValue={productoData.unidad}
                      onValueChange={(value) =>
                        handleInputChange("unidad", value)
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Selecciona una unidad" value="" />
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

                {/* 11. ESTADO */}
                <Text style={styles.label}>Estado del Producto</Text>
                <Picker
                  selectedValue={productoData.estado}
                  onValueChange={(value) => handleInputChange("estado", value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Activo" value="activo" />
                  <Picker.Item label="Inactivo" value="inactivo" />
                </Picker>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.submitButton]}
                    onPress={guardarProducto}
                    disabled={loadingCosts}
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

      {/* Modal de Costos Calculados */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalCostosVisible}
        onRequestClose={() => setModalCostosVisible(false)}
      >
        <View style={styles.modalCostosOverlay}>
          <View style={styles.modalCostosContent}>
            <Text style={styles.modalCostosTitle}>💰 Costos Calculados</Text>
            
            <View style={styles.modalCostosBody}>
              <Text style={styles.modalCostosText}>
                Se han calculado los costos de la receta:
              </Text>
              
              {/* Costo Exacto */}
              <View style={[styles.costoItem, styles.costoItemExacto]}>
                <View style={styles.costoInfoContainer}>
                  <Text style={styles.costoLabel}> Costo receta (exacto)</Text>
                  <Text style={styles.costoSubLabel}>Cálculo preciso de ingredientes</Text>
                </View>
                <Text style={styles.costoValorExacto}>${costosCalculados.costo_receta}</Text>
              </View>
              
              
              {/* Costo Redondeado */}
              <View style={[styles.costoItem, styles.costoItemRedondeado]}>
                <View style={styles.costoInfoContainer}>
                  <Text style={styles.costoLabel}> Costo redondeado</Text>
                  <Text style={styles.costoSubLabel}>Para precio de venta</Text>
                </View>
                <Text style={styles.costoValor}>${costosCalculados.costo_redondeado}</Text>
              </View>
              
              <Text style={styles.modalCostosFooterText}>
                ⭐  Puedes modificar estos valores si es necesario.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCostosButton}
              onPress={() => setModalCostosVisible(false)}
            >
              <Text style={styles.modalCostosButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ========================================
  // CONTENEDOR PRINCIPAL
  // ========================================
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },

  // ========================================
  // TÍTULO Y BOTONES PRINCIPALES
  // ========================================
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

  // ========================================
  // TOGGLE DE VISTA (LISTA/TABLA)
  // ========================================
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#dcdcdcff',
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
    alignItems: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  viewToggleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000ff',
  },
  viewToggleTextActive: {
    color: '#fff',
  },

  // ========================================
  // BUSCADOR
  // ========================================
  searchContainer: {
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // ========================================
  // VISTA DE LISTA - PRODUCTOS
  // ========================================
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  colItem: {
    flex: 1,
    minWidth: 150,
  },
  productLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productDetail: {
    fontSize: 17,
  },
  productCode: {
    fontSize: 17,
    fontWeight: '500',
  },

  // ========================================
  // BOTONES DE ESTADO Y ACCIONES
  // ========================================
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: "#f9ebc3ff",
    paddingHorizontal: 16,
    minWidth: 48,
  },
  deleteButton: {
    backgroundColor: "#f9c3c3ff",
    paddingHorizontal: 16,
    minWidth: 48,
  },

  // ========================================
  // VISTA DE TABLA
  // ========================================
  tableContainer: {
    width: '100%',
    marginHorizontal: 3,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // Encabezado de tabla
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 19,
    color: '#333',
    flexWrap: 'wrap',
  },
  headerEstadoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  // Filas de tabla
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#fff',
  },
  tableCell: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 18,
    color: '#444',
    flexWrap: 'wrap',
  },

  // Columnas específicas
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnAcciones: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Estados visuales en tabla
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 3,
    borderRadius: 12,
    alignSelf: 'center',
  },
  estadoActivo: {
    backgroundColor: '#d4edda',
  },
  estadoInactivo: {
    backgroundColor: '#f8d7da',
  },
  estadoText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  estadoTextoActivo: {
    color: '#155724',
  },
  estadoTextoInactivo: {
    color: '#721c24',
  },

  // Fila vacía en tabla
  tableEmptyRow: {
    padding: 20,
    alignItems: 'center',
  },

  // ========================================
  // MODAL DE FORMULARIO
  // ========================================
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

  // ========================================
  // INPUTS Y FORMULARIOS
  // ========================================
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  suggestedInput: {
    backgroundColor: "#E8F5E8",
    borderColor: "#4CAF50",
    borderWidth: 1,
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

  // ========================================
  // BOTONES DEL MODAL DE FORMULARIO
  // ========================================
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

  // ========================================
  // MODAL DE COSTOS CALCULADOS
  // ========================================
  modalCostosOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCostosContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalCostosTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  modalCostosBody: {
    marginBottom: 20,
  },
  modalCostosText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  costoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 2,
  },
  costoItemExacto: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  costoItemRedondeado: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  costoInfoContainer: {
    flex: 1,
  },
  costoLabel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  costoSubLabel: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  costoValorExacto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  costoValor: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  diferenciaContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  diferenciaText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F57C00',
    marginBottom: 4,
  },
  diferenciaSubtext: {
    fontSize: 12,
    color: '#E65100',
    fontStyle: 'italic',
  },
  modalCostosFooterText: {
    fontSize: 15,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  modalCostosButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCostosButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // ========================================
  // ICONOS Y ELEMENTOS VISUALES
  // ========================================
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  iconImage: {
    width: 27,
    height: 27,
  },

  // ========================================
  // TEXTOS Y MENSAJES
  // ========================================
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  loadingText: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#666",
    marginVertical: 10,
  },

  // ========================================
  // UTILIDADES
  // ========================================
  marginTop: {
    marginTop: 15,
  },
});