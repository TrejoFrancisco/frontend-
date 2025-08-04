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
  const [recetas, setRecetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [productoData, setProductoData] = useState({
    clave: "",
    nombre: "",
    categoria_id: "",
    prioridad: "",
    precio_venta: "",
    costo_receta: "",
    costo_redondeado: "",
    tiene_receta: "",
    receta_id: "",
    existencia_inicial: "",
    unidad: "",
  });

  useEffect(() => {
    fetchProductos();
    fetchRecetas();
    fetchCategorias();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await API.get("/restaurante/admin/productos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setProductos(response.data.data.productos);
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
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (error) {
      console.error("Error al obtener categorías:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setProductoData((prev) => {
      const newData = { ...prev, [field]: value };

      if (field === "tiene_receta") {
        if (value === "si") {
          newData.existencia_inicial = "";
          newData.unidad = "";
        } else if (value === "no") {
          newData.receta_id = "";
        }
      }

      return newData;
    });
  };

  const resetForm = () => {
    setProductoData({
      clave: "",
      nombre: "",
      categoria_id: "",
      prioridad: "",
      precio_venta: "",
      costo_receta: "",
      costo_redondeado: "",
      tiene_receta: "",
      receta_id: "",
      existencia_inicial: "",
      unidad: "",
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
      "precio_venta",
      "costo_receta",
      "costo_redondeado",
      "tiene_receta",
    ];

    for (let campo of camposRequeridos) {
      if (!productoData[campo]) {
        Alert.alert("Error", `El campo ${campo} es requerido`);
        return false;
      }
    }

    if (productoData.tiene_receta === "si" && !productoData.receta_id) {
      Alert.alert("Error", "Debe seleccionar una receta");
      return false;
    }

    if (productoData.tiene_receta === "no") {
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
        prioridad: parseFloat(productoData.prioridad),
        precio_venta: parseFloat(productoData.precio_venta),
        costo_receta: parseFloat(productoData.costo_receta),
        costo_redondeado: parseFloat(productoData.costo_redondeado),
      };

      if (productoData.tiene_receta === "si") {
        dataToSend.receta_id = parseInt(productoData.receta_id);
      } else {
        dataToSend.receta_id = null;
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
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        response = await API.post("/restaurante/admin/productos", dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
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
      prioridad: producto.prioridad.toString(),
      precio_venta: producto.precio_venta.toString(),
      costo_receta: producto.costo_receta.toString(),
      costo_redondeado: producto.costo_redondeado.toString(),
      tiene_receta: producto.receta_id ? "si" : "no",
      receta_id: producto.receta_id ? producto.receta_id.toString() : "",
      existencia_inicial: producto.existencia
        ? producto.existencia.toString()
        : "",
      unidad: producto.unidad || "",
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
                  headers: { Authorization: `Bearer ${token}` },
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
      <View style={styles.productHeader}>
        <Text style={styles.productName}>{item.nombre}</Text>
        <Text style={styles.productCode}>{item.clave}</Text>
      </View>

      <View style={styles.productDetails}>
        <Text style={styles.productDetail}>Precio: ${item.precio_venta}</Text>
        <Text style={styles.productDetail}>Prioridad: {item.prioridad}</Text>
        <Text style={styles.productDetail}>
          Tipo: {item.receta_id ? "Con receta" : "Producto directo"}
        </Text>

        <Text style={styles.productDetail}>
          Costo: ${item.costo_redondeado}
        </Text>
      </View>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => editarProducto(item)}
        >
          <Text style={styles.actionButtonText}>✏️ Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => eliminarProducto(item.id, item.nombre)}
        >
          <Text style={styles.actionButtonText}>🗑️ Eliminar</Text>
        </TouchableOpacity>
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

        {/* Lista de productos usando map en lugar de FlatList */}
        <View style={styles.productsList}>
          {productos.map((producto) => renderProductoItem(producto))}
        </View>
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
                  value={productoData.clave}
                  onChangeText={(text) => handleInputChange("clave", text)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  value={productoData.nombre}
                  onChangeText={(text) => handleInputChange("nombre", text)}
                />

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

                <TextInput
                  style={styles.input}
                  placeholder="Precio de venta"
                  keyboardType="decimal-pad"
                  value={productoData.precio_venta}
                  onChangeText={(text) =>
                    handleInputChange("precio_venta", text)
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Costo receta"
                  keyboardType="decimal-pad"
                  value={productoData.costo_receta}
                  onChangeText={(text) =>
                    handleInputChange("costo_receta", text)
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Costo redondeado"
                  keyboardType="decimal-pad"
                  value={productoData.costo_redondeado}
                  onChangeText={(text) =>
                    handleInputChange("costo_redondeado", text)
                  }
                />

                {/* SELECTOR DE TIPO DE PRODUCTO */}
                <Text style={styles.label}>¿El producto tiene receta?</Text>
                <Picker
                  selectedValue={productoData.tiene_receta}
                  onValueChange={(value) =>
                    handleInputChange("tiene_receta", value)
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Selecciona una opción" value="" />
                  <Picker.Item label="Sí, tiene receta" value="si" />
                  <Picker.Item label="No, es producto directo" value="no" />
                </Picker>

                {/* CAMPOS CONDICIONALES PARA PRODUCTOS CON RECETA */}
                {productoData.tiene_receta === "si" && (
                  <>
                    <Text style={styles.label}>Seleccionar Receta</Text>
                    <Picker
                      selectedValue={productoData.receta_id}
                      onValueChange={(value) =>
                        handleInputChange("receta_id", value)
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Selecciona una receta" value="" />
                      {recetas.map((receta) => (
                        <Picker.Item
                          key={receta.id}
                          label={`${receta.clave} - ${receta.nombre}`}
                          value={receta.id.toString()}
                        />
                      ))}
                    </Picker>
                  </>
                )}

                {/* CAMPOS CONDICIONALES PARA PRODUCTOS SIN RECETA */}
                {productoData.tiene_receta === "no" && (
                  <>
                    <TextInput
                      style={[styles.input, styles.marginTop]}
                      placeholder="Existencia inicial"
                      keyboardType="decimal-pad"
                      value={productoData.existencia_inicial}
                      onChangeText={(text) =>
                        handleInputChange("existencia_inicial", text)
                      }
                    />

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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
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
  icon: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  productCode: {
    fontSize: 14,
    color: "#6c757d",
    backgroundColor: "#e9ecef",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  productDetails: {
    marginBottom: 15,
  },
  productDetail: {
    fontSize: 14,
    marginBottom: 5,
    color: "#495057",
  },
  productActions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 100,
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#ffc107",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
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
    marginBottom: 20,
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
    fontSize: 16,
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
  marginTop: {
    marginTop: 15,
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
});
