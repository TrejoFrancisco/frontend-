import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import React, { useState, useEffect, useCallback } from "react";
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
        setPaginaActual(1);
      }
    } catch (error) {
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

  const getMateriasPaginadas = () => {
    const filtradas = getMateriasPrimasFiltradas();
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return filtradas.slice(inicio, fin);
  };

  const getTotalPaginas = () => {
    const filtradas = getMateriasPrimasFiltradas();
    return Math.ceil(filtradas.length / itemsPorPagina);
  };

  const obtenerNumerosPagina = () => {
    const totalPaginas = getTotalPaginas();
    const numeros = [];
    const maxVisible = 5;

    if (totalPaginas <= maxVisible) {
      for (let i = 1; i <= totalPaginas; i++) {
        numeros.push(i);
      }
    } else {
      if (paginaActual <= 3) {
        for (let i = 1; i <= 4; i++) {
          numeros.push(i);
        }
        numeros.push("...");
        numeros.push(totalPaginas);
      } else if (paginaActual >= totalPaginas - 2) {
        numeros.push(1);
        numeros.push("...");
        for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
          numeros.push(i);
        }
      } else {
        numeros.push(1);
        numeros.push("...");
        for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
          numeros.push(i);
        }
        numeros.push("...");
        numeros.push(totalPaginas);
      }
    }

    return numeros;
  };

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginaSiguiente = () => {
    const totalPaginas = getTotalPaginas();
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const paginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
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
      Alert.alert("Error", "No se pudo actualizar la materia prima");
    } finally {
      setIsLoading(false);
    }
  };

  const construirMensajeDetalladoEliminacion = (errorData) => {
    if (!errorData || !errorData.relaciones) {
      return "La materia prima está siendo utilizada y no puede ser eliminada.";
    }

    let mensaje = errorData.details + "\n\n";
    const relaciones = errorData.relaciones;

    // Detallar recetas
    if (relaciones.recetas && relaciones.recetas.length > 0) {
      mensaje += "📋 RECETAS:\n";
      relaciones.recetas.forEach((receta, index) => {
        mensaje += `${index + 1}. ${receta.receta_nombre} (${
          receta.receta_clave
        })\n`;
      });
      mensaje += "\n";
    }

    // Detallar productos
    if (relaciones.productos && relaciones.productos.length > 0) {
      mensaje += "🍽️ PRODUCTOS:\n";
      relaciones.productos.forEach((producto, index) => {
        mensaje += `${index + 1}. ${producto.producto_nombre} (${
          producto.producto_clave
        })\n`;
      });
      mensaje += "\n";
    }

    // Detallar movimientos de inventario
    if (relaciones.movimientos_inventario) {
      mensaje += `📦 INVENTARIO:\n${relaciones.movimientos_inventario.total_movimientos} movimiento(s) registrado(s)\n\n`;
    }

    mensaje +=
      "⚠️ Debes eliminar primero estas referencias antes de eliminar la materia prima.";

    return mensaje;
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar esta materia prima?",
      [
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
              // Verificar si es el error específico de materia prima en uso
              if (
                error.response?.status === 409 &&
                error.response?.data?.error?.code === "MATERIA_PRIMA_EN_USO"
              ) {
                const errorData = error.response.data.error;
                const mensajeDetallado =
                  construirMensajeDetalladoEliminacion(errorData);

                Alert.alert(
                  "No se puede eliminar",
                  mensajeDetallado,
                  [{ text: "Entendido", style: "default" }],
                  { cancelable: true }
                );
              } else {
                // Error genérico
                Alert.alert(
                  "Error",
                  error.response?.data?.error?.message ||
                    "No se pudo eliminar la materia prima"
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
          `Se importaron ${
            responseData.data.total_procesadas
          } materias primas.${
            responseData.data.errores_encontrados > 0
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

      const base64String = Buffer.from(response.data, "binary").toString(
        "base64"
      );

      const fileUri =
        FileSystem.cacheDirectory +
        `plantilla_materias_primas_${Date.now()}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, base64String, {
        encoding: "base64",
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Éxito", "Plantilla descargada correctamente");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo descargar la plantilla CSV");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPaginacion = () => {
    const materiasFiltradas = getMateriasPrimasFiltradas();
    const totalPaginas = getTotalPaginas();

    if (materiasFiltradas.length === 0) return null;

    return (
      <View style={styles.paginacionContainer}>
        <TouchableOpacity
          style={[
            styles.paginacionBoton,
            paginaActual === 1 && styles.paginacionBotonDisabled,
          ]}
          onPress={paginaAnterior}
          disabled={paginaActual === 1}
        >
          <Text style={styles.paginacionTexto}>←</Text>
        </TouchableOpacity>

        <View style={styles.paginacionNumeros}>
          {obtenerNumerosPagina().map((numero, index) => {
            if (numero === "...") {
              return (
                <Text key={`dots-${index}`} style={styles.paginacionPuntos}>
                  ...
                </Text>
              );
            }
            return (
              <TouchableOpacity
                key={numero}
                style={[
                  styles.paginacionNumero,
                  paginaActual === numero && styles.paginacionNumeroActivo,
                ]}
                onPress={() => cambiarPagina(numero)}
              >
                <Text
                  style={[
                    styles.paginacionNumeroTexto,
                    paginaActual === numero &&
                      styles.paginacionNumeroTextoActivo,
                  ]}
                >
                  {numero}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.paginacionBoton,
            paginaActual === totalPaginas && styles.paginacionBotonDisabled,
          ]}
          onPress={paginaSiguiente}
          disabled={paginaActual === totalPaginas}
        >
          <Text style={styles.paginacionTexto}>→</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const materiasPaginadas = getMateriasPaginadas();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestión de Materias Primas</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={openCreateModal}>
        <View style={styles.buttonContent}>
          <Image
            source={require("../../../../../assets/mas.png")}
            style={styles.buttonIcon}
          />
          <Text style={styles.primaryButtonText}>Agregar Materia Prima</Text>
        </View>
      </TouchableOpacity>

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

      {archivoCSV && (
        <View style={styles.selectedFileContainer}>
          <Text style={styles.selectedFileText}>
            ✓ {archivoCSV.name} ({(archivoCSV.size / 1024).toFixed(2)} KB)
          </Text>
        </View>
      )}

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

      <View style={styles.listContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por clave o nombre..."
          placeholderTextColor="#6B7280"
          value={busquedaMateria}
          onChangeText={(text) => {
            setBusquedaMateria(text);
            setPaginaActual(1);
          }}
        />

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

        {getMateriasPrimasFiltradas().length === 0 && (
          <Text style={styles.emptyText}>
            {busquedaMateria.trim() !== ""
              ? "No se encontraron materias primas que coincidan con la búsqueda."
              : "No hay materias primas registradas."}
          </Text>
        )}

        {renderPaginacion()}
      </View>

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
                onChangeText={(text) =>
                  handleInputChange("costo_unitario", text)
                }
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
  csvButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 10,
  },
  templateButton: {
    flex: 1,
    backgroundColor: "#ffb341ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectButton: {
    flex: 1,
    backgroundColor: "#4faaf4ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  templateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
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
  searchInput: {
    backgroundColor: "#F0F8F0",
    borderColor: "#28A745",
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    marginBottom: 12,
    fontSize: 18,
  },
  listContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
  },
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
  paginacionContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 10,
  },
  paginacionBoton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  paginacionBotonDisabled: {
    backgroundColor: "#ccc",
  },
  paginacionTexto: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  paginacionNumeros: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
  },
  paginacionNumero: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  paginacionNumeroActivo: {
    backgroundColor: "#4CAF50",
  },
  paginacionNumeroTexto: {
    fontSize: 16,
    color: "#333",
  },
  paginacionNumeroTextoActivo: {
    color: "#fff",
    fontWeight: "bold",
  },
  paginacionPuntos: {
    fontSize: 16,
    color: "#666",
    marginHorizontal: 4,
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    color: "#888888",
    fontStyle: "italic",
    fontSize: 16,
  },
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
