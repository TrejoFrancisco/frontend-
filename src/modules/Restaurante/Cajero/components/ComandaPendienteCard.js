import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function ComandaPendienteCard({
  comanda,
  onVerTicket,
  onPagar,
  isUnificada = false,
}) {
  return (
    <View style={styles.card}>
      {/* Badge unificada */}
      {isUnificada && (
        <View style={styles.unificadaBadge}>
          <Text style={styles.unificadaBadgeText}>UNIFICADA</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <Text style={styles.mesa}>
          {isUnificada
            ? `Mesas: ${
                Array.isArray(comanda.mesas)
                  ? comanda.mesas.join(", ")
                  : comanda.mesas
              }`
            : `Mesa ${comanda.mesa}`}
        </Text>

        {!isUnificada && comanda.mesero && (
          <Text style={styles.mesero}>Mesero: {comanda.mesero}</Text>
        )}

        {!isUnificada && comanda.comensal && (
          <Text style={styles.detail}>Comensal: {comanda.comensal}</Text>
        )}

        {isUnificada && comanda.comensales != null && (
          <Text style={styles.detail}>Comensales: {comanda.comensales}</Text>
        )}

        <View style={styles.productBadge}>
          <Text style={styles.productBadgeText}>
            Productos: {comanda.productos_count || 0}
          </Text>
        </View>

        <Text style={styles.totalText}>
          Total: ${comanda.total?.toFixed(2)}
        </Text>

        <Text style={styles.fecha}>
          {new Date(comanda.fecha).toLocaleDateString("es-MX")}
        </Text>
      </View>

      {/* Botones de acción */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.verTicketButton}
          onPress={() => onVerTicket(comanda, isUnificada)}
          activeOpacity={0.7}
        >
          <Text style={styles.verTicketText}>👁️ Ver Ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pagarButton}
          onPress={() => onPagar(comanda, isUnificada)}
          activeOpacity={0.7}
        >
          <Text style={styles.pagarText}>💳 Cobrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    position: "relative",
  },
  unificadaBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFC107",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  unificadaBadgeText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    paddingTop: 8,
  },
  mesa: {
    fontWeight: "bold",
    fontSize: 20,
    color: "#333",
  },
  mesero: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  detail: {
    fontSize: 15,
    color: "#555",
  },
  productBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productBadgeText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#2e7d32",
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28a745",
  },
  fecha: {
    fontSize: 13,
    color: "#999",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  verTicketButton: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "#17a2b8",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  verTicketText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  pagarButton: {
    flex: 1,
    minWidth: 120,
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  pagarText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});
