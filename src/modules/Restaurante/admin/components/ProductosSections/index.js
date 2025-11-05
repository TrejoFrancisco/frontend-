import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useProductos } from "./hooks/useProductos";
import { useProductoForm } from "./hooks/useProductoForm";
import { ProductosList } from "./components/ProductosList";
import { ProductosTable } from "./components/ProductosTable";
import { ProductoForm } from "./components/ProductoForm";
import { Pagination } from "./components/Pagination";

export default function ProductosSection({ token, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [vistaTabla, setVistaTabla] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 10;

  // Custom hooks
  const {
    productos,
    productosFiltrados,
    recetas,
    categorias,
    loading,
    error,
    fetchProductos,
    filtrarProductos,
    cambiarEstadoProducto,
  } = useProductos(token, navigation);

  const {
    productoData,
    editMode,
    handleInputChange,
    resetForm,
    guardarProducto,
    editarProducto,
  } = useProductoForm(token, recetas, () => {
    setModalVisible(false);
    fetchProductos();
  });

  // Efectos
  useEffect(() => {
    filtrarProductos(textoBusqueda);
    setPaginaActual(1);
  }, [textoBusqueda, filtrarProductos]);

  // Paginación
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

  const abrirModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    resetForm();
  }, [resetForm]);

  const handleEditarProducto = useCallback(
    (producto) => {
      editarProducto(producto);
      setModalVisible(true);
    },
    [editarProducto]
  );

  // Estados de carga y error
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

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              fetchProductos();
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
              source={require("../../../../../../assets/mas.png")}
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
              style={[styles.searchInput, { color: "#000" }]}
              placeholder="Buscar por nombre o clave..."
              placeholderTextColor="#999"
              value={textoBusqueda || ""}
              onChangeText={setTextoBusqueda}
            />
          </View>
        </View>

        {!vistaTabla ? (
          <ProductosList
            productos={productosActuales}
            searchText={textoBusqueda}
            onEdit={handleEditarProducto}
            onChangeStatus={cambiarEstadoProducto}
          />
        ) : (
          <ProductosTable
            productos={productosActuales}
            searchText={textoBusqueda}
            onEdit={handleEditarProducto}
            onChangeStatus={cambiarEstadoProducto}
          />
        )}

        <Pagination
          currentPage={paginaActual}
          totalPages={totalPaginas}
          onPageChange={cambiarPagina}
          onNext={paginaSiguiente}
          onPrevious={paginaAnterior}
        />
      </ScrollView>

      <ProductoForm
        visible={modalVisible}
        editMode={editMode}
        productoData={productoData}
        recetas={recetas}
        categorias={categorias}
        onInputChange={handleInputChange}
        onSave={guardarProducto}
        onClose={cerrarModal}
      />
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
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
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
});
