import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export default function TicketModal({
  visible,
  onClose,
  ticket,
  isUnificada = false,
}) {
  if (!ticket || !visible) {
    return null;
  }

  // Validación de estructura del ticket
  const negocio = ticket?.negocio || "Negocio";

  // CORRECCIÓN: Para comandas unificadas, extraer productos de productos_por_mesa
  let productos = [];
  if (isUnificada && Array.isArray(ticket?.productos_por_mesa)) {
    // Aplanar los productos de todas las mesas
    productos = ticket.productos_por_mesa.flatMap((mesa) =>
      (mesa.productos || []).map((prod) => ({
        ...prod,
        mesa: mesa.mesa, // Agregar info de mesa
        comensal: mesa.comensal,
      }))
    );
  } else {
    // Para comandas individuales
    productos = Array.isArray(ticket?.productos) ? ticket.productos : [];
  }

  const total = isUnificada ? ticket?.resumen?.total || 0 : ticket?.total || 0;

  const formatearPrecio = (precio) => {
    const numero = parseFloat(precio);
    return isNaN(numero) ? "0.00" : numero.toFixed(2);
  };

  const obtenerPrecioProducto = (producto) => {
    return producto?.precio_venta || producto?.subtotal || 0;
  };

  const formatearFecha = (fecha) => {
    try {
      if (!fecha) return "Fecha no disponible";
      return new Date(fecha).toLocaleString("es-MX");
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha no disponible";
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.modalTitle}>🧾 Ticket de Cuenta</Text>
            </View>

            {/* Contenido del ticket */}
            <ScrollView style={styles.ticketScroll}>
              {/* Negocio */}
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketNegocio}>{negocio}</Text>
                <View style={styles.divider} />
              </View>

              {/* Información de la comanda */}
              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>
                    {isUnificada ? "Mesas:" : "Mesa:"}
                  </Text>
                  <Text style={styles.infoValue}>
                    {isUnificada
                      ? Array.isArray(ticket.mesas)
                        ? ticket.mesas.join(", ")
                        : "Sin mesas"
                      : ticket.mesa || "Sin mesa"}
                  </Text>
                </View>

                {isUnificada && ticket.total_comensales != null && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Comensales:</Text>
                    <Text style={styles.infoValue}>
                      {ticket.total_comensales}
                    </Text>
                  </View>
                )}

                {!isUnificada && ticket.comensal && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Comensal:</Text>
                    <Text style={styles.infoValue}>{ticket.comensal}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Fecha:</Text>
                  <Text style={styles.infoValue}>
                    {formatearFecha(ticket.fecha)}
                  </Text>
                </View>

                {isUnificada && Array.isArray(ticket.comandas_ids) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Comandas unificadas:</Text>
                    <Text style={styles.infoValue}>
                      {ticket.comandas_ids.length}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.divider} />

              {/* Productos - Agrupados por mesa para unificadas */}
              <View style={styles.productosSection}>
                <Text style={styles.productosTitle}>Productos</Text>

                {isUnificada && Array.isArray(ticket.productos_por_mesa) ? (
                  // MOSTRAR PRODUCTOS AGRUPADOS POR MESA
                  ticket.productos_por_mesa.map((mesa, mesaIndex) => (
                    <View key={`mesa-${mesaIndex}`} style={styles.mesaGroup}>
                      <View style={styles.mesaHeader}>
                        <Text style={styles.mesaTitle}>Mesa {mesa.mesa}</Text>
                        {mesa.comensal && (
                          <Text style={styles.mesaComensal}>
                            ({mesa.comensal})
                          </Text>
                        )}
                      </View>

                      {Array.isArray(mesa.productos) &&
                      mesa.productos.length > 0 ? (
                        mesa.productos.map((producto, prodIndex) => (
                          <View
                            key={`producto-${mesaIndex}-${prodIndex}`}
                            style={styles.productoItem}
                          >
                            <View style={styles.productoInfo}>
                              <Text style={styles.productoNombre}>
                                {producto.nombre ?? "Producto sin nombre"}
                              </Text>
                              {producto.detalle && (
                                <Text style={styles.productoDetalle}>
                                  {producto.detalle}
                                </Text>
                              )}
                            </View>
                            <Text style={styles.productoPrecio}>
                              $
                              {formatearPrecio(obtenerPrecioProducto(producto))}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noProductosText}>
                          Sin productos
                        </Text>
                      )}

                      {mesa.subtotal != null && (
                        <View style={styles.subtotalMesa}>
                          <Text style={styles.subtotalLabel}>Subtotal:</Text>
                          <Text style={styles.subtotalMonto}>
                            ${formatearPrecio(mesa.subtotal)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                ) : productos.length > 0 ? (
                  // MOSTRAR PRODUCTOS INDIVIDUALES (comanda normal)
                  productos.map((producto, index) => {
                    if (!producto) return null;

                    return (
                      <View
                        key={`producto-${index}`}
                        style={styles.productoItem}
                      >
                        <View style={styles.productoInfo}>
                          <Text style={styles.productoNombre}>
                            {producto.nombre ?? "Producto sin nombre"}
                          </Text>
                          {producto.detalle && (
                            <Text style={styles.productoDetalle}>
                              {producto.detalle}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.productoPrecio}>
                          ${formatearPrecio(obtenerPrecioProducto(producto))}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.noProductosText}>
                    No hay productos en este ticket
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              {/* Total */}
              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalMonto}>${formatearPrecio(total)}</Text>
              </View>

              <View style={styles.divider} />

              {/* Footer */}
              <View style={styles.ticketFooter}>
                <Text style={styles.footerText}>¡Gracias por su visita!</Text>
                <Text style={styles.footerSubtext}>
                  Ticket generado: {formatearFecha(new Date())}
                </Text>
              </View>
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
    maxHeight: "85%",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    maxHeight: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  ticketIcon: {
    width: 32,
    height: 32,
    marginRight: 8,
    resizeMode: "contain",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  ticketScroll: {
    maxHeight: 500,
  },
  ticketHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  ticketNegocio: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    textAlign: "center",
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 12,
  },
  infoSection: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  productosSection: {
    marginBottom: 8,
  },
  productosTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 12,
  },
  productoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productoInfo: {
    flex: 1,
    marginRight: 8,
  },
  productoNombre: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  productoMesa: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginTop: 2,
  },
  productoPrecio: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#28a745",
  },
  noProductosText: {
    textAlign: "center",
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
    paddingVertical: 20,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  totalMonto: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#28a745",
  },
  ticketFooter: {
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#999",
  },
  cerrarButton: {
    backgroundColor: "#F44336",
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
