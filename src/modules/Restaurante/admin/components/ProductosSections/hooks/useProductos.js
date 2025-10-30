import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import { API } from "../../../../../../services/api";

export const useProductos = (token, navigation) => {
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchProductos = useCallback(
    async (isMounted = true) => {
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
    },
    [token, navigation]
  );

  const fetchRecetas = useCallback(
    async (isMounted = true) => {
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
    },
    [token]
  );

  const fetchCategorias = useCallback(
    async (isMounted = true) => {
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
    },
    [token]
  );

  const filtrarProductos = useCallback(
    (textoBusqueda) => {
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
    },
    [productos]
  );

  const cambiarEstadoProducto = useCallback(
    (id, estadoActual, nombre) => {
      const nuevoEstado = estadoActual === "activo" ? "inactivo" : "activo";

      Alert.alert(
        "Cambiar Estado",
        `¿Deseas ${
          nuevoEstado === "activo" ? "activar" : "desactivar"
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
    [token, fetchProductos]
  );

  return {
    productos,
    productosFiltrados,
    recetas,
    categorias,
    loading,
    error,
    fetchProductos,
    filtrarProductos,
    cambiarEstadoProducto,
  };
};
