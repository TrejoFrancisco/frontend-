import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Image,
  Alert,
} from "react-native";
import axios from "axios";
import { API } from "../../../../services/api";

export default function CategoriasScreen({ token, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [editingCategoria, setEditingCategoria] = useState(null);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [categoriaData, setCategoriaData] = useState({
    nombre: "",
    descripcion: "",
  });

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    if (!token) return;

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
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    }
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(categorias.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategorias = categorias.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const resetForm = () => {
    setCategoriaData({
      nombre: "",
      descripcion: "",
    });
    setEditingCategoria(null);
  };

  const handleInputChange = (field, value) => {
    setCategoriaData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateCategoria = async () => {
    if (!categoriaData.nombre || !categoriaData.descripcion) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    if (!token) {
      Alert.alert("Error", "No tienes autorización. Inicia sesión nuevamente.");
      navigation.navigate("Login");
      return;
    }

    setIsLoading(true);
    try {
      await API.post("/restaurante/admin/categorias", categoriaData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Éxito", "Categoría creada exitosamente");
      setModalVisible(false);
      resetForm();
      fetchCategorias();
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Error", "Sesión expirada. Inicia sesión nuevamente.");
        navigation.navigate("Login");
      } else {
        Alert.alert("Error", "Error al crear la categoría");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategoria = async () => {
    if (!categoriaData.nombre || !categoriaData.descripcion) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    if (!token) {
      Alert.alert("Error", "No tienes autorización. Inicia sesión nuevamente.");
      navigation.navigate("Login");
      return;
    }

    setIsLoading(true);
    try {
      await API.put(
        `/restaurante/admin/categorias/${editingCategoria.id}`,
        categoriaData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert("Éxito", "Categoría actualizada exitosamente");
      setModalVisible(false);
      resetForm();
      fetchCategorias();
    } catch (error) {
      if (error.response?.status === 401) {
        Alert.alert("Error", "Sesión expirada. Inicia sesión nuevamente.");
        navigation.navigate("Login");
      } else {
        Alert.alert("Error", "Error al actualizar la categoría");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategoria = async (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar esta categoría?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/restaurante/admin/categorias/${id}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              Alert.alert("Éxito", "Categoría eliminada exitosamente");

              // Ajustar la página si es necesario después de eliminar
              const newTotal = categorias.length - 1;
              const newTotalPages = Math.ceil(newTotal / itemsPerPage);
              if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
              }

              fetchCategorias();
            } catch (error) {
              // Manejo específico para categoría en uso
              if (
                error.response?.status === 409 &&
                error.response?.data?.error?.code === "CATEGORIA_EN_USO"
              ) {
                const errorData = error.response.data.error;
                const relaciones = errorData.relaciones || {};

                // Construir mensaje detallado
                let mensajeDetallado = errorData.message + "\n\n";

                // Agregar detalles de productos
                if (relaciones.productos && relaciones.productos.length > 0) {
                  mensajeDetallado += "📦 Productos:\n";
                  relaciones.productos.forEach((producto, index) => {
                    if (index < 3) {
                      // Mostrar máximo 3 productos
                      mensajeDetallado += `  • ${producto.producto_nombre} (${producto.producto_clave})\n`;
                    }
                  });
                  if (relaciones.productos.length > 3) {
                    mensajeDetallado += `  ... y ${
                      relaciones.productos.length - 3
                    } más\n`;
                  }
                  mensajeDetallado += "\n";
                }

                // Agregar detalles de encargados
                if (relaciones.encargados && relaciones.encargados.length > 0) {
                  mensajeDetallado += "👤 Encargados:\n";
                  relaciones.encargados.forEach((encargado, index) => {
                    if (index < 3) {
                      // Mostrar máximo 3 encargados
                      mensajeDetallado += `  • ${encargado.user_name} (${encargado.user_email})\n`;
                    }
                  });
                  if (relaciones.encargados.length > 3) {
                    mensajeDetallado += `  ... y ${
                      relaciones.encargados.length - 3
                    } más\n`;
                  }
                }

                Alert.alert("No se puede eliminar", mensajeDetallado.trim(), [
                  { text: "Entendido", style: "default" },
                ]);
              } else if (error.response?.status === 401) {
                Alert.alert(
                  "Error",
                  "Sesión expirada. Inicia sesión nuevamente."
                );
                navigation.navigate("Login");
              } else {
                Alert.alert(
                  "Error",
                  error.response?.data?.message ||
                    "Error al eliminar la categoría"
                );
              }
            }
          },
        },
      ]
    );
  };

  const openCreateModal = () => {
    setModalType("crear");
    setModalVisible(true);
  };

  const openEditModal = (categoria) => {
    setEditingCategoria(categoria);
    setCategoriaData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion,
    });
    setModalType("editar");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (modalType === "crear") {
      handleCreateCategoria();
    } else {
      handleEditCategoria();
    }
  };

  // Renderizar los botones de paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.disabledButton,
          ]}
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationText}>←</Text>
        </TouchableOpacity>

        {startPage > 1 && (
          <>
            <TouchableOpacity
              style={styles.paginationButton}
              onPress={() => goToPage(1)}
            >
              <Text style={styles.paginationText}>1</Text>
            </TouchableOpacity>
            {startPage > 2 && <Text style={styles.ellipsis}>...</Text>}
          </>
        )}

        {pageNumbers.map((page) => (
          <TouchableOpacity
            key={page}
            style={[
              styles.paginationButton,
              currentPage === page && styles.activePageButton,
            ]}
            onPress={() => goToPage(page)}
          >
            <Text
              style={[
                styles.paginationText,
                currentPage === page && styles.activePageText,
              ]}
            >
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <Text style={styles.ellipsis}>...</Text>
            )}
            <TouchableOpacity
              style={styles.paginationButton}
              onPress={() => goToPage(totalPages)}
            >
              <Text style={styles.paginationText}>{totalPages}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.disabledButton,
          ]}
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationText}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Categorías</Text>
      <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
        <View style={styles.inlineContent}>
          <Image
            source={require("../../../../../assets/mas.png")}
            style={styles.icon}
          />
          <Text style={styles.createButtonText}>Crear Nueva Categoria</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.listContainer}>
        {/* Encabezado de la tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.idColumn]}>ID</Text>
          <Text style={[styles.tableHeaderText, styles.nameColumn]}>
            Nombre
          </Text>
          <Text style={[styles.tableHeaderText, styles.descriptionColumn]}>
            Descripción
          </Text>
          <View style={[styles.actionsColumn, styles.headerActionsContainer]}>
            <Text style={styles.tableHeaderText} numberOfLines={2}>
              Acciones
            </Text>
          </View>
        </View>

        {/* Filas de la tabla */}
        <ScrollView style={styles.tableBody}>
          {currentCategorias.map((categoria) => (
            <View key={categoria.id} style={styles.tableRow}>
              <Text style={[styles.tableCellText, styles.idColumn]}>
                {categoria.id}
              </Text>
              <Text
                style={[styles.tableCellText, styles.nameColumn]}
                numberOfLines={2}
              >
                {categoria.nombre}
              </Text>
              <Text
                style={[styles.tableCellText, styles.descriptionColumn]}
                numberOfLines={2}
              >
                {categoria.descripcion || "Sin descripción"}
              </Text>
              <View style={[styles.actionsColumn, styles.actionsContainer]}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(categoria)}
                >
                  <Image
                    source={require("../../../../../assets/editarr.png")}
                    style={styles.icon}
                    accessibilityLabel="Editar categoría"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCategoria(categoria.id)}
                >
                  <Image
                    source={require("../../../../../assets/eliminar.png")}
                    style={styles.icon}
                    accessibilityLabel="Eliminar categoría"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Controles de paginación */}
        {renderPagination()}

        {/* Mensaje si no hay categorías */}
        {categorias.length === 0 && (
          <Text style={styles.emptyText}>No hay categorías disponibles</Text>
        )}
      </View>

      {/* Modal para crear/editar categoría */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {modalType === "crear"
                  ? "Crear Nueva Categoría"
                  : "Editar Categoría"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Nombre de la categoría"
                placeholderTextColor="#888"
                value={categoriaData.nombre || undefined}
                onChangeText={(text) => handleInputChange("nombre", text)}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción de la categoría"
                placeholderTextColor="#888"
                value={categoriaData.descripcion || undefined}
                onChangeText={(text) => handleInputChange("descripcion", text)}
                multiline
                numberOfLines={4}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading
                      ? modalType === "crear"
                        ? "Creando..."
                        : "Actualizando..."
                      : modalType === "crear"
                      ? "Crear"
                      : "Actualizar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ===== CONTENEDOR PRINCIPAL =====
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },

  // ===== TÍTULOS =====
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },

  // ===== BOTÓN CREAR =====
  createButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    flexShrink: 1,
    flexWrap: "wrap",
  },

  // ===== TABLA - CONTENEDOR =====
  listContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },

  // ===== TABLA - ENCABEZADO =====
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#CCCCCC",
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 19,
    color: "#333333",
    flexWrap: "wrap",
  },
  headerActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  // ===== TABLA - CUERPO =====
  tableBody: {
    maxHeight: "100%",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  tableCellText: {
    fontSize: 17,
    color: "#444",
    flexWrap: "wrap",
  },

  // ===== TABLA - COLUMNAS =====
  idColumn: {
    flex: 1,
    textAlign: "center",
  },
  nameColumn: {
    flex: 2,
    paddingHorizontal: 4,
  },
  descriptionColumn: {
    flex: 3,
    paddingHorizontal: 4,
  },
  actionsColumn: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },

  // ===== TABLA - BOTONES DE ACCIÓN =====
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  editButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },

  // ===== ICONOS =====
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },

  // ===== TEXTO VACÍO =====
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    color: "#888",
    fontStyle: "italic",
  },

  // ===== PAGINACIÓN =====
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    gap: 8,
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#F0F0F0",
    minWidth: 40,
    alignItems: "center",
  },
  activePageButton: {
    backgroundColor: "#4CAF50",
  },
  disabledButton: {
    opacity: 0.4,
  },
  paginationText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  activePageText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  ellipsis: {
    fontSize: 16,
    color: "#666",
    paddingHorizontal: 4,
  },
  paginationInfo: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  paginationInfoText: {
    fontSize: 14,
    color: "#666",
  },

  // ===== MODAL - CONTENEDOR =====
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },

  // ===== MODAL - FORMULARIO =====
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },

  // ===== MODAL - BOTONES =====
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
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
});
