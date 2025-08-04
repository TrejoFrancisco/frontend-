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
      console.log("Error al obtener categorías:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
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
      console.log("Error:", error.response?.data || error.message);

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
      console.log("Error:", error.response?.data || error.message);

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
              fetchCategorias();
            } catch (error) {
              console.log("Error:", error.response?.data || error.message);
              Alert.alert("Error", "Error al eliminar la categoría");
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Categorías</Text>
      <Text style={styles.subtitle}>Administra las categorías de tu menú</Text>

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
          <Text style={[styles.tableHeaderText, styles.actionsColumn]}>
            Acciones
          </Text>
        </View>

        {/* Filas de la tabla */}
        <ScrollView style={styles.tableBody}>
          {categorias.map((categoria) => (
            <View key={categoria.id} style={styles.tableRow}>
              <Text style={[styles.tableCellText, styles.idColumn]}>
                {categoria.id}
              </Text>
              <Text style={[styles.tableCellText, styles.nameColumn]}>
                {categoria.nombre}
              </Text>
              <Text
                style={[styles.tableCellText, styles.descriptionColumn]}
                numberOfLines={2}
              >
                {categoria.descripcion}
              </Text>
              <View style={[styles.actionsColumn, styles.actionsContainer]}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(categoria)}
                >
                  <Text style={styles.editButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteCategoria(categoria.id)}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

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
                value={categoriaData.nombre}
                onChangeText={(text) => handleInputChange("nombre", text)}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descripción de la categoría"
                value={categoriaData.descripcion}
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 20,
  },
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
  listContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: "bold",
    color: "#1A1A2E",
    fontSize: 14,
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    alignItems: "center",
  },
  tableCellText: {
    fontSize: 14,
    color: "#333333",
  },
  idColumn: {
    width: 50,
  },
  nameColumn: {
    flex: 1,
    marginRight: 8,
  },
  descriptionColumn: {
    flex: 2,
    marginRight: 8,
  },
  actionsColumn: {
    width: 80,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  editButton: {
    padding: 8,
    backgroundColor: "#2196F3",
    borderRadius: 6,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    backgroundColor: "#F44336",
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#666666",
    fontSize: 16,
    marginTop: 20,
  },
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
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
