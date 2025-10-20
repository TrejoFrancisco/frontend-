import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import VerProductosUnificadaModal from "./VerProductosUnificadaModal";

export default function ComandaCard({
  comanda,
  onEdit,
  onGenerarTicket,
  onPagar,
  isUnificada = false,
  perteneceAUnificada = false,
  mesasUnificadas = "",
}) {
  const [modalProductosVisible, setModalProductosVisible] = useState(false);

  const acortarComensal = (nombre) => {
    if (!nombre) return "";
    if (nombre.length <= 15) return nombre;
    return nombre.substring(0, 15) + "...";
  };

  // Determinar si la comanda puede ser editada
  const puedeEditar =
    !isUnificada &&
    comanda.tipo !== "unificada" &&
    comanda.estado !== "pagada" &&
    comanda.estado !== "cerrada";

  // Determinar estado visual para unificadas
  const getEstadoUnificada = () => {
    if (comanda.tipo === "unificada" || isUnificada) {
      return comanda.estado || "pendiente";
    }
    return comanda.estado;
  };

  // Mostrar botón de pagar solo si está cerrada
  const puedePagar = getEstadoUnificada() === "cerrada";

  return (
    <>
      <View style={styles.comandaCard}>
        {/* Badge de comanda unificada */}
        {isUnificada && (
          <View style={styles.unificadaBadge}>
            <Text style={styles.unificadaBadgeText}>UNIFICADA</Text>
          </View>
        )}

        {/* Badge de comanda en unificada */}
        {perteneceAUnificada && !isUnificada && (
          <View style={styles.enUnificadaBadge}>
            <Text style={styles.enUnificadaBadgeText}>EN UNIFICADA</Text>
          </View>
        )}

        <View style={styles.comandaHeaderRow}>
          <Text style={styles.comandaMesa}>
            {isUnificada || comanda.tipo === "unificada"
              ? `Mesas: ${comanda.mesa}`
              : `Mesa ${comanda.mesa}`}
          </Text>

          {comanda.comensal && !isUnificada && comanda.tipo !== "unificada" && (
            <Text style={styles.comandaComensal}>
              Comensal: {acortarComensal(comanda.comensal)}
            </Text>
          )}

          {(isUnificada || comanda.tipo === "unificada") &&
            comanda.comensales != null && (
              <Text style={styles.comandaDetail}>
                Comensal: {comanda.comensales}
              </Text>
            )}

          {!isUnificada &&
            comanda.tipo !== "unificada" &&
            comanda.personas != null && (
              <Text style={styles.comandaDetail}>
                Personas: {comanda.personas}
              </Text>
            )}

          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>
              Productos: {comanda.productos?.length || 0}
            </Text>
          </View>

          {/* Botón para abrir modal de productos en comandas unificadas */}
          {(isUnificada || comanda.tipo === "unificada") &&
            (comanda.productos?.length || 0) > 0 && (
              <TouchableOpacity
                style={styles.verProductosButton}
                onPress={() => setModalProductosVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.verProductosText}>Ver productos</Text>
              </TouchableOpacity>
            )}

          {(isUnificada || comanda.tipo === "unificada") &&
            comanda.total != null && (
              <Text style={styles.totalText}>Total: ${comanda.total}</Text>
            )}

          <Text style={styles.comandaDetail}>
            {new Date(comanda.fecha || comanda.created_at).toLocaleDateString(
              "es-MX"
            )}
          </Text>
        </View>

        {/* Estado y acciones */}
        <View style={styles.footerRow}>
          {/* Estado de la comanda */}
          <View
            style={[
              styles.estadoBadge,
              comanda.estado === "pendiente" && styles.estadoPendiente,
              comanda.estado === "pagada" && styles.estadoPagada,
              comanda.estado === "cerrada" && styles.estadoCerrada,
              comanda.estado === "activa" && styles.estadoActiva,
            ]}
          >
            <Text style={styles.estadoText}>
              {comanda.estado?.toUpperCase() || "ACTIVA"}
            </Text>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            {/* CASO 1: Comanda Unificada */}
            {isUnificada || comanda.tipo === "unificada" ? (
              <>
                {/* Ticket unificado */}
                <TouchableOpacity
                  style={styles.ticketButton}
                  onPress={() => onGenerarTicket(comanda, true)}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require("../../../../../assets/ticket.png")}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.ticketButtonText}>Ticket</Text>
                </TouchableOpacity>

                {/* Pagar unificado - solo si está cerrada */}
                {puedePagar && (
                  <TouchableOpacity
                    style={styles.pagoButton}
                    onPress={() => onPagar(comanda)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require("../../../../../assets/card.png")}
                      style={styles.pagoIcon}
                    />
                    <Text style={styles.pagoButtonText}>Pagar</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* CASO 2: Comanda Individual */}
                {/* Botón editar - solo comandas regulares que pueden ser editadas */}
                {puedeEditar && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => onEdit(comanda)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require("../../../../../assets/editarr.png")}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.editButtonText}>Editar</Text>
                  </TouchableOpacity>
                )}

                {/* Mensaje informativo si es una comanda unificada */}
                {(isUnificada || comanda.tipo === "unificada") && (
                  <View style={styles.infoUnificada}>
                    <Text style={styles.infoUnificadaText}>
                      ⓘ Las comandas unificadas no se pueden editar
                    </Text>
                  </View>
                )}

                {/* Ticket individual - BLOQUEADO si está en una unificada */}
                {perteneceAUnificada ? (
                  <View style={styles.botonBloqueado}>
                    <Image
                      source={require("../../../../../assets/ticket.png")}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.botoBloqueadoText}>Ticket</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.ticketButton}
                    onPress={() => onGenerarTicket(comanda, false)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require("../../../../../assets/ticket.png")}
                      style={styles.actionIcon}
                    />
                    <Text style={styles.ticketButtonText}>Ticket</Text>
                  </TouchableOpacity>
                )}

                {/* Pagar individual - BLOQUEADO si está en una unificada */}
                {!perteneceAUnificada && comanda.estado === "cerrada" && (
                  <TouchableOpacity
                    style={styles.pagoButton}
                    onPress={() => onPagar(comanda)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={require("../../../../../assets/card.png")}
                      style={styles.pagoIcon}
                    />
                    <Text style={styles.pagoButtonText}>Pagar</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Modal de productos */}
      <VerProductosUnificadaModal
        visible={modalProductosVisible}
        onClose={() => setModalProductosVisible(false)}
        comanda={comanda}
      />
    </>
  );
}

const styles = StyleSheet.create({
  comandaCard: {
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
  enUnificadaBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FF9800",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  enUnificadaBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  comandaHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
    paddingTop: 8,
  },
  comandaMesa: {
    fontWeight: "bold",
    fontSize: 23,
  },
  comandaComensal: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
  },
  comandaDetail: {
    fontSize: 17,
  },
  productBadge: {
    backgroundColor: "#eee",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productBadgeText: {
    fontWeight: "bold",
    fontSize: 17,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#28a745",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  estadoPendiente: {
    backgroundColor: "#fdb03cff",
  },
  estadoActiva: {
    backgroundColor: "#4CAF50",
  },
  estadoCerrada: {
    backgroundColor: "#f1574cff",
  },
  estadoPagada: {
    backgroundColor: "#2196F3",
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9ebc3ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  ticketButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#cbf3ffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pagoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#cbf3ffff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  botonBloqueado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    opacity: 0.5,
  },
  actionIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
    resizeMode: "contain",
  },
  pagoIcon: {
    width: 20,
    height: 19,
    marginRight: 4,
  },
  editButtonText: {
    color: "#545454ff",
    fontSize: 12,
    fontWeight: "bold",
  },
  ticketButtonText: {
    color: "#545454ff",
    fontSize: 12,
    fontWeight: "bold",
  },
  pagoButtonText: {
    color: "#545454ff",
    fontSize: 12,
    fontWeight: "bold",
  },
  botoBloqueadoText: {
    color: "#999",
    fontSize: 12,
    fontWeight: "bold",
  },
  verProductosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  verProductosText: {
    fontSize: 13,
    color: "#2e7d32",
    fontWeight: "bold",
  },
  verProductosIcon: {
    fontSize: 14,
  },
  infoUnificada: {
    flex: 1,
    backgroundColor: "#fff3cd",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#ffc107",
  },
  infoUnificadaText: {
    fontSize: 11,
    color: "#856404",
    fontWeight: "500",
  },
});
