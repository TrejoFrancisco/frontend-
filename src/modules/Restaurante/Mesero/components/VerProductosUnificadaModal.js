import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export default function VerProductosUnificadaModal({
  visible,
  onClose,
  comanda,
}) {
  const calcularTotal = () => {
    const total = comanda?.total || 0;
    return Number(total).toFixed(2);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.modalTitle}>Productos de la Comanda</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Información de la comanda */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mesas:</Text>
                <Text style={styles.infoValue}>
                  {comanda?.mesa ?? "Sin mesa"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Comensales:</Text>
                <Text style={styles.infoValue}>
                  {comanda?.comensales ?? "0"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total:</Text>
                <Text style={styles.infoValueTotal}>${calcularTotal()}</Text>
              </View>
            </View>

            {/* Lista de productos */}
            <ScrollView style={styles.productosScroll}>
              {!comanda?.productos || comanda.productos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No hay productos</Text>
                </View>
              ) : (
                comanda.productos.map((producto, index) => {
                  // Validar que el producto existe
                  if (!producto) {
                    return null;
                  }

                  const nombreProducto =
                    producto.nombre ?? "Producto sin nombre";
                  const precioProducto =
                    producto.precio_venta ?? producto.precio ?? 0;

                  return (
                    <View key={`producto-${index}`} style={styles.productoCard}>
                      <View style={styles.productoCardHeader}>
                        <View style={styles.productoCardInfo}>
                          <Text style={styles.productoCardNombre}>
                            {nombreProducto}
                          </Text>
                          {producto.pivot?.detalle && (
                            <Text style={styles.productoCardDetalle}>
                              📝 {producto.pivot.detalle}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.productoCardPrecio}>
                          ${Number(precioProducto).toFixed(2)}
                        </Text>
                      </View>

                      {producto.pivot?.estado && (
                        <View
                          style={[
                            styles.estadoBadge,
                            producto.pivot.estado === "entregado" &&
                              styles.estadoEntregado,
                            producto.pivot.estado === "pendiente" &&
                              styles.estadoPendiente,
                            producto.pivot.estado === "en preparación" &&
                              styles.estadoPreparacion,
                          ]}
                        >
                          <Text style={styles.estadoText}>
                            {producto.pivot.estado.toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Botón cerrar */}
            <TouchableOpacity
              style={styles.cerrarButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cerrarButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalWrapper: {
    width: "90%",
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxHeight: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#999",
    fontWeight: "bold",
  },
  infoContainer: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 15,
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  infoValueTotal: {
    fontSize: 17,
    color: "#28a745",
    fontWeight: "bold",
  },
  productosScroll: {
    maxHeight: 400,
  },
  productoCard: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  productoCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productoCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  productoCardNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  productoCardDetalle: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
    marginTop: 2,
  },
  productoCardPrecio: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#28a745",
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  estadoEntregado: {
    backgroundColor: "#d4edda",
  },
  estadoPendiente: {
    backgroundColor: "#fff3cd",
  },
  estadoPreparacion: {
    backgroundColor: "#cfe2ff",
  },
  estadoText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#333",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    fontStyle: "italic",
  },
  cerrarButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    marginTop: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cerrarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
