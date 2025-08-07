import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from "react-native";
import { API } from "../../../../services/api";

export default function InventarioSection({ token, navigation }) {
  const [inventarioData, setInventarioData] = useState({
    productos: [],
    materias_primas: [],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [historialVisible, setHistorialVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      const response = await API.get("/restaurante/admin/inventario", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setInventarioData(response.data.data);
      }
    } catch (error) {
      console.error("Error al obtener inventario:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      } else {
        Alert.alert(
          "Error",
          error.response?.data?.error?.message ||
          "Error al obtener el inventario"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventario();
    setRefreshing(false);
  };

  const verHistorial = (item) => {
    setSelectedItem(item);
    setHistorialVisible(true);
  };

  const getStatusColor = (existencia) => {
    if (existencia <= 0) return "#dc3545";
    if (existencia <= 10) return "#ffc107";
    return "#28a745";
  };

  const getStatusText = (existencia) => {
    if (existencia <= 0) return "Sin existencia";
    if (existencia <= 10) return "Existencia baja";
    return "Disponible";
  };

  const renderInventarioItem = (item, tipo) => (
    <View key={`${tipo}-${item.id}`} style={styles.inventarioCard}>
      <View style={styles.inventarioHeader}>
        <Text style={styles.inventarioName}>{item.nombre}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.existencia) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusText(item.existencia)}
          </Text>
        </View>
      </View>

      <View style={styles.inventarioDetails}>
        <Text style={styles.inventarioDetail}>
          Existencia: {item.existencia}
        </Text>
        <Text style={styles.inventarioDetail}>Unidad: {item.unidad}</Text>
        <Text style={styles.inventarioDetail}>
          Tipo: {tipo === "productos" ? "Producto" : "Materia Prima"}
        </Text>
      </View>

      <View style={styles.inventarioActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.historialButton]}
          onPress={() => verHistorial(item)}
        >
          <View style={styles.actionButtonContainer}>
            <Image
              source={require('../../../../../assets/historial.png')}
              style={styles.icon}
            />
            <Text style={styles.actionButtonText}>Ver Historial</Text>
          </View>

        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistorialItem = (item, index) => (
    <View key={index} style={styles.historialItem}>
      <View style={styles.historialHeader}>
        <Text
          style={[
            styles.historialTipo,
            { color: item.tipo === "entrada" ? "#28a745" : "#dc3545" },
          ]}
        >
          {item.tipo === "entrada" ? "📈 Entrada" : "📉 Salida"}
        </Text>
        <Text style={styles.historialFecha}>
          {new Date(item.created_at).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
      <Text style={styles.historialCantidad}>
        Cantidad: {item.cantidad} {item.unidad}
      </Text>
      {item.descripcion && (
        <Text style={styles.historialDescripcion}>
          Descripción: {item.descripcion}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Inventario del Restaurante</Text>

        {/* Sección de Productos */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Image
              source={require('../../../../../assets/gestionP.png')}
              style={styles.iconImage}
            />
            <Text style={styles.sectionTitle}>
              Productos ({inventarioData.productos.length})
            </Text>
          </View>

          {inventarioData.productos.length === 0 ? (
            <Text style={styles.emptyText}>No hay productos en inventario</Text>
          ) : (
            inventarioData.productos.map((item) =>
              renderInventarioItem(item, "productos")
            )
          )}
        </View>


        {/* Sección de Materias Primas */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Image
              source={require('../../../../../assets/gestionMP.png')}
              style={styles.iconImage}
            />
            <Text style={styles.sectionTitle}>
              Materias Primas ({inventarioData.materias_primas.length})
            </Text>
          </View>

          {inventarioData.materias_primas.length === 0 ? (
            <Text style={styles.emptyText}>
              No hay materias primas en inventario
            </Text>
          ) : (
            inventarioData.materias_primas.map((item) =>
              renderInventarioItem(item, "materias_primas")
            )
          )}
        </View>
      </ScrollView>

      {/* Modal de Historial */}
      <Modal visible={historialVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalWrapper}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Historial: {selectedItem?.nombre}
              </Text>

              <ScrollView
                style={styles.historialScrollView}
                showsVerticalScrollIndicator={false}
              >
                {selectedItem?.historial &&
                  selectedItem.historial.length > 0 ? (
                  selectedItem.historial.map((item, index) =>
                    renderHistorialItem(item, index)
                  )
                ) : (
                  <Text style={styles.emptyHistorialText}>
                    No hay historial disponible
                  </Text>
                )}
              </ScrollView>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setHistorialVisible(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#6c757d",
  },
  refreshButton: {
    backgroundColor: "#17a2b8",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    flexDirection: "row",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#495057",
    borderBottomWidth: 2,
    borderBottomColor: "#e9ecef",
    paddingBottom: 5,
  },
  iconImage: {
    width: 40,
    height: 40,
    marginRight: 8,
  },

  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6c757d",
    fontStyle: "italic",
    marginVertical: 20,
  },
  inventarioCard: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inventarioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  inventarioName: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    color: "#2c3e50",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  inventarioDetails: {
    marginBottom: 15,
  },
  inventarioDetail: {
    fontSize: 14,
    marginBottom: 5,
    color: "#495057",
  },
  inventarioActions: {
    alignItems: "center",
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 150,
    alignItems: "center",
  },
  historialButton: {
    backgroundColor: "#6f42c1",
  },
  actionButtonContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},


  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  historialScrollView: {
    maxHeight: 400,
    marginBottom: 20,
  },
  historialItem: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#17a2b8",
  },
  historialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  historialTipo: {
    fontSize: 14,
    fontWeight: "bold",
  },
  historialFecha: {
    fontSize: 12,
    color: "#6c757d",
  },
  historialCantidad: {
    fontSize: 14,
    marginBottom: 3,
    color: "#495057",
  },
  historialDescripcion: {
    fontSize: 12,
    color: "#6c757d",
    fontStyle: "italic",
  },
  emptyHistorialText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6c757d",
    fontStyle: "italic",
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: "#F44336",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
