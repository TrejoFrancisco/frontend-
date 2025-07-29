import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Modal,
    Alert,
    Picker,
} from "react-native";
import { API } from "../../../../services/api";

export default function ProductosSection({ token, navigation }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [recetas, setRecetas] = useState([]);
    const [productoData, setProductoData] = useState({
        clave: "",
        nombre: "",
        categoria: "",
        prioridad: "",
        precio_venta: "",
        costo_receta: "",
        costo_redondeado: "",
        recetas_asignadas: [],
    });

    useEffect(() => {
        fetchRecetas();
    }, []);

    const fetchRecetas = async () => {
        try {
            const response = await API.get("/restaurante/admin/recetas", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success) {
                setRecetas(response.data.data);
            }
        } catch (error) {
            console.error("Error al obtener recetas:", error);
            if (error.response?.status === 401) {
                navigation.navigate("Login");
            }
        }
    };

    const handleInputChange = (field, value) => {
        setProductoData((prev) => ({ ...prev, [field]: value }));
    };

    const asignarReceta = (recetaId) => {
        const recetaSeleccionada = recetas.find((r) => r.id === recetaId);
        if (
            recetaSeleccionada &&
            !productoData.recetas_asignadas.some((r) => r.id === recetaId)
        ) {
            setProductoData((prev) => ({
                ...prev,
                recetas_asignadas: [...prev.recetas_asignadas, recetaSeleccionada],
            }));
        }
    };

    const quitarReceta = (recetaId) => {
        setProductoData((prev) => ({
            ...prev,
            recetas_asignadas: prev.recetas_asignadas.filter((r) => r.id !== recetaId),
        }));
    };

    const guardarProducto = async () => {
        try {
            // Aquí puedes hacer el POST a la API si tienes ruta lista
            Alert.alert("Producto guardado (simulado)", JSON.stringify(productoData));
            setModalVisible(false);
        } catch (error) {
            console.error("Error al guardar producto:", error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gestión de Productos</Text>

            <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.createButtonText}>➕ Agregar Produc</Text>
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <ScrollView contentContainerStyle={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Agregar Pro</Text>

                        <TextInput style={styles.input} placeholder="Clave" value={productoData.clave} onChangeText={(text) => handleInputChange("clave", text)} />

                        <TextInput style={styles.input} placeholder="Nombre" value={productoData.nombre} onChangeText={(text) => handleInputChange("nombre", text)} />

                        <TextInput style={styles.input}
                            placeholder="Precio de venta"
                            keyboardType="decimal-pad"
                            value={productoData.precio_venta} onChangeText={(text) => handleInputChange("precio_venta", text)} />

                        <Text style={styles.label}>Categoría</Text>
                        <Picker selectedValue={productoData.categoria} onValueChange={(value) => handleInputChange("categoria", value)}>
                            <Picker.Item label="Selecciona una categoría" value="" />
                            <Picker.Item label="Entrada" value="Entrada" />
                            <Picker.Item label="Plato Fuerte" value="Plato Fuerte" />
                            <Picker.Item label="Postres" value="Postres" />
                            <Picker.Item label="Bebidas" value="Bebidas" />
                            <Picker.Item label="Otro" value="Otro" />
                        </Picker>

                        <Text style={styles.label}>Prioridad</Text>
                        <Picker
                            selectedValue={productoData.prioridad}
                            onValueChange={(value) => handleInputChange("prioridad", value)}
                            style={styles.picker} // puedes personalizar si lo deseas
                        >
                            <Picker.Item label="Selecciona una prioridad" value="" />
                            <Picker.Item label="Alta" value="Alta" />
                            <Picker.Item label="Mediana" value="Mediana" />
                            <Picker.Item label="Baja" value="Baja" />
                        </Picker>

                        <TextInput
                            style={[styles.input, styles.marginTop]} // aquí agregamos el margen
                            placeholder="Costo receta"
                            keyboardType="decimal-pad"
                            value={productoData.costo_receta}
                            onChangeText={(text) => handleInputChange("costo_receta", text)}
                        />


                        <TextInput style={styles.input}
                            placeholder="Costo redondeado"
                            keyboardType="decimal-pad"
                            value={productoData.costo_redondeado} onChangeText={(text) => handleInputChange("costo_redondeado", text)} />

                        <Text style={styles.sectionTitle}>Asignar Recetas</Text>
                        <Picker onValueChange={(value) => asignarReceta(value)}>
                            <Picker.Item label="Selecciona una receta" value="" />
                            {recetas.map((r) => (
                                <Picker.Item key={r.id} label={`${r.clave} - ${r.nombre}`} value={r.id} />
                            ))}
                        </Picker>

                        {productoData.recetas_asignadas.length > 0 && (
                            <View style={styles.table}>
                                <Text style={styles.sectionTitle}>Recetas Asignadas</Text>
                                {productoData.recetas_asignadas.map((r) => (
                                    <View key={r.id} style={styles.tableRow}>
                                        <Text style={{ flex: 1 }}>{r.clave}</Text>
                                        <Text style={{ flex: 2 }}>{r.nombre}</Text>
                                        <TouchableOpacity onPress={() => quitarReceta(r.id)}>
                                            <Text style={{ color: "red" }}>🗑️</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={guardarProducto}>
                                <Text style={styles.submitButtonText}>Guardar</Text>
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
        backgroundColor: "#f0f0f0"
    },

    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 16
    },

    createButton: {
        backgroundColor: "#4CAF50",
        padding: 12, borderRadius: 8
    },

    createButtonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold"
    },

    modalContainer: {
        flexGrow: 1,
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)"
    },

    modalContent: {
        backgroundColor: "#fff",
        margin: 20,
        borderRadius: 8,
        padding: 20
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center"
    },
    picker: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 10,
    },

    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 4,
        padding: 10,
        marginBottom: 12
    },
    marginTop: {
        marginTop: 10, // ajusta según el espacio que necesites
    },

    label: {
        fontWeight: "bold",
        marginTop: 8
    },

    optionContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 12
    },

    optionButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#aaa",
        marginRight: 8,
        marginTop: 6,
    },
    optionButtonSelected: {
        backgroundColor: "#2196F3",
        borderColor: "#2196F3",
    },
    optionText: { color: "#333" },
    optionTextSelected: { color: "white" },
    sectionTitle: { fontWeight: "bold", fontSize: 16, marginTop: 16, marginBottom: 8 },
    recetaButton: {
        backgroundColor: "#eee",
        padding: 10,
        borderRadius: 6,
        marginBottom: 6,
    },
    recetaButtonText: { color: "#000" },
    table: { marginTop: 8 },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderColor: "#ddd",
    },
    modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
    button: { flex: 1, padding: 12, borderRadius: 4, marginHorizontal: 4 },
    cancelButton: { backgroundColor: "#666" },
    cancelButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
    submitButton: { backgroundColor: "#4CAF50" },
    submitButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});
