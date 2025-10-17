import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { API } from "../../../../services/api";

export default function NuevaComandaModal({
  visible,
  onClose,
  onSuccess,
  token,
}) {
  const [productos, setProductos] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [productosSeleccionados, setProductosSeleccionados] = useState({});
  const [detallesProductos, setDetallesProductos] = useState({});

  const [formData, setFormData] = useState({
    mesa: "",
    personas: "",
    comensal: "",
  });

  // Obtener productos
  useEffect(() => {
    if (visible && token) {
      fetchProductos();
    }
  }, [visible, token]);

  const fetchProductos = async () => {
    try {
      const response = await API.get("restaurante/mesero/productos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setProductos(response.data.data.productos || []);
      }
    } catch (error) {
      console.log("Error al obtener productos:", error);
    }
  };

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData({ mesa: "", personas: "", comensal: "" });
    setProductosSeleccionados({});
    setDetallesProductos({});
    setBusquedaProducto("");
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Agregar/quitar productos
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

        // Limpiar detalles
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
      }
      return { ...prev, [productoId]: nuevaCantidad };
    });
  }, []);

  // Agregar detalle a producto
  const agregarDetalle = (productoId, indice, detalle) => {
    const key = `${productoId}_${indice}`;
    setDetallesProductos((prev) => ({
      ...prev,
      [key]: detalle.trim() || null,
    }));
  };

  // Calcular total
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

  // Crear comanda
  const crearComanda = async () => {
    if (!formData.mesa || !formData.personas) {
      Alert.alert("Error", "Mesa y número de personas son obligatorios");
      return;
    }

    const productosArray = [];
    Object.entries(productosSeleccionados).forEach(([productoId, cantidad]) => {
      for (let i = 0; i < cantidad; i++) {
        productosArray.push(parseInt(productoId));
      }
    });

    if (productosArray.length === 0) {
      Alert.alert("Error", "Debe seleccionar al menos un producto");
      return;
    }

    const productosConDetalle = productosArray.map((productoId, index) => {
      const key = `${productoId}_${index}`;
      return {
        id: productoId,
        detalle: detallesProductos[key] || null,
      };
    });

    try {
      const response = await API.post(
        "/restaurante/mesero/comanda",
        {
          mesa: formData.mesa,
          personas: parseInt(formData.personas),
          comensal: formData.comensal || null,
          productos: productosConDetalle,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        Alert.alert("Éxito", response.data.message);
        resetForm();
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.log("Error al crear comanda:", error);
      if (error.response?.data?.error) {
        Alert.alert("Error", error.response.data.error.message);
      } else {
        Alert.alert("Error", "Ocurrió un error al crear la comanda");
      }
    }
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
      producto.clave.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Comanda</Text>

            <ScrollView style={styles.formScrollView}>
              {/* Formulario básico */}
              <TextInput
                style={styles.input}
                placeholder="Mesa"
                placeholderTextColor="#999999"
                value={formData.mesa}
                onChangeText={(value) =>
                  setNuevaComanda((prev) => ({ ...prev, mesa: value }))
                }
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Número de personas"
                placeholderTextColor="#999999"
                value={formData.personas}
                onChangeText={(value) =>
                  setNuevaComanda((prev) => ({ ...prev, personas: value }))
                }
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder="Nombre del comensal"
                placeholderTextColor="#999999"
                value={formData.comensal}
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

              {/* Total */}
              {Object.keys(productosSeleccionados).length > 0 && (
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total:</Text>
                  <Text style={styles.totalMonto}>${calcularTotal()}</Text>
                </View>
              )}

              {/* Lista de productos */}
              {productosFiltrados.map((producto) => (
                <ProductoItem
                  key={producto.id}
                  producto={producto}
                  cantidad={productosSeleccionados[producto.id] || 0}
                  onAgregar={() => agregarProducto(producto.id)}
                  onQuitar={() => quitarProducto(producto.id)}
                  detalles={detallesProductos}
                  onAgregarDetalle={agregarDetalle}
                />
              ))}
            </ScrollView>

            {/* Botones */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetForm();
                  onClose();
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
  );
}

// Componente ProductoItem
function ProductoItem({
  producto,
  cantidad,
  onAgregar,
  onQuitar,
  detalles,
  onAgregarDetalle,
}) {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [detalleTemp, setDetalleTemp] = useState("");
  const [indiceDetalle, setIndiceDetalle] = useState(null);

  return (
    <View
      style={[styles.productoItem, cantidad > 0 && styles.productoSelected]}
    >
      <View style={styles.productoContainer}>
        <View style={styles.productoInfo}>
          <Text style={styles.productoClave}>{producto.clave}</Text>
          <Text style={styles.productoNombre}>{producto.nombre}</Text>
          <Text style={styles.productoPrecio}>${producto.precio_venta}</Text>
        </View>

        <View style={styles.cantidadControls}>
          <TouchableOpacity
            style={[
              styles.cantidadButton,
              cantidad === 0 && styles.cantidadButtonDisabled,
            ]}
            onPress={onQuitar}
            disabled={cantidad === 0}
          >
            <Text style={styles.cantidadButtonText}>-</Text>
          </TouchableOpacity>

          <Text style={styles.cantidadText}>{cantidad}</Text>

          <TouchableOpacity style={styles.cantidadButton} onPress={onAgregar}>
            <Text style={styles.cantidadButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Detalles */}
      {cantidad > 0 && (
        <View style={styles.detallesContainer}>
          {Array.from({ length: cantidad }, (_, index) => {
            const key = `${producto.id}_${index}`;
            const detalleGuardado = detalles[key];

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.detalleItem,
                  detalleGuardado && styles.detalleItemConDetalle,
                ]}
                onPress={() => {
                  setIndiceDetalle(index);
                  setDetalleTemp(detalleGuardado || "");
                  setMostrarDetalles(true);
                }}
              >
                <Text style={styles.detalleTexto}>
                  #{index + 1} {detalleGuardado || "Agregar detalle"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Modal detalle simple */}
      <Modal visible={mostrarDetalles} animationType="fade" transparent>
        <View style={styles.detalleModalContainer}>
          <View style={styles.detalleModalContent}>
            <Text style={styles.detalleModalTitle}>Detalle del Producto</Text>
            <TextInput
              style={styles.detalleInput}
              placeholder="Ej: Sin cebolla, con hielos..."
              value={detalleTemp}
              onChangeText={setDetalleTemp}
              multiline
            />
            <View style={styles.detalleModalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setMostrarDetalles(false);
                  setDetalleTemp("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => {
                  onAgregarDetalle(producto.id, indiceDetalle, detalleTemp);
                  setMostrarDetalles(false);
                  setDetalleTemp("");
                }}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#e8f5e9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: "bold",
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
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  productoSelected: {
    backgroundColor: "#eef7ffff",
    borderColor: "#1b89ffff",
  },
  productoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  productoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  },
  productoPrecio: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#28a745",
  },
  cantidadControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cantidadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
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
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  detalleItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  detalleItemConDetalle: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4caf50",
  },
  detalleTexto: {
    fontSize: 13,
    color: "#666",
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
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  detalleModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  detalleModalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "80%",
  },
  detalleModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
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
  detalleModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
});
