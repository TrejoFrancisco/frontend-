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
        await fetchUsuarios();
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
        <View style={styles.usuarioHeaderRow}>
          {/* Columna 1: Nombre */}
          <View style={styles.colItem}>
            <Text style={styles.usuarioLabel}>Nombre:</Text>
            <Text style={styles.usuarioName}>{usuario.name}</Text>
          </View>

          {/* Columna 2: Email */}
          <View style={styles.colItem}>
            <Text style={styles.usuarioLabel}>Email:</Text>
            <Text style={styles.usuarioDetail}>{usuario.email}</Text>
          </View>

          {/* Columna 3: Categoría */}
          <View style={styles.colItem}>
            <Text style={styles.usuarioLabel}>Categoría:</Text>
            <Text style={styles.usuarioDetail}>
              {usuario.categoria_nombre || "Sin categoría asignada"}
            </Text>
          </View>

          {/* Columna 4: Rol */}
          <View style={styles.colItem}>
            <Text style={styles.usuarioLabel}>Rol:</Text>
            <Text style={styles.usuarioDetail}>
              {usuario.rol === "cocina" ? "Cocina" : "Bartender"}
            </Text>
          </View>

          {/* Columna 5: Estado */}
          <View style={styles.colItem}>
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

          {/* Columna 6: Acciones */}
          <View style={styles.colItem}>
            {!tieneCategoria ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={() => abrirModalAgregar(usuario)}
              >
                <View style={styles.buttonContent}>
                  <Image
                    source={require("../../../../../assets/agreg.png")}
                    style={styles.iconImagen}
                  />
                  <Text style={styles.actionButtonText}>Agregar Categoría</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.usuarioActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => abrirModalEditar(usuario)}
                >
                  <Image
                    source={require("../../../../../assets/editarr.png")}
                    style={styles.iconImage}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={() => eliminarAsociacion(usuario)}
                >
                  <Image
                    source={require("../../../../../assets/eliminar.png")}
                    style={styles.iconImage}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
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
        <Text style={styles.title}>Gestión de Personal de Cocina</Text>

        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{usuarios.length}</Text>
            <Text style={styles.statLabel}>Total Personal</Text>
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
  // ===== CONTENEDOR PRINCIPAL =====
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

  // ===== TÍTULOS Y TEXTO =====
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#6c757d",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6c757d",
    fontStyle: "italic",
    marginVertical: 20,
  },

  // ===== ESTADÍSTICAS =====
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    minWidth: 80,
    flex: 1,
    marginHorizontal: 5,
    minHeight: 80,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    flexWrap: "wrap",
  },
  statLabel: {
    fontSize: 20,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },

  // ===== LISTA DE USUARIOS =====
  usuariosList: {
    paddingBottom: 20,
  },
  usuarioCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usuarioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  colItem: {
    flex: 1,
    minWidth: 150,
  },
  usuarioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 2,
  },
  usuarioName: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  usuarioDetail: {
    fontSize: 17,
  },

  // ===== ESTADO Y BADGES =====
  statusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#ffc107",
    alignSelf: 'flex-start',
  },
  statusText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },

  // ===== BOTONES DE ACCIÓN =====
  usuarioActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionButton: {
    padding: 5,
    borderRadius: 6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: "#ffffffff",
    fontSize: 15,
    fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#32b551ff",
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButton: {
    backgroundColor: "#f9ebc3ff",
    paddingHorizontal: 16,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: "#f9c3c3ff",
    paddingHorizontal: 16,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ===== ICONOS =====
  iconImagen: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  iconImage: {
    width: 27,
    height: 27,
  },

  // ===== MODAL =====
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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#2c3e50",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#6c757d",
  },

  // ===== FORMULARIO DEL MODAL =====
  label: {
    fontSize: 15,
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

  // ===== BOTONES DEL MODAL =====
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
    backgroundColor: "#F44336",
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