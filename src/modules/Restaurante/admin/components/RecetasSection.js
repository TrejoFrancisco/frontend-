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
  const [busquedaReceta, setBusquedaReceta] = useState("");

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

  // Función para obtener la unidad de una materia prima
  const getUnidadMateriaPrima = (materiaPrimaId) => {
    const materiaPrima = materiasPrimas.find(
      (mp) => mp.id === parseInt(materiaPrimaId)
    );
    return materiaPrima ? materiaPrima.unidad : "";
  };

  // Función para filtrar recetas por búsqueda
  const getRecetasFiltradas = () => {
    if (!busquedaReceta.trim()) return recetas;

    return recetas.filter(
      (receta) =>
        receta.nombre.toLowerCase().includes(busquedaReceta.toLowerCase()) ||
        receta.clave.toLowerCase().includes(busquedaReceta.toLowerCase())
    );
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

  const recetasFiltradas = getRecetasFiltradas();
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

      <View style={styles.listContainer}>
        {/* Buscador de recetas */}
        <TextInput
          style={[styles.buscadorInput, styles.buscadorReceta]}
          placeholder="Buscar por clave o nombre..."
          value={busquedaReceta}
          onChangeText={setBusquedaReceta}
        />

        {/* Encabezado de la tabla */}
        <View style={styles.tableHeader1}>
          <Text style={[styles.tableHeaderText1, styles.idColumn]}>ID</Text>
          <Text style={[styles.tableHeaderText1, styles.claveColumn]}>Clave</Text>
          <Text style={[styles.tableHeaderText1, styles.nombreColumn]}>Nombre</Text>
          <View style={[styles.actionsColumn1, styles.headerActionsContainer]}>
            <Text style={styles.tableHeaderText1} numberOfLines={2}>Acciones</Text>
          </View>
        </View>

        {/* Filas de la tabla */}
        <ScrollView style={styles.tableBody}>
          {recetasFiltradas.map((item) => (
            <View key={item.id} style={styles.tableRow1}>
              <Text style={[styles.tableCellText1, styles.idColumn]}>{item.id}</Text>
              <Text style={[styles.tableCellText1, styles.claveColumn]}>{item.clave}</Text>
              <Text style={[styles.tableCellText1, styles.nombreColumn]}>{item.nombre}</Text>
              <View style={[styles.actionsColumn1, styles.actionsContainer]}>
                <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                  <Image
                    source={require("../../../../../assets/editarr.png")}
                    style={styles.iconI}
                    accessibilityLabel="Editar receta"
                  />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
                  <Image
                    source={require("../../../../../assets/eliminar.png")}
                    style={styles.iconI}
                    accessibilityLabel="Eliminar receta"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Mensajes si no hay resultados */}
        {recetasFiltradas.length === 0 && busquedaReceta.trim() !== "" && (
          <Text style={styles.emptyText}>No se encontraron recetas que coincidan con la búsqueda.</Text>
        )}
        {recetasFiltradas.length === 0 && busquedaReceta.trim() === "" && (
          <Text style={styles.emptyText}>No hay recetas registradas.</Text>
        )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainerFixed}>
            <Text style={styles.modalTitle}>
              {modalType === "crear" ? "Agregar" : "Editar"} Receta
            </Text>

            <ScrollView style={styles.scrollableContent}>
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

              {/* MATERIAS PRIMAS ACTUALES */}
              {modalType === "editar" &&
                recetaDetalle?.materias_primas &&
                recetaDetalle.materias_primas.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>
                      Materias Primas Actuales
                    </Text>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                        Materia Prima
                      </Text>
                      <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>
                        Cantidad
                      </Text>
                      <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                        Acciones
                      </Text>
                    </View>

                    <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                      {recetaDetalle.materias_primas.map((mp) => (
                        <View key={mp.id} style={styles.tableRow}>
                          <Text style={[styles.tableCellText, { flex: 2 }]}>
                            {mp.clave} - {mp.nombre}
                          </Text>
                          <View style={[{ flex: 2 }]}>
                            <View style={styles.cantidadContainer}>
                              <TextInput
                                style={[styles.input, styles.cantidadInput]}
                                value={mp.pivot.cantidad}
                                keyboardType="decimal-pad"
                                onChangeText={(text) =>
                                  handleExistingMateriaPrimaChange(mp.id, text)
                                }
                              />
                              <Text style={styles.unidadText}>{mp.unidad}</Text>
                            </View>
                          </View>
                          <TouchableOpacity
                            style={[styles.deleteButton, { flex: 1 }]}
                            onPress={() => removeExistingMateriaPrima(mp.id)}
                          >
                            <Image
                              source={require("../../../../../assets/eliminar.png")}
                              style={styles.icon}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}

              {/* NUEVAS MATERIAS PRIMAS */}
              <Text style={styles.sectionTitle}>
                {modalType === "editar"
                  ? "Agregar Nuevas Materias Primas"
                  : "Materias Primas"}
              </Text>

              <View style={{ maxHeight: 250 }}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  {recetaData.materias_primas.map((mp, index) => (
                    <View key={index} style={styles.newRowContainer}>
                      <View style={styles.newRowLabels}>
                        <Text style={{ fontWeight: "bold", flex: 2 }}>Materia Prima</Text>
                        <Text style={{ fontWeight: "bold", flex: 1.5 }}>Cantidad</Text>
                      </View>

                      <View style={styles.newRowControls}>
                        <View style={styles.newPicker}>
                          <Picker
                            selectedValue={mp.materia_prima_id}
                            onValueChange={(value) =>
                              handleMateriaPrimaChange(index, "materia_prima_id", value)
                            }
                            style={styles.picker} // ← Este es el cambio clave
                          >
                            <Picker.Item label="Selecciona" value="" />
                            {materiasPrimas.map((item) => (
                              <Picker.Item
                                key={item.id}
                                label={`${item.clave} - ${item.nombre}`}
                                value={item.id}
                              />
                            ))}
                          </Picker>
                        </View>

                        <View style={styles.newCantidadWrapper}>
                          <TextInput
                            style={styles.newCantidadInput}
                            placeholder="Cantidad"
                            keyboardType="decimal-pad"
                            value={mp.cantidad}
                            onChangeText={(text) =>
                              handleMateriaPrimaChange(index, "cantidad", text)
                            }
                          />
                          <Text style={styles.newUnidadText}>
                            {getUnidadMateriaPrima(mp.materia_prima_id)}
                          </Text>
                        </View>

                        <TouchableOpacity onPress={() => removeMateriaPrima(index)} style={styles.newDeleteButton}>
                          <Image
                            source={require("../../../../../assets/eliminar.png")}
                            style={styles.icon}
                            resizeMode="contain"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={addMateriaPrima}
              >
                <Image
                  source={require("../../../../../assets/agreg.png")}
                  style={styles.iconI}
                />
                <Text style={styles.addButtonText}>Agregar Materia Prima</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* BOTONES FIJOS */}
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
  // ========================================
  // CONTENEDOR PRINCIPAL
  // ========================================
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },

  // ========================================
  // TÍTULO Y BOTÓN PRINCIPAL
  // ========================================
  title: {
    fontSize: 30,
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
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },

  // ========================================
  // CONTENEDOR DE LISTA Y TABLA
  // ========================================
  listContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },

  // ========================================
  // BUSCADOR
  // ========================================
  buscadorInput: {
    borderWidth: 1,
    borderColor: "#2D9966",
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    fontSize: 18,
    backgroundColor: "#ECFDF5",
  },
  buscadorReceta: {
    backgroundColor: "#f0f8f0",
    borderColor: "#28a745",
  },

  // ========================================
  // TABLA DE RECETAS
  // ========================================
  // Encabezado
  tableHeader1: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#CCCCCC",
  },
  tableHeaderText1: {
    fontWeight: "bold",
    fontSize: 19,
    color: "#333333",
    flexWrap: "wrap",
  },
  headerActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },

  // Cuerpo de la tabla
  tableBody: {
    maxHeight: '80%',
  },
  tableRow1: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
      
  },
  tableCellText1: {
    fontSize: 17,
    color: '#444',
    flexWrap: 'wrap',
  },

  // Columnas específicas
  idColumn: {
    flex: 1,
    textAlign: 'center',
  },
  claveColumn: {
    flex: 2,
    paddingHorizontal: 4,
  },
  nombreColumn: {
    flex: 2,
    paddingHorizontal: 4,
  },
  actionsColumn1: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ========================================
  // BOTONES DE ACCIÓN
  // ========================================
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
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

  // ========================================
  // MODAL
  // ========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainerFixed: {
    backgroundColor: "white",
    width: "90%",
    maxHeight: "90%",
    borderRadius: 10,
    padding: 16,
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  scrollableContent: {
    flexGrow: 1,
    marginBottom: 16,
  },

  // ========================================
  // INPUTS Y FORMULARIOS
  // ========================================
  input: {
    fontSize: 18,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 11,
    marginBottom: 10,
    backgroundColor: "white",
  },
  picker: {
    borderColor: "#ccc",
    borderRadius: 8,
    flex: 1,
    height: 60,
  },

  // ========================================
  // SECCIONES DEL MODAL
  // ========================================
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    marginTop: 16,
  },

  // ========================================
  // MATERIAS PRIMAS EXISTENTES (MODAL EDITAR)
  // ========================================
  existingMateriasContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  tableCellText: {
    fontSize: 14,
    textAlign: "center",
  },
  cantidadContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cantidadInput: {
    flex: 1,
    marginRight: 8,
  },
  unidadText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
    minWidth: 40,
    textAlign: "center",
  },

  // ========================================
  // NUEVAS MATERIAS PRIMAS (MODAL)
  // ========================================
  newRowContainer: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  newRowLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  newRowControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  newPicker: {
    flex: 2,
    marginRight: 12,
    borderRadius: 8,
  },
  newCantidadWrapper: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  newCantidadInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  newUnidadText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#555",
  },
  newDeleteButton: {
    padding: 6,
  },

  // ========================================
  // BOTÓN AGREGAR MATERIA PRIMA
  // ========================================
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffaa29ff",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 17,
    color: "#ffffffff",
    textAlign: "center",
    fontWeight: "bold",
  },

  // ========================================
  // BOTONES DEL MODAL
  // ========================================
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
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

  // ========================================
  // ICONOS
  // ========================================
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  iconI: {
    alignItems: "center",
    width: 30,
    height: 30,
    resizeMode: "contain",
    marginRight: 2,
  },

  // ========================================
  // MENSAJES Y TEXTOS
  // ========================================
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#888',
    fontStyle: 'italic',
  },
});