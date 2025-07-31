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

const ROLES = [
    "admin_general",
    "admin_cliente_balneario",
    "admin_cliente_externo",
    "admin_local_bar",
    "admin_local_snack",
    "admin_local_tienda",
    "admin_local_restaurante",
    "admin_local_almacen",
    "bartender",
    "meseros_bar",
    "meseros_snack",
    "tender",
    "meseros_restaurant",
    "cocina",
    "gerente",
    "bartender_restaurante",
    "almacenista_general",
    "transportista_general",
];

export default function UsuariosSection({ token, navigation }) {
    const [usuarios, setUsuarios] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        try {
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
                Alert.alert("Error", "No se pudo obtener la lista de usuarios");
            }
        }
    };

    const abrirModal = (usuario = null) => {
        if (usuario) {
            setEditMode(true);
            setSelectedUser(usuario);
            setName(usuario.name);
            setEmail(usuario.email);
            setSelectedRole(usuario.rol);
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
        if (!name || !email || !selectedRole || (!editMode && !password)) {
            Alert.alert("Error", "Todos los campos son obligatorios");
            return;
        }

        const data = {
            name,
            email,
            rol: selectedRole,
            ...(editMode ? {} : { password }),
        };

        try {
            let response;
            if (editMode) {
                response = await API.put(`/restaurante/admin/usuarios/${selectedUser.id}`, data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                response = await API.post("/restaurante/admin/usuarios", data, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            if (response.data.success) {
                Alert.alert("Éxito", editMode ? "Usuario actualizado" : "Usuario creado");
                setModalVisible(false);
                fetchUsuarios();
            }
        } catch (error) {
            console.error("Error al guardar usuario:", error);
            Alert.alert("Error", "No se pudo guardar el usuario");
        }
    };

    const eliminarUsuario = (usuario) => {
        Alert.alert("Confirmar", `¿Eliminar a ${usuario.name}?`, [
            { text: "Cancelar", style: "cancel" },
            {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                    try {
                        const response = await API.delete(`/restaurante/admin/usuarios/${usuario.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (response.data.success) {
                            Alert.alert("Eliminado", "Usuario eliminado correctamente");
                            fetchUsuarios();
                        }
                    } catch (error) {
                        console.error("Error al eliminar usuario:", error);
                        Alert.alert("Error", "No se pudo eliminar el usuario");
                    }
                },
            },
        ]);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsuarios();
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{usuarios.length}</Text>
                        <Text style={styles.statLabel}>Total Usuarios</Text>
                    </View>
                </View>

                <Text style={styles.title}>Gestión de Usuarios</Text>

                <TouchableOpacity style={styles.createButton} onPress={abrirModal}>
                    <View style={styles.inlineContent}>
                        <Image
                            source={require("../../../../../assets/mas.png")}
                            style={styles.icon}
                        />
                        <Text style={styles.createButtonText}>Crear Usuarios</Text>
                    </View>
                </TouchableOpacity>

                {usuarios.map((u) => (
                    <View key={u.id} style={styles.itemRow}>
                        <Text style={styles.itemText}>{u.name} ({u.rol})</Text>
                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.editButton} onPress={() => abrirModal(u)}>
                                <Text style={styles.editButtonText}>Editar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.deleteButton} onPress={() => eliminarUsuario(u)}>
                                <Text style={styles.deleteButtonText}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editMode ? "Editar Usuario" : "Nuevo Usuario"}</Text>

                        <TextInput placeholder="Nombre" value={name} onChangeText={setName} style={styles.input} />
                        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} />
                        {!editMode && (
                            <TextInput
                                placeholder="Contraseña"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                style={styles.input}
                            />
                        )}

                        <Text style={styles.label}>Rol</Text>
                        <Picker
                            selectedValue={selectedRole}
                            onValueChange={(value) => setSelectedRole(value)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Selecciona un rol" value="" />
                            {ROLES.map((rol) => (
                                <Picker.Item key={rol} label={rol} value={rol} />
                            ))}
                        </Picker>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={guardarUsuario}>
                                <Text style={styles.submitButtonText}>{editMode ? "Actualizar" : "Crear"}</Text>
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
        width: 30,
        height: 30,
        marginRight: 10,
    },
    createButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
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
        justifyContent: "space-between",
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 4,
    },
    cancelButton: {
        backgroundColor: "#F44336",
        marginRight: 10,
    },
    cancelButtonText: {
        color: "white",
        textAlign: "center",
        fontWeight: "bold",
    },
    submitButton: {
        backgroundColor: "#4CAF50",
    },
    submitButtonText: {
        color: "white",
        textAlign: "center",
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
});
