import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { API } from "../../../../services/api";

const ReportesSection = ({ token }) => {
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState(null);
  const [error, setError] = useState(null);

  // Estados para las fechas
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);

  // Función para generar el reporte
  const generarReporte = async () => {
    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
      };

      const response = await API.post(
        "/restaurante/admin/reporte-fechas",
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setReporteData(response.data.data);
      } else {
        setError(response.data.message || "Error al generar el reporte");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setError(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Error al generar el reporte"
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar el reporte
  const limpiarReporte = () => {
    setReporteData(null);
    setError(null);
    setFechaInicio(new Date());
    setFechaFin(new Date());
  };

  // Handlers para los date pickers
  const onChangeFechaInicio = (event, selectedDate) => {
    setShowDatePickerInicio(Platform.OS === "ios");
    if (selectedDate) {
      setFechaInicio(selectedDate);
    }
  };

  const onChangeFechaFin = (event, selectedDate) => {
    setShowDatePickerFin(Platform.OS === "ios");
    if (selectedDate) {
      setFechaFin(selectedDate);
    }
  };

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Reportes por Fechas</Text>
        <Text style={styles.subtitle}>
          Genera reportes personalizados seleccionando un rango de fechas
        </Text>
      </View>

      {/* Selector de fechas */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>Seleccionar Rango de Fechas</Text>

        {/* Fecha inicio */}
        <View style={styles.dateInputContainer}>
          <Text style={styles.dateInputLabel}>Fecha de Inicio:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePickerInicio(true)}
          >
            <Text style={styles.dateButtonText}>
              {formatearFecha(fechaInicio)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fecha fin */}
        <View style={styles.dateInputContainer}>
          <Text style={styles.dateInputLabel}>Fecha de Fin:</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePickerFin(true)}
          >
            <Text style={styles.dateButtonText}>
              {formatearFecha(fechaFin)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={generarReporte}
            disabled={loading}
          >
            <Text style={styles.generateButtonText}>
              {loading ? "Generando..." : "Generar Reporte"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={limpiarReporte}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date Pickers */}
      {showDatePickerInicio && (
        <DateTimePicker
          value={fechaInicio}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeFechaInicio}
          maximumDate={new Date()}
        />
      )}

      {showDatePickerFin && (
        <DateTimePicker
          value={fechaFin}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeFechaFin}
          maximumDate={new Date()}
          minimumDate={fechaInicio}
        />
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A2E" />
          <Text style={styles.loadingText}>Generando reporte...</Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generarReporte}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Resultados del reporte */}
      {reporteData && (
        <View style={styles.reportContainer}>
          {/* Header del reporte */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>📊 Reporte Generado</Text>
            <Text style={styles.reportDateRange}>
              Del {reporteData.rango.inicio} al {reporteData.rango.fin}
            </Text>
          </View>

          {/* Estadísticas principales */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {reporteData.total_comandas}
              </Text>
              <Text style={styles.statLabel}>Total Comandas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                ${reporteData.ganancias?.toLocaleString() || 0}
              </Text>
              <Text style={styles.statLabel}>Ganancias</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {reporteData.productos_cancelados?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Cancelados</Text>
            </View>
          </View>

          {/* Productos más vendidos */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🏆 Productos Más Vendidos</Text>
            {reporteData.productos_mas_vendidos &&
            reporteData.productos_mas_vendidos.length > 0 ? (
              reporteData.productos_mas_vendidos.map((item, index) => (
                <View key={item.producto_id} style={styles.productItem}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {item.producto?.nombre || "Producto sin nombre"}
                    </Text>
                    <Text style={styles.productQuantity}>
                      Vendidos: {item.total}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No hay productos vendidos en este período
              </Text>
            )}
          </View>

          {/* Productos cancelados */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>❌ Productos Cancelados</Text>
            {reporteData.productos_cancelados &&
            reporteData.productos_cancelados.length > 0 ? (
              reporteData.productos_cancelados.map((item, index) => (
                <View key={index} style={styles.canceledItem}>
                  <View style={styles.canceledIcon}>
                    <Text style={styles.canceledIconText}>❌</Text>
                  </View>
                  <View style={styles.canceledInfo}>
                    <Text style={styles.canceledProductName}>
                      {item.producto?.nombre || "Producto sin nombre"}
                    </Text>
                    <Text style={styles.canceledDetails}>
                      Comanda: #{item.comanda_id || "N/A"}
                    </Text>
                  </View>
                  <View style={styles.canceledBadge}>
                    <Text style={styles.canceledText}>CANCELADO</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No hay productos cancelados en este período 🎉
              </Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  dateContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 15,
    textAlign: "center",
  },
  dateInputContainer: {
    marginBottom: 15,
  },
  dateInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  dateButton: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#1A1A2E",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  generateButton: {
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
  },
  generateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  clearButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 0.4,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    backgroundColor: "#ffe6e6",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 20,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  reportContainer: {
    marginTop: 20,
  },
  reportHeader: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  reportDateRange: {
    fontSize: 16,
    color: "#E8E8E8",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    flex: 1,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 15,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  rankBadge: {
    backgroundColor: "#1A1A2E",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  productQuantity: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  canceledItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#fff5f5",
    borderRadius: 8,
    marginBottom: 8,
  },
  canceledIcon: {
    marginRight: 12,
  },
  canceledIconText: {
    fontSize: 20,
  },
  canceledInfo: {
    flex: 1,
  },
  canceledProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  canceledDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  canceledBadge: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  canceledText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 20,
  },
});

export default ReportesSection;
