import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";

import * as Sharing from "expo-sharing";

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
import { Buffer } from "buffer";
import { API } from "../../../../services/api";

export default function MateriaPrimaSection({ token, navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [busquedaMateria, setBusquedaMateria] = useState("");
  const [archivoCSV, setArchivoCSV] = useState(null);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

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
        setPaginaActual(1); // Reset a la primera página
      }
    } catch (error) {
      console.log("Error al obtener materias primas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
    }
  };

  const getMateriasPrimasFiltradas = () => {
    if (!busquedaMateria.trim()) return materiasPrimas;

    return materiasPrimas.filter(
      (materia) =>
        materia.nombre.toLowerCase().includes(busquedaMateria.toLowerCase()) ||
        materia.clave.toLowerCase().includes(busquedaMateria.toLowerCase())
    );
  };

  // Función para obtener materias paginadas
  const getMateriasPaginadas = () => {
    const filtradas = getMateriasPrimasFiltradas();
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return filtradas.slice(inicio, fin);
  };

  // Calcular total de páginas
  const getTotalPaginas = () => {
    const filtradas = getMateriasPrimasFiltradas();
    return Math.ceil(filtradas.length / itemsPorPagina);
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

      if (archivo.size > 2048 * 1024) {
        Alert.alert("Error", "El archivo es muy grande. Máximo 2MB permitido.");
        return;
      }

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

      if (uploadResponse.ok && responseData.success) {
        Alert.alert(
          "Éxito",
          `Se importaron ${responseData.data.total_procesadas
          } materias primas.${responseData.data.errores_encontrados > 0
            ? ` Con ${responseData.data.errores_encontrados} errores.`
            : ""
          }`
        );
        fetchMateriasPrimas();
      } else {
        Alert.alert(
          "Error",
          responseData.error?.message || "No se pudo importar el archivo"
        );
      }

      setArchivoCSV(null);
    } catch (error) {
      console.log("Error al importar:", error);
      Alert.alert("Error", "No se pudo importar el archivo CSV.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDescargarPlantilla = async () => {
    setIsLoading(true);
    try {
      const response = await API.get(
        "/restaurante/admin/materias-primas/download-template",
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "arraybuffer",
        }
      );

      // Convertir el contenido binario a base64
      const base64String = Buffer.from(response.data, "binary").toString(
        "base64"
      );

      // Crear ruta temporal del archivo
      const fileUri =
        FileSystem.cacheDirectory +
        `plantilla_materias_primas_${Date.now()}.csv`;

      // Guardar el archivo temporalmente
      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: "base64", // cambio aquí
      });

      // Verificar si Sharing está disponible
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Éxito", "Plantilla descargada correctamente");
      }
    } catch (error) {
      console.log("Error al descargar plantilla:", error);
      Alert.alert("Error", "No se pudo descargar la plantilla CSV");
    } finally {
      setIsLoading(false);
    }
  };

  const materiasPaginadas = getMateriasPaginadas();
  const totalPaginas = getTotalPaginas();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Materias Primas</Text>

      {/* Botón Agregar */}
      <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
        <View style={styles.buttonContent}>
          <Image
            source={require("../../../../../assets/mas.png")}
            style={styles.buttonIcon}
          />
          <Text style={styles.primaryButtonText}>Agregar Materia Prima</Text>
        </View>
      </TouchableOpacity>

      {/* Fila de botones CSV */}
      <View style={styles.csvButtonsRow}>
        <TouchableOpacity
          style={styles.templateButton}
          onPress={handleDescargarPlantilla}
          disabled={isLoading}
        >
          <Text style={styles.templateButtonText}>
            {isLoading ? "Descargando..." : "📥 Descargar Plantilla"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectButton}
          onPress={handleSeleccionarArchivo}
        >
          <Text style={styles.selectButtonText}>📂 Seleccionar CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Archivo seleccionado */}
      {archivoCSV && (
        <View style={styles.selectedFileContainer}>
          <Text style={styles.selectedFileText}>
            ✓ {archivoCSV.name} ({(archivoCSV.size / 1024).toFixed(2)} KB)
          </Text>
        </View>
      )}

      {/* Botón Importar */}
      <TouchableOpacity
        style={[
          styles.importButton,
          { backgroundColor: archivoCSV ? "#28A745" : "#CCCCCC" },
        ]}
        onPress={handleImportCsv}
        disabled={!archivoCSV || isLoading}
      >
        <Text style={styles.importButtonText}>
          {isLoading ? "Importando..." : "Importar materias primas"}
        </Text>
      </TouchableOpacity>

      {/* Lista de materias primas */}
      <View style={styles.listContainer}>
        {/* Buscador */}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por clave o nombre..."
          value={busquedaMateria}
          onChangeText={(text) => {
            setBusquedaMateria(text);
            setPaginaActual(1); // Reset a primera página al buscar
          }}
        />

        {/* Encabezado de tabla */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.idColumn]}>ID</Text>
          <Text style={[styles.tableHeaderText, styles.claveColumn]}>
            Clave
          </Text>
          <Text style={[styles.tableHeaderText, styles.nombreColumn]}>
            Nombre
          </Text>
          <View style={[styles.actionsColumn, styles.headerActionsContainer]}>
            <Text style={styles.tableHeaderText} numberOfLines={2}>
              Acciones
            </Text>
          </View>
        </View>

        {/* Cuerpo de tabla con ScrollView */}
        <ScrollView style={styles.tableBody} nestedScrollEnabled={true}>
          {materiasPaginadas.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCellText, styles.idColumn]}>
                {item.id}
              </Text>
              <Text
                style={[styles.tableCellText, styles.claveColumn]}
                numberOfLines={2}
              >
                {item.clave}
              </Text>
              <Text
                style={[styles.tableCellText, styles.nombreColumn]}
                numberOfLines={2}
              >
                {item.nombre}
              </Text>
              <View style={[styles.actionsColumn, styles.actionsContainer]}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(item)}
                >
                  <Image
                    source={require("../../../../../assets/editarr.png")}
                    style={styles.actionIcon}
                    accessibilityLabel="Editar materia prima"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item.id)}
                >
                  <Image
                    source={require("../../../../../assets/eliminar.png")}
                    style={styles.actionIcon}
                    accessibilityLabel="Eliminar materia prima"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Mensajes vacíos */}
        {getMateriasPrimasFiltradas().length === 0 && (
          <Text style={styles.emptyText}>
            {busquedaMateria.trim() !== ""
              ? "No se encontraron materias primas que coincidan con la búsqueda."
              : "No hay materias primas registradas."}
          </Text>
        )}

        {/* Controles de paginación */}
        {getMateriasPrimasFiltradas().length > 0 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                paginaActual === 1 && styles.paginationButtonDisabled,
              ]}
              onPress={() => setPaginaActual(paginaActual - 1)}
              disabled={paginaActual === 1}
            >
              <Text style={styles.paginationButtonText}>← Anterior</Text>
            </TouchableOpacity>

            <View style={styles.paginationInfo}>
              <Text style={styles.paginationText}>
                Página {paginaActual} de {totalPaginas}
              </Text>
              <Text style={styles.paginationSubtext}>
                ({getMateriasPrimasFiltradas().length} registros)
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                paginaActual === totalPaginas &&
                styles.paginationButtonDisabled,
              ]}
              onPress={() => setPaginaActual(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
            >
              <Text style={styles.paginationButtonText}>Siguiente →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modal para crear/editar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {modalType === "crear" ? "Agregar" : "Editar"} Materia Prima
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Clave"
                placeholderTextColor="#888"
                value={formData.clave || undefined}
                onChangeText={(text) => handleInputChange("clave", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#888"
                value={formData.nombre || undefined}
                onChangeText={(text) => handleInputChange("nombre", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Unidad (ej. kg, lts)"
                placeholderTextColor="#888"
                value={formData.unidad || undefined}
                onChangeText={(text) => handleInputChange("unidad", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Costo unitario"
                placeholderTextColor="#888"
                keyboardType="decimal-pad"
                value={formData.costo_unitario || undefined}
                onChangeText={(text) => handleInputChange("costo_unitario", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Existencia"
                placeholderTextColor="#888"
                keyboardType="decimal-pad"
                value={formData.existencia || undefined}
                onChangeText={(text) => handleInputChange("existencia", text)}
              />


              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
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
  // === CONTENEDOR PRINCIPAL ===
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1F2937",
  },

  // === BOTONES PRINCIPALES ===
  primaryButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    width: 30,
    height: 30,
    marginRight: 8,
    resizeMode: "contain",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  // === FILA DE BOTONES CSV ===
  csvButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  templateButton: {
    flex: 1,
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectButton: {
    flex: 1,
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  templateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  // === BOTÓN IMPORTAR ===
  importButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  importButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  // === ARCHIVO SELECCIONADO ===
  selectedFileContainer: {
    backgroundColor: "#E8F5E9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  selectedFileText: {
    color: "#2E7D32",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },

  // === BÚSQUEDA ===
  searchInput: {
    backgroundColor: "#F0F8F0",
    borderColor: "#28A745",
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    fontSize: 18,
  },

  // === CONTENEDOR DE LISTA ===
  listContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },

  // === TABLA ===
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
  tableBody: {
    maxHeight: 400,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#EEEEEE",
    alignItems: "center",
  },
  tableCellText: {
    fontSize: 17,
    color: "#444444",
    flexWrap: "wrap",
  },

  // === COLUMNAS DE TABLA ===
  idColumn: {
    flex: 1,
    textAlign: "center",
  },
  claveColumn: {
    flex: 2,
    paddingHorizontal: 4,
  },
  nombreColumn: {
    flex: 2,
    paddingHorizontal: 4,
  },
  actionsColumn: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },

  // === BOTONES DE ACCIÓN ===
  editButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  actionIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },

  // === PAGINACIÓN ===
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: "#EEEEEE",
    backgroundColor: "#FAFAFA",
    marginTop: 10,
  },
  paginationButton: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    minWidth: 100,
  },
  paginationButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  paginationButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  paginationInfo: {
    alignItems: "center",
  },
  paginationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  paginationSubtext: {
    fontSize: 12,
    color: "#666666",
    marginTop: 2,
  },

  // === TEXTO VACÍO ===
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    color: "#888888",
    fontStyle: "italic",
    fontSize: 16,
  },

  // === MODAL ===
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 16,
    textAlign: "center",
  },

  // === INPUTS ===
  input: {
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  // === BOTONES DEL MODAL ===
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 10,
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
  submitButton: {
    backgroundColor: "#28A745",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
