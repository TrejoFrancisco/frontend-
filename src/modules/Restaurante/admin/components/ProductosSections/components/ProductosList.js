import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ProductoCard } from "./ProductoCard";

export const ProductosList = ({
  productos,
  searchText,
  onEdit,
  onChangeStatus,
}) => {
  if (productos.length === 0 && searchText.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          No se encontraron productos que coincidan con "{searchText}"
        </Text>
      </View>
    );
  }

  if (productos.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No hay productos registrados</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {productos.map((producto) => (
        <ProductoCard
          key={producto.id}
          producto={producto}
          onEdit={onEdit}
          onChangeStatus={onChangeStatus}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#6c757d",
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 30,
    paddingHorizontal: 20,
  },
});
