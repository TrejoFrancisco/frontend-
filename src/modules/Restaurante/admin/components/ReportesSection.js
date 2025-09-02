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
  Linking,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { API } from "../../../../services/api";

const ReportesSection = ({ token }) => {
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState(null);
  const [inventarioData, setInventarioData] = useState(null);
  const [entregasData, setEntregasData] = useState(null);
  const [comandasData, setComandasData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("ventas");

  // Estados para las fechas
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [showDatePickerInicio, setShowDatePickerInicio] = useState(false);
  const [showDatePickerFin, setShowDatePickerFin] = useState(false);

  // Estados para el reporte de entregas
  const [usuarios, setUsuarios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  // Estado para la descarga de Excel
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  // Función para descargar Excel
  const downloadExcel = async (excelUrl, filename) => {
    try {
      setDownloadingExcel(true);

      const downloadDir = FileSystem.documentDirectory;
      const fileUri = downloadDir + filename;

      const downloadResult = await FileSystem.downloadAsync(excelUrl, fileUri);

      if (downloadResult.status === 200) {
        Alert.alert(
          "Descarga Exitosa",
          `El archivo Excel se ha descargado correctamente.`,
          [
            {
              text: "Compartir",
              onPress: async () => {
                if (await Sharing.isAvailableAsync()) {
                  await Sharing.shareAsync(downloadResult.uri);
                }
              },
            },
            { text: "OK" },
          ]
        );
      } else {
        throw new Error("Error en la descarga");
      }
    } catch (error) {
      console.error("Error descargando Excel:", error);
      Alert.alert(
        "Error de Descarga",
        "No se pudo descargar el archivo Excel. Inténtalo de nuevo.",
        [{ text: "OK" }]
      );
    } finally {
      setDownloadingExcel(false);
    }
  };

  // Función para cargar usuarios y categorías
  const cargarDatosEntregas = async () => {
    try {
      setLoadingData(true);

      const [usuariosResponse, categoriasResponse] = await Promise.all([
        API.get("/restaurante/admin/usuarios", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        API.get("/restaurante/admin/categorias", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usuariosResponse.data.success) {
        setUsuarios(usuariosResponse.data.data || []);
      } else {
        setUsuarios([]);
      }

      if (categoriasResponse.data.success) {
        setCategorias(categoriasResponse.data.data || []);
      } else {
        setCategorias([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Error al cargar usuarios y categorías");
      setUsuarios([]);
      setCategorias([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Función para generar el reporte de entregas por usuario
  const generarReporteEntregas = async (format = "json") => {
    if (!selectedUserId) {
      setError("Por favor selecciona un usuario");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
      };

      // Agregar parámetro format si se solicita Excel
      const url =
        format === "excel"
          ? `/restaurante/admin/reporte-usuario/${selectedUserId}?format=excel`
          : `/restaurante/admin/reporte-usuario/${selectedUserId}`;

      const response = await API.post(url, dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setEntregasData(response.data.data);
        setReporteData(null);
        setInventarioData(null);
        setComandasData(null);

        // Si hay URL de Excel, descargar automáticamente
        if (format === "excel" && response.data.data.excel_url) {
          await downloadExcel(
            response.data.data.excel_url,
            response.data.data.filename
          );
        }
      } else {
        setError(
          response.data.message || "Error al generar el reporte de entregas"
        );
      }
    } catch (error) {
      console.error("Error generating deliveries report:", error);
      setError(
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Error al generar el reporte de entregas"
      );
    } finally {
      setLoading(false);
    }
  };

  const generarReporteVentas = async (format = "json") => {
    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
      };

      // Agregar parámetro format si se solicita Excel
      const url =
        format === "excel"
          ? "/restaurante/admin/reporte-fechas?format=excel"
          : "/restaurante/admin/reporte-fechas";

      const response = await API.post(url, dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setReporteData(response.data.data);
        setInventarioData(null);
        setEntregasData(null);
        setComandasData(null);

        // Si hay URL de Excel, descargar automáticamente
        if (format === "excel" && response.data.data.excel_url) {
          await downloadExcel(
            response.data.data.excel_url,
            response.data.data.filename
          );
        }
      } else {
        setError(
          response.data.message || "Error al generar el reporte de ventas"
        );
      }
    } catch (error) {
      console.error("Error generating sales report:", error);
      setError(
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Error al generar el reporte de ventas"
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para generar el reporte de inventario
  const generarReporteInventario = async (format = "json") => {
    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
      };

      // Agregar parámetro format si se solicita Excel
      const url =
        format === "excel"
          ? "/restaurante/admin/reporte-inventario?format=excel"
          : "/restaurante/admin/reporte-inventario";

      const response = await API.post(url, dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setInventarioData(response.data.data);
        setReporteData(null);
        setEntregasData(null);
        setComandasData(null);

        // Si hay URL de Excel, descargar automáticamente
        if (format === "excel" && response.data.data.excel_url) {
          await downloadExcel(
            response.data.data.excel_url,
            response.data.data.filename
          );
        }
      } else {
        setError(
          response.data.message || "Error al generar el reporte de inventario"
        );
      }
    } catch (error) {
      console.error("Error generating inventory report:", error);
      setError(
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Error al generar el reporte de inventario"
      );
    } finally {
      setLoading(false);
    }
  };

  const generarReporteComandas = async (format = "json") => {
    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
      };

      console.log("Enviando datos para reporte de comandas:", dataToSend);

      // Agregar parámetro format si se solicita Excel
      const url =
        format === "excel"
          ? "/restaurante/admin/reporte-comandas?format=excel"
          : "/restaurante/admin/reporte-comandas";

      const response = await API.post(url, dataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Respuesta del reporte de comandas:", response.data);

      if (response.data.success) {
        setComandasData(response.data.data);
        setReporteData(null);
        setInventarioData(null);
        setEntregasData(null);

        // Si hay URL de Excel, descargar automáticamente
        if (format === "excel" && response.data.data.excel_url) {
          await downloadExcel(
            response.data.data.excel_url,
            response.data.data.filename
          );
        }
      } else {
        setError(
          response.data.message || "Error al generar el reporte de comandas"
        );
      }
    } catch (error) {
      console.error("Error generating commands report:", error);
      console.error("Error details:", error.response?.data);

      let errorMessage = "Error al generar el reporte de comandas";

      if (error.response?.data?.error?.details) {
        errorMessage = `Error del servidor: ${error.response.data.error.details}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = `Error de conexión: ${error.message}`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para generar reporte según la pestaña activa
  const generarReporte = (format = "json") => {
    if (activeTab === "ventas") {
      generarReporteVentas(format);
    } else if (activeTab === "inventario") {
      generarReporteInventario(format);
    } else if (activeTab === "comandas") {
      generarReporteComandas(format);
    } else {
      generarReporteEntregas(format);
    }
  };

  // Función para limpiar reportes
  const limpiarReporte = () => {
    setReporteData(null);
    setInventarioData(null);
    setEntregasData(null);
    setComandasData(null);
    setError(null);
    setFechaInicio(new Date());
    setFechaFin(new Date());
    setSelectedUserId(null);
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

  // Función para formatear fecha y hora
  const formatearFechaHora = (fechaString) => {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatearEstadoComanda = (estado) => {
    const estados = {
      abierta: { emoji: "🟡", texto: "Abierta" },
      cerrada: { emoji: "🔴", texto: "Cerrada" },
      pagada: { emoji: "🟢", texto: "Pagada" },
      cancelada: { emoji: "❌", texto: "Cancelada" },
    };
    return estados[estado] || { emoji: "⚪", texto: estado };
  };

  const formatearEstadoProducto = (estado) => {
    const estados = {
      pendiente: { emoji: "🟡", texto: "Pendiente" },
      entregado: { emoji: "🔵", texto: "Entregado" },
      cancelado: { emoji: "🔴", texto: "Cancelado" },
    };
    return estados[estado] || { emoji: "⚪", texto: estado };
  };

  // Cargar datos cuando se selecciona la pestaña de entregas
  React.useEffect(() => {
    if (activeTab === "entregas" && (!usuarios || usuarios.length === 0)) {
      cargarDatosEntregas();
    }
  }, [activeTab]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Reportes</Text>
        <Text style={styles.subtitle}>
          Genera reportes seleccionando un rango de fechas
        </Text>
      </View>

      {/* Pestañas - Diseño 2x2 */}
      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "ventas" && styles.activeTab]}
            onPress={() => setActiveTab("ventas")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "ventas" && styles.activeTabText,
              ]}
            >
              📊 Ventas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "inventario" && styles.activeTab]}
            onPress={() => setActiveTab("inventario")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "inventario" && styles.activeTabText,
              ]}
            >
              📦 Inventario
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "entregas" && styles.activeTab]}
            onPress={() => setActiveTab("entregas")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "entregas" && styles.activeTabText,
              ]}
            >
              🚚 Entregas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "comandas" && styles.activeTab]}
            onPress={() => setActiveTab("comandas")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "comandas" && styles.activeTabText,
              ]}
            >
              📋 Comandas
            </Text>
          </TouchableOpacity>
        </View>
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

        {/* Selector de usuario para entregas */}
        {activeTab === "entregas" && (
          <View style={styles.userSelectorContainer}>
            <Text style={styles.userSelectorLabel}>Seleccionar Usuario:</Text>
            {loadingData ? (
              <View style={styles.loadingUserContainer}>
                <ActivityIndicator size="small" color="#1A1A2E" />
                <Text style={styles.loadingUserText}>Cargando usuarios...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.userScrollContainer}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {usuarios && usuarios.length > 0
                  ? usuarios.map((usuario) => (
                    <TouchableOpacity
                      key={usuario.id}
                      style={[
                        styles.userOption,
                        selectedUserId === usuario.id &&
                        styles.selectedUserOption,
                      ]}
                      onPress={() => setSelectedUserId(usuario.id)}
                    >
                      <View style={styles.userInfo}>
                        <Text
                          style={[
                            styles.userName,
                            selectedUserId === usuario.id &&
                            styles.selectedUserText,
                          ]}
                        >
                          {usuario.name}
                        </Text>
                        <Text
                          style={[
                            styles.userRole,
                            selectedUserId === usuario.id &&
                            styles.selectedUserRole,
                          ]}
                        >
                          {usuario.categoria_nombre} | {usuario.rol}
                        </Text>
                        <Text
                          style={[
                            styles.userEmail,
                            selectedUserId === usuario.id &&
                            styles.selectedUserEmail,
                          ]}
                        >
                          {usuario.email}
                        </Text>
                      </View>
                      {selectedUserId === usuario.id && (
                        <View style={styles.selectedIndicator}>
                          <Text style={styles.selectedIndicatorText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))
                  : !loadingData && (
                    <Text style={styles.noUsersText}>
                      No hay usuarios disponibles
                    </Text>
                  )}
              </ScrollView>
            )}
          </View>
        )}

        {/* Botones de acción - Ahora con 2 botones */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => generarReporte("json")}
            disabled={loading || downloadingExcel}
          >
            <Text style={styles.generateButtonText}>
              {loading
                ? "Generando..."
                : activeTab === "ventas"
                  ? "Ver Reporte de Ventas"
                  : activeTab === "inventario"
                    ? "Ver Reporte de Inventario"
                    : activeTab === "comandas"
                      ? "Ver Reporte de Comandas"
                      : "Ver Reporte de Entregas"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={limpiarReporte}>
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 15 }}>
          <TouchableOpacity
            style={styles.excelButton}
            onPress={() => generarReporte("excel")}
            disabled={loading || downloadingExcel}
          >
            <Text style={styles.excelButtonText}>
              {downloadingExcel ? "Descargando.." : "Descargar"}
            </Text>
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
      {(loading || downloadingExcel) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A2E" />
          <Text style={styles.loadingText}>
            {downloadingExcel ? "Descargando Excel..." : "Generando reporte..."}
          </Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => generarReporte("json")}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Resultados del reporte de ventas */}
      {reporteData && (
        <View style={styles.reportContainer}>
          {/* Header del reporte */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>📊 Reporte de Ventas</Text>
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

      {/* Resultados del reporte de inventario */}
      {inventarioData && (
        <View style={styles.reportContainer}>
          {/* Header del reporte */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>📦 Reporte de Inventario</Text>
            <Text style={styles.reportDateRange}>
              Del {inventarioData.rango.inicio} al {inventarioData.rango.fin}
            </Text>
          </View>

          {/* Estadísticas principales */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {inventarioData.productos_sin_receta?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Productos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {inventarioData.materias_primas?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Materias Primas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {(inventarioData.productos_sin_receta?.length || 0) +
                  (inventarioData.materias_primas?.length || 0)}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Productos sin receta que salieron */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              🍽️ Productos Sin Receta (Salidas)
            </Text>
            {inventarioData.productos_sin_receta &&
              inventarioData.productos_sin_receta.length > 0 ? (
              inventarioData.productos_sin_receta.map((item, index) => (
                <View key={item.producto_id} style={styles.inventoryItem}>
                  <View style={styles.inventoryIcon}>
                    <Text style={styles.inventoryIconText}>🍽️</Text>
                  </View>
                  <View style={styles.inventoryInfo}>
                    <Text style={styles.inventoryProductName}>
                      {item.producto?.nombre || "Producto sin nombre"}
                    </Text>
                    <Text style={styles.inventoryDetails}>
                      Cantidad salida: {item.total_salidas}{" "}
                      {item.producto?.unidad || "unidades"}
                    </Text>
                  </View>
                  <View style={styles.inventoryBadge}>
                    <Text style={styles.inventoryBadgeText}>
                      {item.total_salidas}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No hay salidas de productos sin receta en este período
              </Text>
            )}
          </View>

          {/* Materias primas que salieron */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              🥕 Materias Primas (Salidas)
            </Text>
            {inventarioData.materias_primas &&
              inventarioData.materias_primas.length > 0 ? (
              inventarioData.materias_primas.map((item, index) => (
                <View key={item.materia_prima_id} style={styles.inventoryItem}>
                  <View style={styles.inventoryIcon}>
                    <Text style={styles.inventoryIconText}>🥕</Text>
                  </View>
                  <View style={styles.inventoryInfo}>
                    <Text style={styles.inventoryProductName}>
                      {item.materia_prima?.nombre || "Materia prima sin nombre"}
                    </Text>
                    <Text style={styles.inventoryDetails}>
                      Cantidad salida: {item.total_salidas}{" "}
                      {item.materia_prima?.unidad || "unidades"}
                    </Text>
                  </View>
                  <View style={styles.inventoryBadge}>
                    <Text style={styles.inventoryBadgeText}>
                      {item.total_salidas}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No hay salidas de materias primas en este período
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Resultados del reporte de entregas */}
      {entregasData && (
        <View style={styles.reportContainer}>
          {/* Header del reporte */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>🚚 Reporte de Entregas</Text>
            <Text style={styles.reportDateRange}>
              Del {entregasData.rango.inicio} al {entregasData.rango.fin}
            </Text>
            <Text style={styles.reportUserInfo}>
              Usuario: {entregasData.usuario.categoria}
            </Text>
          </View>

          {/* Estadísticas principales */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {entregasData.total_productos_entregados}
              </Text>
              <Text style={styles.statLabel}>Total Entregas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {entregasData.productos?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Productos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                $
                {entregasData.productos
                  ?.reduce(
                    (total, item) =>
                      total + parseFloat(item.producto_precio || 0),
                    0
                  )
                  .toLocaleString() || 0}
              </Text>
              <Text style={styles.statLabel}>Valor Total</Text>
            </View>
          </View>

          {/* Lista de productos entregados */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📋 Productos Entregados</Text>
            {entregasData.productos && entregasData.productos.length > 0 ? (
              entregasData.productos.map((item, index) => (
                <View
                  key={item.comanda_producto_id}
                  style={styles.deliveryItem}
                >
                  <View style={styles.deliveryIcon}>
                    <Text style={styles.deliveryIconText}>🍽️</Text>
                  </View>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryProductName}>
                      {item.producto_nombre}
                    </Text>
                    <Text style={styles.deliveryProductCode}>
                      Clave: {item.producto_clave}
                    </Text>
                    <Text style={styles.deliveryDetails}>
                      Mesa: {item.mesa} | Comensal: {item.comensal}
                    </Text>
                    <Text style={styles.deliveryDateTime}>
                      Entregado: {formatearFechaHora(item.fecha_entrega)}
                    </Text>
                  </View>
                  <View style={styles.deliveryPriceBadge}>
                    <Text style={styles.deliveryPriceText}>
                      ${parseFloat(item.producto_precio || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No hay productos entregados en este período
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Resultados del reporte de comandas */}
      {comandasData && (
        <View style={styles.reportContainer}>
          {/* Header del reporte */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>
              📋 Reporte Detallado de Comandas
            </Text>
            <Text style={styles.reportDateRange}>
              Del {comandasData.rango.inicio} al {comandasData.rango.fin}
            </Text>
          </View>

          {/* Estadísticas principales */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {comandasData.total_comandas}
              </Text>
              <Text style={styles.statLabel}>Total Comandas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {comandasData.total_productos}
              </Text>
              <Text style={styles.statLabel}>Total Productos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                ${comandasData.total_ingresos?.toLocaleString() || 0}
              </Text>
              <Text style={styles.statLabel}>Ingresos Totales</Text>
            </View>
          </View>

          {/* Lista detallada de comandas */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📋 Detalle de Comandas</Text>
            {comandasData.comandas && comandasData.comandas.length > 0 ? (
              comandasData.comandas.map((comanda, index) => {
                const estadoComanda = formatearEstadoComanda(comanda.estado);
                return (
                  <View key={comanda.comanda_id} style={styles.comandaCard}>
                    {/* Header de la comanda */}
                    <View style={styles.comandaHeader}>
                      <View style={styles.comandaInfo}>
                        <Text style={styles.comandaTitle}>
                          Comanda #{comanda.comanda_id}
                        </Text>
                        <Text style={styles.comandaSubtitle}>
                          Mesa {comanda.mesa} | {comanda.personas} personas
                        </Text>
                      </View>
                      <View style={styles.estadoContainer}>
                        <Text style={styles.estadoEmoji}>
                          {estadoComanda.emoji}
                        </Text>
                        <Text style={styles.estadoText}>
                          {estadoComanda.texto}
                        </Text>
                      </View>
                    </View>

                    {/* Información de la comanda */}
                    <View style={styles.comandaDetails}>
                      <Text style={styles.comandaDetailText}>
                        👤 Mesero: {comanda.mesero || "No asignado"}
                      </Text>
                      <Text style={styles.comandaDetailText}>
                        🕐 Fecha: {formatearFechaHora(comanda.fecha)}
                      </Text>
                      {comanda.fecha_cierre && (
                        <Text style={styles.comandaDetailText}>
                          🕐 Cerrada: {formatearFechaHora(comanda.fecha_cierre)}
                        </Text>
                      )}
                      <Text style={styles.comandaDetailText}>
                        💰 Total: ${parseFloat(comanda.total || 0).toFixed(2)}
                      </Text>
                    </View>

                    {/* Lista de productos */}
                    <View style={styles.productosContainer}>
                      <Text style={styles.productosTitle}>🍽️ Productos:</Text>
                      {comanda.productos.map((producto, prodIndex) => {
                        const estadoProducto = formatearEstadoProducto(
                          producto.estado
                        );
                        return (
                          <View key={prodIndex} style={styles.productoItem}>
                            <View style={styles.productoInfo}>
                              <Text style={styles.productoNombre}>
                                {producto.nombre}
                              </Text>
                              <Text style={styles.productoPrecio}>
                                $
                                {parseFloat(producto.precio_venta || 0).toFixed(
                                  2
                                )}
                              </Text>
                            </View>
                            <View style={styles.productoEstado}>
                              <Text style={styles.productoEstadoEmoji}>
                                {estadoProducto.emoji}
                              </Text>
                              <Text style={styles.productoEstadoText}>
                                {estadoProducto.texto}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>
                No hay comandas en este período
              </Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ReportesSection;

const styles = StyleSheet.create({
  excelButton: {
    backgroundColor: "#28A745",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  excelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
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
    fontSize: 25,
    fontWeight: "bold",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  // Nuevos estilos para pestañas 2x2
  tabContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    padding: 8,
  },
  tabRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: "center",
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#1A1A2E",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
  },
  activeTabText: {
    color: "#FFFFFF",
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
    justifyContent: "center",

    paddingHorizontal: 20,
    marginTop: 20,
  },

  generateButton: {
    backgroundColor: "#1A1A2E",
    width: 150,
    height: 50,
    borderRadius: 20,
    marginRight: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  generateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  clearButton: {
    backgroundColor: "#328edef5",
    width: 150,
    height: 50,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  clearButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
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
  inventoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#f8f9ff",
    borderRadius: 8,
    marginBottom: 8,
  },
  inventoryIcon: {
    marginRight: 12,
  },
  inventoryIconText: {
    fontSize: 20,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  inventoryDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  inventoryBadge: {
    backgroundColor: "#28a745",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  inventoryBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  userSelectorContainer: {
    marginBottom: 20,
  },
  userSelectorLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  loadingUserContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingUserText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
  },
  userScrollContainer: {
    maxHeight: 250,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  userOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FFFFFF",
    minHeight: 70,
  },
  selectedUserOption: {
    backgroundColor: "#1A1A2E",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  selectedUserText: {
    color: "#FFFFFF",
  },
  userRole: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  selectedUserRole: {
    color: "#E8E8E8",
  },
  userEmail: {
    fontSize: 11,
    color: "#888",
    marginTop: 1,
  },
  selectedUserEmail: {
    color: "#C8C8C8",
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#28a745",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIndicatorText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  noUsersText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  reportUserInfo: {
    fontSize: 14,
    color: "#E8E8E8",
    marginTop: 4,
  },
  deliveryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    marginBottom: 8,
  },
  deliveryIcon: {
    marginRight: 12,
  },
  deliveryIconText: {
    fontSize: 20,
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryProductName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  deliveryProductCode: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  deliveryDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  deliveryDateTime: {
    fontSize: 11,
    color: "#888",
    marginTop: 4,
    fontStyle: "italic",
  },
  deliveryPriceBadge: {
    backgroundColor: "#17a2b8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  deliveryPriceText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 20,
  },
  // Estilos para el reporte de comandas
  comandaCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#1A1A2E",
  },
  comandaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  comandaInfo: {
    flex: 1,
  },
  comandaTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A2E",
  },
  comandaSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  estadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  estadoEmoji: {
    fontSize: 16,
    marginRight: 5,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  comandaDetails: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  comandaDetailText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  productosContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
  },
  productosTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 10,
  },
  productoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 8,
  },
  productoInfo: {
    flex: 1,
  },
  productoNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  productoPrecio: {
    fontSize: 13,
    color: "#28a745",
    fontWeight: "bold",
    marginTop: 2,
  },
  productoEstado: {
    flexDirection: "row",
    alignItems: "center",
  },
  productoEstadoEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  productoEstadoText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
});
