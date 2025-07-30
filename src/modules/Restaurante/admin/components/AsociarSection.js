import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { API } from "../../../../services/api";

export default function UsuariosCocinaSection({ token, navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchUsuarios(), fetchCategorias()]);
  };

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await API.get("/restaurante/admin/usuarios", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUsuarios(response.data.data);
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.error?.message ||
            "Error al obtener los usuarios"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await API.get("/restaurante/admin/categorias", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCategorias(response.data.data);
      }
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message ||
          "Error al obtener las categorías"
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const abrirModalAgregar = (usuario) => {
    setSelectedUser(usuario);
    setSelectedCategoriaId("");
    setEditMode(false);
    setModalVisible(true);
  };

  const abrirModalEditar = (usuario) => {
    setSelectedUser(usuario);
    // Usar la categoría actual del usuario
    const categoriaActual = usuario.categoria_encargado_id || "";
    setSelectedCategoriaId(categoriaActual.toString());
    setEditMode(true);
    setModalVisible(true);
  };

  const guardarAsociacion = async () => {
    if (!selectedCategoriaId) {
      Alert.alert("Error", "Debe seleccionar una categoría");
      return;
    }

    try {
      const dataToSend = {
        categoria_id: parseInt(selectedCategoriaId),
        user_id: selectedUser.id,
      };

      let response;
      if (editMode) {
        // Para editar, usamos el ID de la asociación que viene del backend
        const asociacionId = selectedUser.asociacion_id;
        response = await API.put(
          `/restaurante/admin/usuarios/${asociacionId}`,
          dataToSend,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        response = await API.post("/restaurante/admin/usuarios", dataToSend, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (response.data.success) {
        Alert.alert(
          "Éxito",
          editMode
            ? "Categoría actualizada correctamente"
            : "Categoría asignada correctamente"
        );
        setModalVisible(false);
        await fetchUsuarios(); // Recargar la lista
      }
    } catch (error) {
      console.error("Error al guardar asociación:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error?.message || "Error al guardar la asociación"
      );
    }
  };

  const eliminarAsociacion = (usuario) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de que deseas eliminar la categoría asignada a "${usuario.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const asociacionId = usuario.asociacion_id;
              const response = await API.delete(
                `/restaurante/admin/usuarios/${asociacionId}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.data.success) {
                Alert.alert("Éxito", "Categoría eliminada correctamente");
                await fetchUsuarios();
              }
            } catch (error) {
              console.error("Error al eliminar asociación:", error);
              Alert.alert(
                "Error",
                error.response?.data?.error?.message ||
                  "Error al eliminar la asociación"
              );
            }
          },
        },
      ]
    );
  };

  const renderUsuarioItem = (usuario) => {
    const tieneCategoria = usuario.categoria_encargado_id;

    return (
      <View key={usuario.id} style={styles.usuarioCard}>
        <View style={styles.usuarioHeader}>
          <Text style={styles.usuarioName}>{usuario.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: tieneCategoria ? "#28a745" : "#ffc107" },
            ]}
          >
            <Text style={styles.statusText}>
              {tieneCategoria ? "Asignado" : "Sin asignar"}
            </Text>
          </View>
        </View>

        <View style={styles.usuarioDetails}>
          <Text style={styles.usuarioDetail}>Email: {usuario.email}</Text>
          <Text style={styles.usuarioDetail}>
            Categoría: {usuario.categoria_nombre || "Sin categoría asignada"}
          </Text>
          <Text style={styles.usuarioDetail}>Rol: Cocina</Text>
        </View>

        <View style={styles.usuarioActions}>
          {!tieneCategoria ? (
            // Mostrar solo botón "Agregar" si no tiene categoría
            <TouchableOpacity
              style={[styles.actionButton, styles.addButton]}
              onPress={() => abrirModalAgregar(usuario)}
            >
              <Text style={styles.actionButtonText}>➕ Agregar Categoría</Text>
            </TouchableOpacity>
          ) : (
            // Mostrar botones "Editar" y "Eliminar" si tiene categoría
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => abrirModalEditar(usuario)}
              >
                <Text style={styles.actionButtonText}>✏️ Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => eliminarAsociacion(usuario)}
              >
                <Text style={styles.actionButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Gestión de Cocineros</Text>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{usuarios.length}</Text>
            <Text style={styles.statLabel}>Total Cocineros</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {usuarios.filter((u) => u.categoria_encargado_id).length}
            </Text>
            <Text style={styles.statLabel}>Con Categoría</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {usuarios.filter((u) => !u.categoria_encargado_id).length}
            </Text>
            <Text style={styles.statLabel}>Sin Asignar</Text>
          </View>
        </View>

        {/* Lista de usuarios */}
        <View style={styles.usuariosList}>
          {usuarios.length === 0 ? (
            <Text style={styles.emptyText}>No hay cocineros registrados</Text>
          ) : (
            usuarios.map((usuario) => renderUsuarioItem(usuario))
          )}
        </View>
      </ScrollView>

      {/* Modal para Agregar/Editar Categoría */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editMode ? "Editar Categoría" : "Asignar Categoría"}
              </Text>

              <Text style={styles.modalSubtitle}>
                Usuario: {selectedUser?.name}
              </Text>

              <Text style={styles.label}>Seleccionar Categoría</Text>
              <Picker
                selectedValue={selectedCategoriaId}
                onValueChange={(value) => setSelectedCategoriaId(value)}
                style={styles.picker}
              >
                <Picker.Item label="Selecciona una categoría" value="" />
                {categorias.map((categoria) => (
                  <Picker.Item
                    key={categoria.id}
                    label={categoria.nombre}
                    value={categoria.id.toString()}
                  />
                ))}
              </Picker>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={guardarAsociacion}
                >
                  <Text style={styles.submitButtonText}>
                    {editMode ? "Actualizar" : "Asignar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  loadingText: {
    fontSize: 18,
    color: "#6c757d",
  },
  refreshButton: {
    backgroundColor: "#17a2b8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    minWidth: 80,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007bff",
  },
  statLabel: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6c757d",
    fontStyle: "italic",
    marginVertical: 20,
  },
  usuariosList: {
    paddingBottom: 20,
  },
  usuarioCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  usuarioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  usuarioName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    color: "#2c3e50",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  usuarioDetails: {
    marginBottom: 15,
  },
  usuarioDetail: {
    fontSize: 14,
    marginBottom: 5,
    color: "#495057",
  },
  usuarioActions: {
    alignItems: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 120,
    alignItems: "center",
    marginHorizontal: 5,
  },
  addButton: {
    backgroundColor: "#28a745",
  },
  editButton: {
    backgroundColor: "#ffc107",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#2c3e50",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#6c757d",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
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
