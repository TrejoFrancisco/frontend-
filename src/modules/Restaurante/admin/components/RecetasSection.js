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
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { API } from "../../../../services/api";

export default function RecetasSection({ token, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recetas, setRecetas] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [editingRecetas, setEditingRecetas] = useState(null);
  const [recetaDetalle, setRecetaDetalle] = useState(null);

  const [recetaData, setRecetaData] = useState({
    clave: "",
    nombre: "",
    materias_primas: [],
  });

  useEffect(() => {
    fetchRecetas();
    fetchMateriasPrimas();
  }, []);

  const fetchRecetas = async () => {
    if (!token) return;
    try {
      const response = await API.get("/restaurante/admin/recetas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRecetas(response.data.data);
      }
    } catch (error) {
      console.log("Error al obtener recetas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    }
  };

  const fetchMateriasPrimas = async () => {
    if (!token) return;
    try {
      const response = await API.get("/restaurante/admin/materias-primas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setMateriasPrimas(response.data.data);
      }
    } catch (error) {
      console.log("Error al obtener materias primas:", error);
    }
  };

  const fetchRecetaDetalle = async (recetaId) => {
    if (!token) return;
    try {
      const response = await API.get(`/restaurante/admin/show/${recetaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRecetaDetalle(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.log("Error al obtener detalle de receta:", error);
      Alert.alert("Error", "No se pudo cargar el detalle de la receta");
    }
    return null;
  };

  const resetForm = () => {
    setRecetaData({
      clave: "",
      nombre: "",
      materias_primas: [],
    });
    setEditingRecetas(null);
    setRecetaDetalle(null);
  };

  const handleInputChange = (field, value) => {
    setRecetaData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMateriaPrimaChange = (index, field, value) => {
    const updated = [...recetaData.materias_primas];
    updated[index][field] = value;
    setRecetaData((prev) => ({ ...prev, materias_primas: updated }));
  };

  const handleExistingMateriaPrimaChange = (materiaPrimaId, newCantidad) => {
    setRecetaDetalle((prev) => ({
      ...prev,
      materias_primas: prev.materias_primas.map((mp) =>
        mp.id === materiaPrimaId
          ? { ...mp, pivot: { ...mp.pivot, cantidad: newCantidad } }
          : mp
      ),
    }));
  };

  const removeExistingMateriaPrima = (materiaPrimaId) => {
    Alert.alert(
      "Eliminar Materia Prima",
      "¿Estás seguro de que deseas eliminar esta materia prima de la receta?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setRecetaDetalle((prev) => ({
              ...prev,
              materias_primas: prev.materias_primas.filter(
                (mp) => mp.id !== materiaPrimaId
              ),
            }));
          },
        },
      ]
    );
  };

  const addMateriaPrima = () => {
    setRecetaData((prev) => ({
      ...prev,
      materias_primas: [
        ...prev.materias_primas,
        { materia_prima_id: "", cantidad: "" },
      ],
    }));
  };

  const removeMateriaPrima = (index) => {
    const updated = recetaData.materias_primas.filter((_, i) => i !== index);
    setRecetaData((prev) => ({ ...prev, materias_primas: updated }));
  };

  const handleSubmit = () => {
    if (modalType === "crear") {
      handleCreate();
    } else {
      handleEdit();
    }
  };

  const handleCreate = async () => {
    if (!recetaData.clave || !recetaData.nombre) {
      Alert.alert("Error", "Por favor completa clave y nombre de la receta");
      return;
    }
    if (!token) {
      Alert.alert("Error", "Sesión expirada. Inicia sesión nuevamente.");
      navigation.navigate("Login");
      return;
    }
    const payload = {
      clave: recetaData.clave,
      nombre: recetaData.nombre,
      materias_primas: recetaData.materias_primas.map((mp) => ({
        id: mp.materia_prima_id,
        cantidad: parseFloat(mp.cantidad),
      })),
    };

    setIsLoading(true);
    try {
      await API.post("/restaurante/admin/recetas", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      Alert.alert("Éxito", "Receta creada exitosamente");
      setModalVisible(false);
      resetForm();
      fetchRecetas();
    } catch (error) {
      console.log(
        "Error al crear receta:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "No se pudo crear la receta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!token || !editingRecetas) return;
    setIsLoading(true);
    try {
      const materiasExistentes =
        recetaDetalle?.materias_primas?.map((mp) => ({
          materia_prima_id: mp.id,
          cantidad: mp.pivot.cantidad,
        })) || [];

      const dataToSend = {
        clave: recetaData.clave,
        nombre: recetaData.nombre,
        materias_primas: [...materiasExistentes, ...recetaData.materias_primas],
      };

      await API.put(
        `/restaurante/admin/recetas/${editingRecetas.id}`,
        dataToSend,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert("Éxito", "Receta actualizada exitosamente");
      setModalVisible(false);
      resetForm();
      fetchRecetas();
    } catch (error) {
      console.log(
        "Error al editar receta:",
        error.response?.data || error.message
      );
      Alert.alert("Error", "No se pudo actualizar la receta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Eliminar", "¿Deseas eliminar esta receta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/restaurante/admin/recetas/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert("Éxito", "Receta eliminada exitosamente");
            fetchRecetas();
          } catch (error) {
            console.log(
              "Error al eliminar receta:",
              error.response?.data || error.message
            );
            Alert.alert("Error", "No se pudo eliminar la receta");
          }
        },
      },
    ]);
  };

  const openCreateModal = () => {
    setModalType("crear");
    setModalVisible(true);
  };

  const openEditModal = async (item) => {
    setEditingRecetas(item);
    setModalType("editar");

    const detalle = await fetchRecetaDetalle(item.id);
    if (detalle) {
      setRecetaData({
        clave: detalle.clave,
        nombre: detalle.nombre,
        materias_primas: [],
      });
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Recetas</Text>

      <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
        <View style={styles.inlineContent}>
          <Image
            source={require("../../../../../assets/mas.png")}
            style={styles.icon}
          />
          <Text style={styles.createButtonText}>Agregar Receta</Text>
        </View>
      </TouchableOpacity>

      <ScrollView>
        {recetas.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemText}>
              #{item.id} - {item.clave} - {item.nombre}
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

        {recetas.length === 0 && (
          <Text style={styles.emptyText}>No hay recetas registradas.</Text>
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {modalType === "crear" ? "Agregar" : "Editar"} Receta
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Clave"
              value={recetaData.clave}
              onChangeText={(text) => handleInputChange("clave", text)}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              value={recetaData.nombre}
              onChangeText={(text) => handleInputChange("nombre", text)}
            />

            {/* Tabla de materias primas existentes (solo en modo editar) */}
            {modalType === "editar" &&
              recetaDetalle?.materias_primas &&
              recetaDetalle.materias_primas.length > 0 && (
                <View style={styles.existingMateriasContainer}>
                  <Text style={styles.sectionTitle}>
                    Materias Primas Actuales
                  </Text>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                      Materia Prima
                    </Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                      Cantidad
                    </Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                      Acciones
                    </Text>
                  </View>

                  {recetaDetalle.materias_primas.map((mp) => (
                    <View key={mp.id} style={styles.tableRow}>
                      <Text style={[styles.tableCellText, { flex: 2 }]}>
                        {mp.clave} - {mp.nombre}
                      </Text>
                      <TextInput
                        style={[styles.input, styles.tableInput, { flex: 1 }]}
                        value={mp.pivot.cantidad}
                        keyboardType="decimal-pad"
                        onChangeText={(text) =>
                          handleExistingMateriaPrimaChange(mp.id, text)
                        }
                      />
                      <TouchableOpacity
                        style={[styles.deleteButton, { flex: 1 }]}
                        onPress={() => removeExistingMateriaPrima(mp.id)}
                      >
                        <Text style={styles.deleteButtonText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

            {/* Sección para agregar nuevas materias primas */}
            <Text style={styles.sectionTitle}>
              {modalType === "editar"
                ? "Agregar Nuevas Materias Primas"
                : "Materias Primas"}
            </Text>

            {recetaData.materias_primas.map((mp, index) => (
              <View key={index} style={styles.materiaPrimaRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ marginBottom: 4 }}>Materia Prima</Text>
                  <Picker
                    selectedValue={mp.materia_prima_id}
                    onValueChange={(value) =>
                      handleMateriaPrimaChange(index, "materia_prima_id", value)
                    }
                  >
                    <Picker.Item label="Selecciona" value="" />
                    {materiasPrimas.map((mp) => (
                      <Picker.Item
                        key={mp.id}
                        label={`${mp.clave} - ${mp.nombre}`}
                        value={mp.id}
                      />
                    ))}
                  </Picker>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ marginBottom: 4 }}>Cantidad</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Cantidad"
                    keyboardType="decimal-pad"
                    value={mp.cantidad}
                    onChangeText={(text) =>
                      handleMateriaPrimaChange(index, "cantidad", text)
                    }
                  />
                </View>

                <TouchableOpacity
                  onPress={() => removeMateriaPrima(index)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={addMateriaPrima}
            >
              <Text style={styles.addButtonText}>➕ Agregar Materia Prima</Text>
            </TouchableOpacity>

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
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
  },
  actions: {
    flexDirection: "row",
  },
  editButton: {
    backgroundColor: "#2196F3",
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    color: "white",
  },
  deleteButton: {
    backgroundColor: "#f44336",
    padding: 8,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 32,
  },
  modalContainer: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 8,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "white",
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  existingMateriasContainer: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 4,
  },
  tableHeaderText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tableCellText: {
    textAlign: "center",
  },
  tableInput: {
    marginBottom: 0,
    marginHorizontal: 4,
  },
  materiaPrimaRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },
  addButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  addButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
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
