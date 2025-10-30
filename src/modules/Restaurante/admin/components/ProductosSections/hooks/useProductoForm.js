import { useState, useCallback } from "react";
import { Alert } from "react-native";
import { API } from "../../../../../../services/api";

const INITIAL_FORM_STATE = {
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
};

export const useProductoForm = (token, recetas, onSuccess) => {
  const [productoData, setProductoData] = useState(INITIAL_FORM_STATE);
  const [editMode, setEditMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);

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

  const resetForm = useCallback(() => {
    setProductoData(INITIAL_FORM_STATE);
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

  const guardarProducto = useCallback(async () => {
    if (!validarFormulario()) return;

    try {
      const dataToSend = {
        clave: productoData.clave.trim(),
        nombre: productoData.nombre.trim(),
        categoria_id: parseInt(productoData.categoria_id, 10),
        receta_id: productoData.receta_id
          ? parseInt(productoData.receta_id, 10)
          : null,
        prioridad: parseFloat(productoData.prioridad),
        precio_venta: parseFloat(productoData.precio_venta),
        estado: productoData.estado,
      };

      if (productoData.receta_id) {
        dataToSend.costo_unitario = parseFloat(productoData.costo_unitario);
      } else {
        dataToSend.costo_unitario =
          productoData.costo_unitario && productoData.costo_unitario.trim()
            ? parseFloat(productoData.costo_unitario)
            : null;
      }

      if (!productoData.receta_id) {
        dataToSend.existencia_inicial = parseFloat(
          productoData.existencia_inicial
        );
        dataToSend.unidad = productoData.unidad
          ? productoData.unidad.trim()
          : null;
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
        onSuccess();
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
  }, [
    productoData,
    editMode,
    editingProductId,
    token,
    validarFormulario,
    resetForm,
    onSuccess,
  ]);

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
  }, []);

  return {
    productoData,
    editMode,
    handleInputChange,
    resetForm,
    guardarProducto,
    editarProducto,
  };
};
