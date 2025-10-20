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

export default function EditarComandaModal({
  visible,
  onClose,
  onSuccess,
  token,
  comanda,
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

  // Cargar datos de la comanda cuando se abre el modal
  useEffect(() => {
    if (visible && comanda) {
      cargarDatosComanda();
    }
  }, [visible, comanda]);

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

  const cargarDatosComanda = () => {
    // Cargar datos básicos
    setFormData({
      mesa: comanda.mesa || "",
      personas: comanda.personas?.toString() || "",
      comensal: comanda.comensal || "",
    });

    // Procesar productos existentes
    const productosContados = {};
    const detallesIniciales = {};
    const contadorPorProducto = {};

    comanda.productos?.forEach((producto) => {
      productosContados[producto.id] =
        (productosContados[producto.id] || 0) + 1;

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

  // Obtener productos de la comanda actual
  const getProductosComandaActual = useCallback(() => {
    if (!comanda || !comanda.productos) return [];

    const productosIds = [...new Set(comanda.productos.map((p) => p.id))];

    return productosIds
      .map((id) => {
        const producto =
          productos.find((p) => p.id === id) ||
          comanda.productos.find((p) => p.id === id);
        return producto;
      })
      .filter(Boolean);
  }, [comanda, productos]);

  // Obtener productos de búsqueda (nuevos)
  const getProductosBusqueda = useCallback(() => {
    if (!busquedaProducto.trim()) return [];

    const productosComandaIds = comanda?.productos?.map((p) => p.id) || [];

    return productos.filter(
      (producto) =>
        !productosComandaIds.includes(producto.id) &&
        (producto.nombre
          .toLowerCase()
          .includes(busquedaProducto.toLowerCase()) ||
          producto.clave.toLowerCase().includes(busquedaProducto.toLowerCase()))
    );
  }, [busquedaProducto, comanda, productos]);

  // Editar comanda
  const editarComanda = async () => {
    if (!formData.mesa || !formData.personas) {
      Alert.alert("Error", "Mesa y número de personas son obligatorios");
      return;
    }

    const productosConDetalle = [];

    Object.entries(productosSeleccionados).forEach(([productoId, cantidad]) => {
      for (let i = 0; i < cantidad; i++) {
        const key = `${productoId}_${i}`;
        productosConDetalle.push({
          id: parseInt(productoId),
          detalle: detallesProductos[key] || null,
        });
      }
    });

    if (productosConDetalle.length === 0) {
      Alert.alert("Error", "Debe seleccionar al menos un producto");
      return;
    }

    try {
      const response = await API.put(`/restaurante/mesero/comanda/${comanda.id}`,
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
  console.log("Error al editar comanda:", error);
  if (error.response?.data?.error) {
    Alert.alert("Error", error.response.data.error.message);
  } else {
    Alert.alert("Error", "Ocurrió un error al editar la comanda");
  }
}
};

return (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalContainer}>
      <View style={styles.modalWrapper}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Editar Comanda</Text>

          <ScrollView style={styles.formScrollView}>
            {/* Formulario básico */}
            <TextInput
              style={styles.input}
              placeholder="Mesa"
              placeholderTextColor="#999"
              value={formData.mesa}
              onChangeText={(value) => handleChange("mesa", value)}
            />

            <TextInput
              style={styles.input}
              placeholder="Número de personas"
              placeholderTextColor="#999"
              value={formData.personas}
              onChangeText={(value) => handleChange("personas", value)}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Nombre del comensal"
              placeholderTextColor="#999"
              value={formData.comensal}
              onChangeText={(value) => handleChange("comensal", value)}
            />

            {/* Productos actuales */}
            <Text style={styles.sectionTitle}>Productos de la Comanda:</Text>

            {Object.keys(productosSeleccionados).length > 0 && (
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalMonto}>${calcularTotal()}</Text>
              </View>
            )}

            {getProductosComandaActual().length === 0 ? (
              <Text style={styles.noProductosText}>
                No hay productos en esta comanda
              </Text>
            ) : (
              getProductosComandaActual().map((producto) => (
                <ProductoItem
                  key={`actual-${producto.id}`}
                  producto={producto}
                  cantidad={productosSeleccionados[producto.id] || 0}
                  onAgregar={() => agregarProducto(producto.id)}
                  onQuitar={() => quitarProducto(producto.id)}
                  detalles={detallesProductos}
                  onAgregarDetalle={agregarDetalle}
                />
              ))
            )}

            {/* Separador */}
            <View style={styles.separador}>
              <Text style={styles.separadorTexto}>
                Agregar más productos:
              </Text>
            </View>

            {/* Buscador de productos nuevos */}
            <TextInput
              style={styles.buscadorInput}
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
                  getProductosBusqueda().map((producto) => (
                    <ProductoItem
                      key={`nuevo-${producto.id}`}
                      producto={producto}
                      cantidad={productosSeleccionados[producto.id] || 0}
                      onAgregar={() => agregarProducto(producto.id)}
                      onQuitar={() => quitarProducto(producto.id)}
                      detalles={detallesProductos}
                      onAgregarDetalle={agregarDetalle}
                      esNuevo={true}
                    />
                  ))
                )}
              </>
            )}
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
              onPress={editarComanda}
            >
              <Text style={styles.saveButtonText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  </Modal>
);
}

// Componente ProductoItem (reutilizable)
function ProductoItem({
  producto,
  cantidad,
  onAgregar,
  onQuitar,
  detalles,
  onAgregarDetalle,
  esNuevo = false,
}) {
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [detalleTemp, setDetalleTemp] = useState("");
  const [indiceDetalle, setIndiceDetalle] = useState(null);

  return (
    <View
      style={[
        styles.productoItem,
        cantidad > 0 && styles.productoSelected,
        esNuevo && styles.productoBusqueda,
      ]}
    >
      <View style={styles.productoContainer}>
        <View style={styles.productoInfo}>
          <Text style={styles.productoClave}>{producto.clave}</Text>
          <Text style={styles.productoNombre}>
            {producto.nombre}
            {esNuevo && <Text style={styles.nuevoProductoTag}> (NUEVO)</Text>}
          </Text>
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

      {/* Modal detalle */}
      <Modal visible={mostrarDetalles} animationType="fade" transparent>
        <View style={styles.detalleModalContainer}>
          <View style={styles.detalleModalContent}>
            <Text style={styles.detalleModalTitle}>Detalle del Producto</Text>
            <TextInput
              style={styles.detalleInput}
              placeholder="Ejemplo: Con hielos, sin cebolla, etc."
              placeholderTextColor="#999999"
              value={detalleTemp || undefined}
              onChangeText={setDetalleTemp}
              multiline={true}
              numberOfLines={3}
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
    borderColor: "#28a745",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: "#f0f8f0",
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
  noProductosText: {
    textAlign: "center",
    color: "#666",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
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
  productoBusqueda: {
    backgroundColor: "#f0f8f0",
    borderColor: "#28a745",
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
  unificarButton: {
    backgroundColor: "#6c757d",
  },
  unificarButtonDisabled: {
    backgroundColor: "#cccccc",
    opacity: 0.6,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  unificarButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
