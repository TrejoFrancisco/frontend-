import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { API } from "../../../../services/api";

export default function UsuariosSection({ token, navigation }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clave, setClave] = useState(""); // NUEVO
  const [selectedRole, setSelectedRole] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [claveError, setClaveError] = useState(""); // NUEVO

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await API.get("/restaurante/admin/usuarios_rol", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data.data || {};
      const todosLosUsuarios = Object.values(data).flat();
      setUsuarios(todosLosUsuarios);
    } catch (error) {
      setUsuarios([]);
      Alert.alert("Error", "No se pudo obtener la lista de usuarios");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await API.get("/restaurante/admin/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success && Array.isArray(response.data.data)) {
        setRoles(response.data.data);
      } else {
        Alert.alert("Error", "Formato inesperado en la lista de roles");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo obtener la lista de roles");
    }
  };

  const abrirModal = (usuario = null) => {
    if (usuario) {
      setEditMode(true);
      setSelectedUser(usuario);
      setName(usuario.name);
      setEmail(usuario.email);
      setSelectedRole(usuario.role_id || "");
      setClave(usuario.clave || ""); // NUEVO
      setPassword("");
    } else {
      setEditMode(false);
      setSelectedUser(null);
      setName("");
      setEmail("");
      setPassword("");
      setClave(""); // NUEVO
      setSelectedRole("");
    }
    setModalVisible(true);
  };

  // NUEVA FUNCIÓN: Validar clave
  const validarClave = (text) => {
    const sinEspacios = text.trim();
    if (sinEspacios.length < 4) {
      setClaveError("La clave debe tener al menos 4 caracteres.");
    } else if (sinEspacios.length > 50) {
      setClaveError("La clave no puede exceder 50 caracteres.");
    } else {
      setClaveError("");
    }
  };

  const guardarUsuario = async () => {
    try {
      // Validaciones básicas
      if (
        !name ||
        !email ||
        (!editMode && !password) ||
        (!editMode && !clave)
      ) {
        Alert.alert("Error", "Todos los campos son obligatorios.");
        return;
      }

      if (!selectedRole) {
        Alert.alert("Error", "Debes seleccionar un rol.");
        return;
      }

      // Validar errores de contraseña y clave
      if (passwordError || claveError) {
        Alert.alert(
          "Error",
          "Por favor corrige los errores antes de continuar."
        );
        return;
      }

      const data = {
        name,
        email,
        role_id: selectedRole,
      };

      if (!editMode) {
        data.password = password;
        data.clave = clave.trim().toUpperCase(); // NUEVO - convertir a mayúsculas
      } else if (clave && clave.trim() !== "") {
        // Solo enviar clave si se modificó en edición
        data.clave = clave.trim().toUpperCase(); // NUEVO
      }

      let response;
      if (editMode) {
        response = await API.put(
          `/restaurante/admin/usuarios_/${selectedUser.id}`,
          data,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        response = await API.post("/restaurante/admin/usuarios_", data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (response.data.success) {
        Alert.alert(
          "Éxito",
          editMode ? "Usuario actualizado." : "Usuario creado."
        );
        setModalVisible(false);
        fetchUsuarios();
      } else {
        Alert.alert(
          "Error",
          response.data.message || "No se pudo guardar el usuario."
        );
      }
    } catch (error) {
      const backendError = error?.response?.data;
      let message = "Error al guardar usuario.";

      if (backendError?.error?.details?.password) {
        message =
          "Contraseña inválida: " +
          backendError.error.details.password.join(", ");
      } else if (backendError?.error?.details?.clave) {
        message =
          "Clave inválida: " + backendError.error.details.clave.join(", ");
      } else if (backendError?.error?.message) {
        message = backendError.error.message;
      }

      Alert.alert("Error", message);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsuarios();
    await fetchRoles();
    setRefreshing(false);
  };

  const validarPassword = (text) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(text);
    const hasNumber = /[0-9]/.test(text);

    if (text.length < minLength) {
      setPasswordError("Debe tener al menos 8 caracteres.");
    } else if (!hasUppercase) {
      setPasswordError("Debe contener al menos una mayúscula.");
    } else if (!hasNumber) {
      setPasswordError("Debe contener al menos un número.");
    } else {
      setPasswordError("");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{usuarios.length}</Text>
            <Text style={styles.statLabel}>Total Usuarios</Text>
          </View>
        </View>

        <Text style={styles.title}>Gestión de Usuarios</Text>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => abrirModal()}
        >
          <View style={styles.inlineContent}>
            <Image
              source={require("../../../../../assets/mas.png")}
              style={styles.icon}
            />
            <Text style={styles.createButtonText}>Crear Usuario</Text>
          </View>
        </TouchableOpacity>

        {usuarios.map((u) => (
          <View key={u.id} style={styles.itemRow}>
            <View style={[styles.column, styles.leftSpacing]}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.itemText}>{u.name}</Text>
            </View>

            <View style={styles.column}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.itemText}>{u.email}</Text>
            </View>

            <TouchableOpacity
              style={[styles.column, styles.editButton]}
              onPress={() => abrirModal(u)}
            >
              <Image
                source={require("../../../../../assets/editarr.png")}
                style={styles.editIcon}
                accessibilityLabel="Editar"
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editMode ? "Editar Usuario" : "Crear Usuario"}
            </Text>

            <TextInput
              placeholder="Nombre"
              placeholderTextColor="#888"
              value={name || undefined}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              value={email || undefined}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            {!editMode && (
              <>
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#888"
                  value={password || undefined}
                  onChangeText={(text) => {
                    setPassword(text);
                    validarPassword(text);
                  }}
                  secureTextEntry
                  style={[
                    styles.input,
                    passwordError ? { borderColor: "red", borderWidth: 1 } : {},
                  ]}
                />
                {passwordError ? (
                  <Text style={styles.errorText}>{passwordError}</Text>
                ) : null}
              </>
            )}

            {/* NUEVO CAMPO: Clave */}
            <TextInput
              placeholder={
                editMode ? "Nueva clave (opcional)" : "Clave (requerida)"
              }
              placeholderTextColor="#888"
              value={clave || undefined}
              onChangeText={(text) => {
                setClave(text.toUpperCase());
                validarClave(text);
              }}
              autoCapitalize="characters"
              style={[
                styles.input,
                claveError ? { borderColor: "red", borderWidth: 1 } : {},
              ]}
            />
            {claveError ? (
              <Text style={styles.errorText}>{claveError}</Text>
            ) : null}
            {editMode && (
              <Text style={styles.helperText}>
                * Dejar vacío si no deseas cambiar la clave
              </Text>
            )}

            <View style={styles.row}>
              <Text style={styles.labelR}>Rol</Text>
              <Picker
                selectedValue={selectedRole || "default"}
                onValueChange={(value) =>
                  setSelectedRole(value === "default" ? null : value)
                }
                style={[
                  styles.picker,
                  { color: selectedRole ? "#000" : "#888" },
                ]}
              >
                <Picker.Item label="Selecciona un rol" value="default" />
                {roles.map((rol) => (
                  <Picker.Item key={rol.id} label={rol.name} value={rol.id} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={guardarUsuario}
              >
                <Text style={styles.submitButtonText}>
                  {editMode ? "Actualizar" : "Crear"}
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
  // ======== CONTENEDORES PRINCIPALES ========
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  itemRow: {
    backgroundColor: "#fff",
    borderRadius: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    marginBottom: 8,
    elevation: 1,
  },
  column: {
    flexBasis: "30%",
    minWidth: 100,
    paddingHorizontal: 5,
    marginBottom: 10,
  },
  leftSpacing: {
    paddingLeft: 15,
  },

  // ======== TEXTOS Y TÍTULOS ========
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
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
  },
  statLabel: {
    fontSize: 20,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
  },
  label: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
    color: "#444",
  },
  itemText: {
    fontSize: 18,
    color: "#333",
  },

  // ======== BOTONES ========
  createButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 30,
    height: 30,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  editButton: {
    alignSelf: "flex-end",
    justifyContent: "center",
    alignItems: "center",
  },
  editIcon: {
    width: 35,
    height: 35,
    resizeMode: "contain",
  },

  // ======== MODAL ========
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
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

  // ======== FORMULARIO ========
  input: {
    fontSize: 17,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 20,
  },
  picker: {
    height: 50, // asegura que se vea el campo
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 150,
  },
  labelR: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#444",
  },
});
