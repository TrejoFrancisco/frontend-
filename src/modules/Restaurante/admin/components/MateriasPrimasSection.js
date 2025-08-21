import * as DocumentPicker from "expo-document-picker";

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
  const [archivoCSV, setArchivoCSV] = useState(null);

  const handleSeleccionarArchivo = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/plain", "application/csv"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) {
        console.log("Selección cancelada");
        return;
      }

      const archivo = res.assets[0];

      // Validar tamaño del archivo (máximo 2MB como en el backend)
      if (archivo.size > 2048 * 1024) {
        Alert.alert("Error", "El archivo es muy grande. Máximo 2MB permitido.");
        return;
      }

      // Validar extensión
      const extension = archivo.name.split(".").pop().toLowerCase();
      if (!["csv", "txt"].includes(extension)) {
        Alert.alert("Error", "Solo se permiten archivos .csv o .txt");
        return;
      }

      setArchivoCSV(archivo);
      Alert.alert(
        "Archivo seleccionado",
        `${archivo.name} (${(archivo.size / 1024).toFixed(2)} KB)`
      );
    } catch (error) {
      console.log("Error al seleccionar archivo:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo.");
    }
  };

  const handleImportCsv = async () => {
    if (!archivoCSV) {
      Alert.alert("Error", "Primero selecciona un archivo CSV.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(archivoCSV.uri);
      const fileContent = await response.text();

      console.log(
        "Contenido del archivo (primeras 200 chars):",
        fileContent.substring(0, 200)
      );

      // Crear un Blob del contenido
      const blob = new Blob([fileContent], { type: "text/csv" });

      const formData = new FormData();
      formData.append("csv_file", blob, archivoCSV.name);

      const baseURL = API.defaults.baseURL || "";
      const url = `${baseURL}/restaurante/admin/materias-primas/import-csv`;

      const uploadResponse = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await uploadResponse.json();
      setArchivoCSV(null);
    } catch (error) {
      console.log("Error en alternativa 1:", error);
      Alert.alert("Error", "No se pudo importar el archivo CSV.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Materias Primas</Text>

      <TouchableOpacity style={styles.createButton} onPress={openCreateModal}>
        <View style={styles.inlineContent}>
          <Image
            source={require("../../../../../assets/mas.png")}
            style={styles.icon}
          />
          <Text style={styles.createButtonText}>Agregar Materia Prima</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleSeleccionarArchivo}
      >
        <View style={styles.inlineContent}>
          <Text style={styles.createButtonText}>Seleccionar archivo CSV</Text>
        </View>
      </TouchableOpacity>

      {archivoCSV && (
        <Text style={{ marginTop: 5, fontStyle: "italic" }}>
          Archivo seleccionado: {archivoCSV.name}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.createButton,
          { backgroundColor: archivoCSV ? "#28a745" : "#ccc" },
        ]}
        onPress={handleImportCsv}
        disabled={!archivoCSV || isLoading}
      >
        <View style={styles.inlineContent}>
          <Text style={styles.createButtonText}>
            {isLoading ? "Importando..." : "Importar materias primas"}
          </Text>
        </View>
      </TouchableOpacity>

      <ScrollView>
        {materiasPrimas.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemText}>
              #{item.id} - {item.clave} - {item.nombre}
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Image
                  source={require("../../../../../assets/editarr.png")}
                  style={styles.icon}
                  accessibilityLabel="Editar"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Image
                  source={require("../../../../../assets/eliminar.png")}
                  style={styles.icon}
                  accessibilityLabel="Eliminar"
                />
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
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: "#F5F5F5" 
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
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
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
  },
  editButton: {
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    marginTop: 32,
  },
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 8,
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
