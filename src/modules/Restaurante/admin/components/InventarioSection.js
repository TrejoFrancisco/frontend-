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
  TextInput,
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
  const [busquedaInventario, setBusquedaInventario] = useState("");

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

  const getItemsFiltrados = (items) => {
    if (!busquedaInventario.trim()) return items;

    return items.filter(item =>
      item.nombre.toLowerCase().includes(busquedaInventario.toLowerCase())
    );
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
    if (existencia <= 0) return "#DC3545";
    if (existencia <= 10) return "#FFC107";
    return "#28A745";
  };

  const getStatusText = (existencia) => {
    if (existencia <= 0) return "Sin existencia";
    if (existencia <= 10) return "Existencia baja";
    return "Disponible";
  };

  const renderInventarioItem = (item, tipo) => (
    <View key={`${tipo}-${item.id}`} style={styles.inventarioCard}>
      <View style={styles.inventarioRow}>
        {/* Nombre */}
        <View style={styles.columnItem}>
          <Text style={styles.itemName}>{item.nombre}</Text>
        </View>

        {/* Existencia */}
        <View style={styles.columnItem}>
          <Text style={styles.itemLabel}>Existencia:</Text>
          <Text style={styles.itemValue}>{item.existencia}</Text>
        </View>

        {/* Unidad */}
        <View style={styles.columnItem}>
          <Text style={styles.itemLabel}>Unidad:</Text>
          <Text style={styles.itemValue}>{item.unidad}</Text>
        </View>

        {/* Tipo */}
        <View style={styles.columnItem}>
          <Text style={styles.itemLabel}>Tipo:</Text>
          <Text style={styles.itemValue}>
            {tipo === "productos" ? "Producto" : "Materia Prima"}
          </Text>
        </View>

        {/* Estado */}
        <View style={styles.columnItem}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              { backgroundColor: getStatusColor(item.existencia) },
            ]}
            disabled
          >
            <Text style={styles.statusButtonText}>
              {getStatusText(item.existencia)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Acción */}
        <View style={styles.columnItem}>
          <TouchableOpacity
            style={styles.historialButton}
            onPress={() => verHistorial(item)}
          >
            <View style={styles.buttonContent}>
              <Image
                source={require('../../../../../assets/historial.png')}
                style={styles.buttonIcon}
              />
              <Text style={styles.historialButtonText}>Ver Historial</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderHistorialItem = (item, index) => (
    <View key={index} style={styles.historialItem}>
      <View style={styles.historialHeader}>
        <Text
          style={[
            styles.historialTipo,
            { color: item.tipo === "entrada" ? "#28A745" : "#DC3545" },
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

  const productosFiltrados = getItemsFiltrados(inventarioData.productos);
  const materiasPrimasFiltradas = getItemsFiltrados(inventarioData.materias_primas);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.mainTitle}>Inventario del Restaurante</Text>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en Inventario..."
            value={busquedaInventario}
            onChangeText={setBusquedaInventario}
          />
        </View>

        {/* Sección de Productos */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image
              source={require('../../../../../assets/gestionP.png')}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>
              Productos ({productosFiltrados.length})
            </Text>
          </View>

          {productosFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>
              {busquedaInventario.trim() !== ""
                ? "No se encontraron productos que coincidan con la búsqueda"
                : "No hay productos en inventario"
              }
            </Text>
          ) : (
            productosFiltrados.map((item) =>
              renderInventarioItem(item, "productos")
            )
          )}
        </View>

        {/* Sección de Materias Primas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Image
              source={require('../../../../../assets/gestionMP.png')}
              style={styles.sectionIcon}
            />
            <Text style={styles.sectionTitle}>
              Materias Primas ({materiasPrimasFiltradas.length})
            </Text>
          </View>

          {materiasPrimasFiltradas.length === 0 ? (
            <Text style={styles.emptyText}>
              {busquedaInventario.trim() !== ""
                ? "No se encontraron materias primas que coincidan con la búsqueda"
                : "No hay materias primas en inventario"
              }
            </Text>
          ) : (
            materiasPrimasFiltradas.map((item) =>
              renderInventarioItem(item, "materias_primas")
            )
          )}
        </View>
      </ScrollView>

      {/* Modal de Historial */}
      <Modal visible={historialVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
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
  // === CONTENEDOR PRINCIPAL ===
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

  // === TÍTULOS ===
  mainTitle: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    color: "#1F2937",
  },
  loadingText: {
    fontSize: 18,
    color: "#6C757D",
  },

  // === BUSCADOR ===
  searchContainer: {
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  searchInput: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "#2D9966",
    borderRadius: 20,
    padding: 12,
    fontSize: 18,
    backgroundColor: "#ECFDF5",
  },

  // === SECCIONES ===
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: "#E9ECEF",
  },
  sectionIcon: {
    width: 40,
    height: 40,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#495057",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6C757D",
    fontStyle: "italic",
    marginVertical: 20,
  },

  // === TARJETAS DE INVENTARIO ===
  inventarioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inventarioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  columnItem: {
    flex: 1,
    minWidth: 150,
  },
  itemName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  itemLabel: {
    fontSize: 17,
    fontWeight: "600",
    color: "#555555",
    marginBottom: 2,
  },
  itemValue: {
    fontSize: 17,
    color: "#374151",
  },

  // === BOTONES DE ESTADO ===
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
  },

  // === BOTONES DE ACCIÓN ===
  historialButton: {
    backgroundColor: "#4048B5",
    padding: 7,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  historialButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },

  // === MODAL ===
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2C3E50",
  },

  // === HISTORIAL ===
  historialScrollView: {
    maxHeight: 400,
    marginBottom: 20,
  },
  historialItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#17A2B8",
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
    color: "#6C757D",
  },
  historialCantidad: {
    fontSize: 14,
    marginBottom: 3,
    color: "#495057",
  },
  historialDescripcion: {
    fontSize: 12,
    color: "#6C757D",
    fontStyle: "italic",
  },
  emptyHistorialText: {
    textAlign: "center",
    fontSize: 16,
    color: "#6C757D",
    fontStyle: "italic",
    marginVertical: 20,
  },

  // === BOTÓN CERRAR ===
  closeButton: {
    backgroundColor: "#F44336",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});