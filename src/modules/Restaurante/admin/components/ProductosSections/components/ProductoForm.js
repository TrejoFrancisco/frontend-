import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { BuscadorRecetas } from "./BuscadorRecetas";

export const ProductoForm = ({
  visible,
  editMode,
  productoData,
  recetas,
  categorias,
  onInputChange,
  onSave,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalWrapper}>
          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editMode ? "Editar Producto" : "Agregar Producto"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Clave"
                placeholderTextColor="#888"
                value={productoData.clave || undefined}
                onChangeText={(text) => onInputChange("clave", text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#888"
                value={productoData.nombre || undefined}
                onChangeText={(text) => onInputChange("nombre", text)}
              />

              <Text style={styles.label}>Categoría</Text>
              <Picker
                selectedValue={productoData.categoria_id || "default"}
                onValueChange={(value) => {
                  if (value !== "default") onInputChange("categoria_id", value);
                }}
                style={[
                  styles.picker,
                  { color: productoData.categoria_id ? "#000" : "#888" },
                ]}
              >
                <Picker.Item label="Selecciona una categoría" value="default" />
                {categorias.map((categoria) => (
                  <Picker.Item
                    key={categoria.id}
                    label={categoria.nombre}
                    value={categoria.id.toString()}
                  />
                ))}
              </Picker>

              <Text style={styles.label}>Receta (Opcional)</Text>
              <BuscadorRecetas
                recetas={recetas}
                selectedRecetaId={productoData.receta_id}
                onSelectReceta={(value) => onInputChange("receta_id", value)}
              />

              <Text style={styles.label}>Prioridad</Text>
              <Picker
                selectedValue={productoData.prioridad || "default"}
                onValueChange={(value) => {
                  if (value !== "default") onInputChange("prioridad", value);
                }}
                style={[
                  styles.picker,
                  { color: productoData.prioridad ? "#000" : "#888" },
                ]}
              >
                <Picker.Item label="Selecciona una prioridad" value="default" />
                <Picker.Item label="1 - Alta" value="1" />
                <Picker.Item label="2 - Media" value="2" />
                <Picker.Item label="3 - Baja" value="3" />
              </Picker>

              <View>
                <Text style={styles.label}>
                  Costo unitario{" "}
                  {productoData.receta_id ? "(Automático)" : "(Opcional)"}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    productoData.receta_id && styles.inputReadOnly,
                  ]}
                  placeholder={
                    productoData.receta_id
                      ? "Se calculará automáticamente"
                      : "Costo unitario (opcional)"
                  }
                  placeholderTextColor="#888"
                  keyboardType="decimal-pad"
                  value={productoData.costo_unitario || undefined}
                  onChangeText={(text) => onInputChange("costo_unitario", text)}
                  editable={!productoData.receta_id}
                />
              </View>

              <TextInput
                style={styles.input}
                placeholder="Precio de venta"
                placeholderTextColor="#888"
                keyboardType="decimal-pad"
                value={productoData.precio_venta || undefined}
                onChangeText={(text) => onInputChange("precio_venta", text)}
              />

              {!productoData.receta_id && (
                <TextInput
                  style={styles.input}
                  placeholder="Existencia inicial"
                  placeholderTextColor="#888"
                  keyboardType="decimal-pad"
                  value={productoData.existencia_inicial || undefined}
                  onChangeText={(text) =>
                    onInputChange("existencia_inicial", text)
                  }
                />
              )}

              {!productoData.receta_id && (
                <>
                  <Text style={styles.label}>Unidad</Text>
                  <Picker
                    selectedValue={productoData.unidad || "default"}
                    onValueChange={(value) => {
                      if (value !== "default") onInputChange("unidad", value);
                    }}
                    style={[
                      styles.picker,
                      { color: productoData.unidad ? "#000" : "#888" },
                    ]}
                  >
                    <Picker.Item
                      label="Selecciona una unidad"
                      value="default"
                    />
                    <Picker.Item label="Pieza" value="pieza" />
                    <Picker.Item label="Kilogramo" value="kg" />
                    <Picker.Item label="Gramo" value="g" />
                    <Picker.Item label="Litro" value="l" />
                    <Picker.Item label="Mililitro" value="ml" />
                    <Picker.Item label="Botella" value="botella" />
                    <Picker.Item label="Lata" value="lata" />
                    <Picker.Item label="Caja" value="caja" />
                    <Picker.Item label="Paquete" value="paquete" />
                  </Picker>
                </>
              )}

              <Text style={styles.label}>Estado del Producto</Text>
              <Picker
                selectedValue={productoData.estado || "default"}
                onValueChange={(value) => {
                  if (value !== "default") onInputChange("estado", value);
                }}
                style={[
                  styles.picker,
                  { color: productoData.estado ? "#000" : "#888" },
                ]}
              >
                <Picker.Item label="Selecciona un estado" value="default" />
                <Picker.Item label="Activo" value="activo" />
                <Picker.Item label="Inactivo" value="inactivo" />
              </Picker>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={onSave}
                >
                  <Text style={styles.submitButtonText}>
                    {editMode ? "Actualizar" : "Guardar"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalScrollView: {
    maxHeight: "90%",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  inputReadOnly: {
    backgroundColor: "#f0f0f0",
    color: "#666",
  },
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
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
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
});
