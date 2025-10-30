import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

export const ProductoCard = ({ producto, onEdit, onChangeStatus }) => {
  if (!producto) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.colItem}>
          <Text style={styles.name}>{producto.nombre || "Sin nombre"}</Text>
        </View>

        <View style={styles.colItem}>
          <Text style={styles.label}>Prioridad:</Text>
          <Text style={styles.detail}>{producto.prioridad || "N/A"}</Text>
        </View>

        <View style={styles.colItem}>
          <Text style={styles.label}>Tipo:</Text>
          <Text style={styles.detail}>
            {producto.receta_id ? "Con receta" : "Producto directo"}
          </Text>
        </View>

        <View style={styles.colItem}>
          <Text style={styles.code}>{producto.clave || "N/A"}</Text>
        </View>

        <View style={styles.colItem}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              {
                backgroundColor:
                  producto.estado === "activo" ? "#32b551" : "#ffc107",
              },
            ]}
            onPress={() =>
              onChangeStatus(producto.id, producto.estado, producto.nombre)
            }
          >
            <Text style={styles.statusButtonText}>
              {producto.estado === "activo" ? "Activo" : "Inactivo"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.colItem}>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => onEdit(producto)}
            >
              <Image
                source={require("../../../../../../../assets/editarr.png")}
                style={styles.iconImage}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  colItem: {
    flex: 1,
    minWidth: 150,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
  detail: {
    fontSize: 17,
  },
  code: {
    fontSize: 17,
    fontWeight: "500",
  },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 8,
  },
  actionButton: {
    padding: 7,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    backgroundColor: "#f9ebc3ff",
    paddingHorizontal: 16,
    minWidth: 48,
  },
  iconImage: {
    width: 27,
    height: 27,
  },
});
