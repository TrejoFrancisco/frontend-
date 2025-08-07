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
  const [selectedRole, setSelectedRole] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [passwordError, setPasswordError] = useState("");

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
      setSelectedRole(usuario.rol_id || "");
      setPassword("");
    } else {
      setEditMode(false);
      setSelectedUser(null);
      setName("");
      setEmail("");
      setPassword("");
      setSelectedRole("");
    }
    setModalVisible(true);
  };

  const guardarUsuario = async () => {
    try {
      if (!name || !email || (!editMode && !password)) {
        Alert.alert("Error", "Todos los campos son obligatorios.");
        return;
      }

      if (!selectedRole) {
        Alert.alert("Error", "Debes seleccionar un rol.");
        return;
      }

      const data = {
        name,
        email,
        role_id: selectedRole,
      };

      if (!editMode) {
        data.password = password;
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
            <View style={styles.itemTextContainer}>
              <Text style={styles.label}>Nombre:</Text>
              <Text style={styles.itemText}>{u.name}</Text>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.itemText}>{u.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => abrirModal(u)}
            >
              <Image
                source={require('../../../../../assets/editarr.png')}
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
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            {!editMode && (
              <>
                <TextInput
                  placeholder="Contraseña"
                  value={password}
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
                  <Text style={{ color: "red", fontSize: 12 }}>
                    {passwordError}
                  </Text>
                ) : null}
              </>
            )}

            <Text style={styles.label}>Rol</Text>
            <Picker
              selectedValue={selectedRole}
              onValueChange={setSelectedRole}
              style={styles.picker}
            >
              <Picker.Item label="Selecciona un rol" value="" />
              {roles.map((rol) => (
                <Picker.Item key={rol.id} label={rol.name} value={rol.id} />
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
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 16,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
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
    shadowOffset: { width: 0, height: 2 },
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

  createButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
  itemTextContainer: {
    flex: 1,
  },

  label: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#444",
    marginTop: 4,
  },

  itemText: {
    fontSize: 16,
    color: "#333",
  },

  icon: {
    width: 30,
    height: 30,
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemRow: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
  },
  itemText: {
    fontSize: 15,
    color: "#333",
  },
  actions: {
    flexDirection: "row",
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },

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
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
    color: "#444",
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
