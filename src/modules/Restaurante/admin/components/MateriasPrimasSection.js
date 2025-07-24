import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import axios from "axios";
import { API } from "../../../../services/api";

export default function MateriaPrimaSection({ token, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    clave: "",
    nombre: "",
    unidad: "",
    costo_unitario: "",
    existencia: "",
  });

  useEffect(() => {
    fetchMateriasPrimas();
  }, []);

  const fetchMateriasPrimas = async () => {
    if (!token) return;
    try {
      const response = await API.get("/restaurante/admin/materias-primas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        setMateriasPrimas(response.data.data);
      }
    } catch (error) {
      console.log("Error al obtener materias primas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      clave: "",
      nombre: "",
      unidad: "",
      costo_unitario: "",
      existencia: "",
    });
    setEditingItem(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (modalType === "crear") {
      handleCreate();
    } else {
      handleEdit();
    }
  };

  const handleCreate = async () => {
    if (
      !formData.clave ||
      !formData.nombre ||
      !formData.unidad ||
      !formData.costo_unitario ||
      !formData.existencia
    ) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }
    if (!token) {
      Alert.alert("Error", "Sesión expirada. Inicia sesión nuevamente.");
      navigation.navigate("Login");
      return;
    }
    setIsLoading(true);
    try {
      await API.post("/restaurante/admin/materias-primas", formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      Alert.alert("Éxito", "Materia prima creada exitosamente");
      setModalVisible(false);
      resetForm();
      fetchMateriasPrimas();
    } catch (error) {
      console.log("Error al crear:", error.response?.data || error.message);
      Alert.alert("Error", "No se pudo crear la materia prima");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!token || !editingItem) return;
    setIsLoading(true);
    try {
      await API.put(
        `/restaurante/admin/materias-primas/${editingItem.id}`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert("Éxito", "Materia prima actualizada exitosamente");
      setModalVisible(false);
      resetForm();
      fetchMateriasPrimas();
    } catch (error) {
      console.log("Error al editar:", error.response?.data || error.message);
      Alert.alert("Error", "No se pudo actualizar la materia prima");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Eliminar", "¿Deseas eliminar esta materia prima?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/restaurante/admin/materias-primas/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert("Éxito", "Materia prima eliminada exitosamente");
            fetchMateriasPrimas();
          } catch (error) {
            console.log(
              "Error al eliminar:",
              error.response?.data || error.message
            );
            Alert.alert("Error", "No se pudo eliminar la materia prima");
          }
        },
      },
    ]);
  };

  const openCreateModal = () => {
    setModalType("crear");
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      clave: item.clave,
      nombre: item.nombre,
      unidad: item.unidad,
      costo_unitario: item.costo_unitario.toString(),
      existencia: item.existencia.toString(),
    });
    setModalType("editar");
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Materias Primas</Text>

      <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
        <Text style={styles.createButtonText}>➕ Agregar Materia Prima</Text>
      </TouchableOpacity>

      <ScrollView>
        {materiasPrimas.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemText}>
              #{item.id} -{item.clave} - {item.nombre}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => openEditModal(item)}
                style={styles.editButton}
              >
                <Text style={styles.editButtonText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {materiasPrimas.length === 0 && (
          <Text style={styles.emptyText}>
            No hay materias primas registradas.
          </Text>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === "crear" ? "Agregar" : "Editar"} Materia Prima
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Clave"
              value={formData.clave}
              onChangeText={(text) => handleInputChange("clave", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={formData.nombre}
              onChangeText={(text) => handleInputChange("nombre", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Unidad (ej. kg, lts)"
              value={formData.unidad}
              onChangeText={(text) => handleInputChange("unidad", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Costo unitario"
              keyboardType="decimal-pad"
              value={formData.costo_unitario}
              onChangeText={(text) => handleInputChange("costo_unitario", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Existencia"
              keyboardType="decimal-pad"
              value={formData.existencia}
              onChangeText={(text) => handleInputChange("existencia", text)}
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
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F5F5" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  createButtonText: { color: "white", fontWeight: "bold" },
  itemRow: {
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
  },
  itemText: { fontSize: 16, color: "#333" },
  actions: { flexDirection: "row" },
  editButton: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 6,
    marginRight: 6,
  },
  editButtonText: { color: "#FFF" },
  deleteButton: { backgroundColor: "#F44336", padding: 8, borderRadius: 6 },
  deleteButtonText: { color: "#FFF" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 30 },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#F44336", marginRight: 10 },
  cancelButtonText: { color: "#FFF", fontWeight: "bold" },
  submitButton: { backgroundColor: "#4CAF50" },
  submitButtonText: { color: "#FFF", fontWeight: "bold" },
});
