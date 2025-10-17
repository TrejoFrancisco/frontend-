import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { API } from "../../../../services/api";

export default function UnificarMesasModal({
  visible,
  onClose,
  onSuccess,
  token,
  comandas,
}) {
  const [comandasSeleccionadas, setComandasSeleccionadas] = useState([]);

  const toggleComandaSeleccionada = (comandaId) => {
    setComandasSeleccionadas((prev) => {
      if (prev.includes(comandaId)) {
        return prev.filter((id) => id !== comandaId);
      } else {
        return [...prev, comandaId];
      }
    });
  };

  const unificarComandas = async () => {
    if (comandasSeleccionadas.length < 2) {
      Alert.alert(
        "Error",
        "Debe seleccionar al menos 2 comandas para unificar"
      );
      return;
    }

    const mesasSeleccionadas = comandas
      .filter((c) => comandasSeleccionadas.includes(c.id))
      .map((c) => c.mesa)
      .join(", ");

    Alert.alert(
      "Unificar Comandas",
      `¿Desea unificar las comandas de las mesas ${mesasSeleccionadas}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Unificar",
          onPress: async () => {
            try {
              const response = await API.post(
                "/restaurante/mesero/comandas/unificar",
                {
                  comandas_ids: comandasSeleccionadas,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (response.data.success) {
                Alert.alert("Éxito", response.data.message);
                setComandasSeleccionadas([]);
                onSuccess();
                onClose();
              }
            } catch (error) {
              console.log("Error al unificar comandas:", error);
              if (error.response?.data?.error) {
                Alert.alert("Error", error.response.data.error.message);
              } else {
                Alert.alert(
                  "Error",
                  "Ocurrió un error al unificar las comandas"
                );
              }
            }
          },
        },
      ]
    );
  };

  const comandasActivas = comandas.filter(
    (c) => c.estado !== "pagada" && c.estado !== "cerrada"
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.modalWrapper}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Unificar Mesas</Text>
            <Text style={styles.modalSubtitle}>
              Selecciona las mesas que deseas unificar:
            </Text>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                Seleccionadas: {comandasSeleccionadas.length}
              </Text>
            </View>

            <ScrollView style={styles.mesasScrollView}>
              {comandasActivas.length === 0 ? (
                <Text style={styles.noMesasText}>
                  No hay comandas activas disponibles para unificar
                </Text>
              ) : (
                <View>
                  {comandasActivas.map((comanda) => (
                    <TouchableOpacity
                      key={comanda.id}
                      style={[
                        styles.mesaItem,
                        comandasSeleccionadas.includes(comanda.id) &&
                          styles.mesaItemSelected,
                      ]}
                      onPress={() => toggleComandaSeleccionada(comanda.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.mesaItemHeader}>
                        <Text style={styles.mesaItemText}>
                          {`Mesa ${comanda.mesa}`}
                        </Text>
                        {comandasSeleccionadas.includes(comanda.id) && (
                          <Text style={styles.checkMark}>✓</Text>
                        )}
                      </View>

                      <Text style={styles.mesaItemDetalle}>
                        {`${comanda.personas} personas · ${
                          comanda.productos?.length || 0
                        } productos`}
                      </Text>

                      {comanda.comensal && (
                        <Text style={styles.mesaItemComensal}>
                          {`Comensal: ${comanda.comensal}`}
                        </Text>
                      )}

                      <Text style={styles.mesaItemFecha}>
                        {new Date(comanda.fecha).toLocaleString("es-MX")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setComandasSeleccionadas([]);
                  onClose();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.unificarButton,
                  comandasSeleccionadas.length < 2 &&
                    styles.unificarButtonDisabled,
                ]}
                onPress={unificarComandas}
                disabled={comandasSeleccionadas.length < 2}
              >
                <Text style={styles.unificarButtonText}>
                  {`Unificar (${comandasSeleccionadas.length})`}
                </Text>
              </TouchableOpacity>
            </View>
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
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#1976d2",
    fontWeight: "500",
  },
  mesasScrollView: {
    maxHeight: 300,
  },
  noMesasText: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    fontStyle: "italic",
    paddingVertical: 40,
  },
  mesaItem: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
  },
  mesaItemSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#2196f3",
    borderWidth: 2,
  },
  mesaItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  mesaItemText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  checkMark: {
    fontSize: 20,
    color: "#2196f3",
    fontWeight: "bold",
  },
  mesaItemDetalle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  mesaItemComensal: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  mesaItemFecha: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F44336",
  },
  unificarButton: {
    backgroundColor: "#6c757d",
  },
  unificarButtonDisabled: {
    backgroundColor: "#cccccc",
    opacity: 0.6,
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  unificarButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
