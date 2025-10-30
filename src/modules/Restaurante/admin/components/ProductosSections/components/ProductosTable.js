import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";

export const ProductosTable = ({
  productos,
  searchText,
  onEdit,
  onChangeStatus,
}) => {
  if (productos.length === 0 && searchText.length > 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>
            No se encontraron productos que coincidan con "{searchText}"
          </Text>
        </View>
      </View>
    );
  }

  if (productos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>No hay productos registrados</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerText, styles.columnClave]}>Clave</Text>
        <Text style={[styles.headerText, styles.columnNombre]}>Nombre</Text>
        <Text style={[styles.headerText, styles.columnPrecio]}>Precio</Text>
        <View style={[styles.columnEstado, styles.headerEstadoContainer]}>
          <Text style={styles.headerText}>Estado</Text>
        </View>
        <View style={[styles.columnAcciones, styles.headerActionsContainer]}>
          <Text style={styles.headerText}>Acciones</Text>
        </View>
      </View>

      {productos.map((producto, index) => (
        <View
          key={producto.id}
          style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
        >
          <Text style={[styles.cellText, styles.columnClave]}>
            {producto.clave || "N/A"}
          </Text>
          <Text
            style={[styles.cellText, styles.columnNombre]}
            numberOfLines={2}
          >
            {producto.nombre || "Sin nombre"}
          </Text>
          <Text style={[styles.cellText, styles.columnPrecio]}>
            ${producto.precio_venta || "0.00"}
          </Text>
          <View style={[styles.cell, styles.columnEstado]}>
            <TouchableOpacity
              style={[
                styles.estadoBadge,
                producto.estado === "activo"
                  ? styles.estadoActivo
                  : styles.estadoInactivo,
              ]}
              onPress={() =>
                onChangeStatus(producto.id, producto.estado, producto.nombre)
              }
            >
              <Text
                style={[
                  styles.estadoText,
                  producto.estado === "activo"
                    ? styles.estadoTextoActivo
                    : styles.estadoTextoInactivo,
                ]}
              >
                {producto.estado === "activo" ? "Activo" : "Inactivo"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.columnAcciones, styles.actionsContainer]}>
            <TouchableOpacity onPress={() => onEdit(producto)}>
              <Image
                source={require("../../../../../../../assets/editarr.png")}
                style={styles.icon}
                accessibilityLabel="Editar producto"
              />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginHorizontal: 3,
    marginBottom: 10,
    borderRadius: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 19,
    color: "#333",
    flexWrap: "wrap",
  },
  headerEstadoContainer: {
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
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
  },
  rowEven: {
    backgroundColor: "#fff",
  },
  rowOdd: {
    backgroundColor: "#fff",
  },
  cell: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  cellText: {
    fontSize: 18,
    color: "#444",
    flexWrap: "wrap",
  },
  columnClave: {
    flex: 2,
    paddingHorizontal: 8,
  },
  columnNombre: {
    flex: 3,
    paddingHorizontal: 8,
  },
  columnPrecio: {
    flex: 2,
    paddingHorizontal: 4,
  },
  columnEstado: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  columnAcciones: {
    flex: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  estadoBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: "center",
  },
  estadoActivo: {
    backgroundColor: "#32b551",
  },
  estadoInactivo: {
    backgroundColor: "#ffc107",
  },
  estadoText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  estadoTextoActivo: {
    color: "#fff",
  },
  estadoTextoInactivo: {
    color: "#fff",
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  emptyRow: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
    fontStyle: "italic",
  },
});
