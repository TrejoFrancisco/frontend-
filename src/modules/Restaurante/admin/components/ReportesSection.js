import React, { useState, useEffect, useCallback } from "react";
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
// Importar desde la API legacy para evitar el warning
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { API } from "../../../../services/api";

const ReportesSection = ({ token, navigation }) => {
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

      if (!excelUrl || !filename) {
        throw new Error("URL o nombre de archivo no válidos");
      }

      const downloadDir = FileSystem.documentDirectory;
      const fileUri = downloadDir + filename;

      console.log("Descargando desde:", excelUrl);
      console.log("Guardando en:", fileUri);

      const downloadResult = await FileSystem.downloadAsync(excelUrl, fileUri);

      if (downloadResult.status === 200) {
        Alert.alert(
          "Descarga Exitosa",
          `El archivo Excel se ha descargado correctamente.`,
          [
            {
              text: "Compartir",
              onPress: async () => {
                try {
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadResult.uri);
                  } else {
                    Alert.alert(
                      "Info",
                      "Compartir no está disponible en este dispositivo"
                    );
                  }
                } catch (shareError) {
                  console.error("Error al compartir:", shareError);
                  Alert.alert("Error", "No se pudo compartir el archivo");
                }
              },
            },
            { text: "OK" },
          ]
        );
      } else {
        throw new Error(
          `Error en la descarga. Status: ${downloadResult.status}`
        );
      }
    } catch (error) {
      console.error("Error descargando Excel:", error);
      Alert.alert(
        "Error de Descarga",
        `No se pudo descargar el archivo Excel. ${
          error.message || "Inténtalo de nuevo."
        }`,
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
        setUsuarios(
          Array.isArray(usuariosResponse.data.data)
            ? usuariosResponse.data.data
            : []
        );
      } else {
        setUsuarios([]);
      }

      if (categoriasResponse.data.success) {
        setCategorias(
          Array.isArray(categoriasResponse.data.data)
            ? categoriasResponse.data.data
            : []
        );
      } else {
        setCategorias([]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Error al cargar usuarios y categorías");
      setUsuarios([]);
      setCategorias([]);

      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => navigation?.navigate("Login") }]
        );
      }
    } finally {
      setLoadingData(false);
    }
  };

  // Función para generar el reporte de entregas por usuario
  const generarReporteEntregas = async (format = "json") => {
    if (!selectedUserId) {
      setError("Por favor selecciona un usuario");
      Alert.alert("Error", "Por favor selecciona un usuario");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
      };

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

        if (format === "excel" && response.data.data?.excel_url) {
          await downloadExcel(
            response.data.data.excel_url,
            response.data.data.filename || "reporte_entregas.xlsx"
          );
        }
      } else {
        setError(
          response.data.message || "Error al generar el reporte de entregas"
        );
      }
    } catch (error) {
      console.error("Error generating deliveries report:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Error al generar el reporte de entregas";
      setError(errorMessage);

      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => navigation?.navigate("Login") }]
        );
      }
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

        if (format === "excel" && response.data.data?.excel_url) {
          await downloadExcel(
            response.data.data.excel_url,
            response.data.data.filename || "reporte_ventas.xlsx"
          );
        }
      } else {
        setError(
          response.data.message || "Error al generar el reporte de ventas"
        );
      }
    } catch (error) {
      console.error("Error generating sales report:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Error al generar el reporte de ventas";
      setError(errorMessage);

      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => navigation?.navigate("Login") }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const generarReporteInventario = async (format = "json") => {
    try {
      setLoading(true);
      setError(null);

      const dataToSend = {
        fecha_inicio: fechaInicio.toISOString().split("T")[0],
        fecha_fin: fechaFin.toISOString().split("T")[0],
      };

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

        if (format === "excel" && response.data.data?.excel_url) {
          await downloadExcel(
            response.data.data.excel_url,
            response.data.data.filename || "reporte_inventario.xlsx"
          );
        }
      } else {
        setError(
          response.data.message || "Error al generar el reporte de inventario"
        );
      }
    } catch (error) {
      console.error("Error generating inventory report:", error);
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Error al generar el reporte de inventario";
      setError(errorMessage);

      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => navigation?.navigate("Login") }]
        );
      }
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

        if (format === "excel" && response.data.data?.excel_url) {
          await downloadExcel(
            response.data.data.excel_url,
            response.data.data.filename || "reporte_comandas.xlsx"
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

      if (error.response?.status === 401) {
        Alert.alert(
          "Sesión expirada",
          "Tu sesión ha expirado. Por favor inicia sesión nuevamente.",
          [{ text: "OK", onPress: () => navigation?.navigate("Login") }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para generar reporte según la pestaña activa
  const generarReporte = useCallback(
    (format = "json") => {
      if (activeTab === "ventas") {
        generarReporteVentas(format);
      } else if (activeTab === "inventario") {
        generarReporteInventario(format);
      } else if (activeTab === "comandas") {
        generarReporteComandas(format);
      } else {
        generarReporteEntregas(format);
      }
    },
    [activeTab, fechaInicio, fechaFin, selectedUserId]
  );

  // Función para limpiar reportes
  const limpiarReporte = useCallback(() => {
    setReporteData(null);
    setInventarioData(null);
    setEntregasData(null);
    setComandasData(null);
    setError(null);
    setFechaInicio(new Date());
    setFechaFin(new Date());
    setSelectedUserId(null);
  }, []);

  // Handlers para los date pickers
  const onChangeFechaInicio = useCallback((event, selectedDate) => {
    setShowDatePickerInicio(Platform.OS === "ios");
    if (selectedDate) {
      setFechaInicio(selectedDate);
    }
  }, []);

  const onChangeFechaFin = useCallback((event, selectedDate) => {
    setShowDatePickerFin(Platform.OS === "ios");
    if (selectedDate) {
      setFechaFin(selectedDate);
    }
  }, []);

  // Función para formatear fecha
  const formatearFecha = useCallback((fecha) => {
    if (!fecha) return "Fecha no disponible";
    try {
      return fecha.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Fecha inválida";
    }
  }, []);

  // Función para formatear fecha y hora
  const formatearFechaHora = useCallback((fechaString) => {
    if (!fechaString) return "Fecha no disponible";
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formateando fecha y hora:", error);
      return "Fecha inválida";
    }
  }, []);

  const formatearEstadoComanda = useCallback((estado) => {
    const estados = {
      abierta: { emoji: "🟡", texto: "Abierta" },
      cerrada: { emoji: "🔴", texto: "Cerrada" },
      pagada: { emoji: "🟢", texto: "Pagada" },
      cancelada: { emoji: "❌", texto: "Cancelada" },
    };
    return estados[estado] || { emoji: "⚪", texto: estado || "Desconocido" };
  }, []);

  const formatearEstadoProducto = useCallback((estado) => {
    const estados = {
      pendiente: { emoji: "🟡", texto: "Pendiente" },
      entregado: { emoji: "🔵", texto: "Entregado" },
      cancelado: { emoji: "🔴", texto: "Cancelado" },
    };
    return estados[estado] || { emoji: "⚪", texto: estado || "Desconocido" };
  }, []);

  // Cargar datos cuando se selecciona la pestaña de entregas
  useEffect(() => {
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
                {Array.isArray(usuarios) && usuarios.length > 0
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
                            {usuario.name || "Sin nombre"}
                          </Text>
                          <Text
                            style={[
                              styles.userRole,
                              selectedUserId === usuario.id &&
                                styles.selectedUserRole,
                            ]}
                          >
                            {usuario.categoria_nombre || "Sin categoría"} |{" "}
                            {usuario.rol || "Sin rol"}
                          </Text>
                          <Text
                            style={[
                              styles.userEmail,
                              selectedUserId === usuario.id &&
                                styles.selectedUserEmail,
                            ]}
                          >
                            {usuario.email || "Sin email"}
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

        {/* Botones de acción */}
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
              {downloadingExcel ? "Descargando..." : "📊 Descargar Excel"}
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
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>📊 Reporte de Ventas</Text>
            <Text style={styles.reportDateRange}>
              Del {reporteData.rango?.inicio || "N/A"} al{" "}
              {reporteData.rango?.fin || "N/A"}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {reporteData.total_comandas || 0}
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

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🏆 Productos Más Vendidos</Text>
            {Array.isArray(reporteData.productos_mas_vendidos) &&
            reporteData.productos_mas_vendidos.length > 0 ? (
              reporteData.productos_mas_vendidos.map((item, index) => (
                <View
                  key={item.producto_id || index}
                  style={styles.productItem}
                >
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>
                      {item.producto?.nombre || "Producto sin nombre"}
                    </Text>
                    <Text style={styles.productQuantity}>
                      Vendidos: {item.total || 0}
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

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>❌ Productos Cancelados</Text>
            {Array.isArray(reporteData.productos_cancelados) &&
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
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>📦 Reporte de Inventario</Text>
            <Text style={styles.reportDateRange}>
              Del {inventarioData.rango?.inicio || "N/A"} al{" "}
              {inventarioData.rango?.fin || "N/A"}
            </Text>
          </View>

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

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              🍽️ Productos Sin Receta (Salidas)
            </Text>
            {Array.isArray(inventarioData.productos_sin_receta) &&
            inventarioData.productos_sin_receta.length > 0 ? (
              inventarioData.productos_sin_receta.map((item, index) => (
                <View
                  key={item.producto_id || index}
                  style={styles.inventoryItem}
                >
                  <View style={styles.inventoryIcon}>
                    <Text style={styles.inventoryIconText}>🍽️</Text>
                  </View>
                  <View style={styles.inventoryInfo}>
                    <Text style={styles.inventoryProductName}>
                      {item.producto?.nombre || "Producto sin nombre"}
                    </Text>
                    <Text style={styles.inventoryDetails}>
                      Cantidad salida: {item.total_salidas || 0}{" "}
                      {item.producto?.unidad || "unidades"}
                    </Text>
                  </View>
                  <View style={styles.inventoryBadge}>
                    <Text style={styles.inventoryBadgeText}>
                      {item.total_salidas || 0}
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

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>
              🥕 Materias Primas (Salidas)
            </Text>
            {Array.isArray(inventarioData.materias_primas) &&
            inventarioData.materias_primas.length > 0 ? (
              inventarioData.materias_primas.map((item, index) => (
                <View
                  key={item.materia_prima_id || index}
                  style={styles.inventoryItem}
                >
                  <View style={styles.inventoryIcon}>
                    <Text style={styles.inventoryIconText}>🥕</Text>
                  </View>
                  <View style={styles.inventoryInfo}>
                    <Text style={styles.inventoryProductName}>
                      {item.materia_prima?.nombre || "Materia prima sin nombre"}
                    </Text>
                    <Text style={styles.inventoryDetails}>
                      Cantidad salida: {item.total_salidas || 0}{" "}
                      {item.materia_prima?.unidad || "unidades"}
                    </Text>
                  </View>
                  <View style={styles.inventoryBadge}>
                    <Text style={styles.inventoryBadgeText}>
                      {item.total_salidas || 0}
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
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>🚚 Reporte de Entregas</Text>
            <Text style={styles.reportDateRange}>
              Del {entregasData.rango?.inicio || "N/A"} al{" "}
              {entregasData.rango?.fin || "N/A"}
            </Text>
            <Text style={styles.reportUserInfo}>
              Usuario: {entregasData.usuario?.categoria || "N/A"}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {entregasData.total_productos_entregados || 0}
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
                {Array.isArray(entregasData.productos)
                  ? entregasData.productos
                      .reduce(
                        (total, item) =>
                          total + parseFloat(item.producto_precio || 0),
                        0
                      )
                      .toLocaleString()
                  : 0}
              </Text>
              <Text style={styles.statLabel}>Valor Total</Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📋 Productos Entregados</Text>
            {Array.isArray(entregasData.productos) &&
            entregasData.productos.length > 0 ? (
              entregasData.productos.map((item, index) => (
                <View
                  key={item.comanda_producto_id || index}
                  style={styles.deliveryItem}
                >
                  <View style={styles.deliveryIcon}>
                    <Text style={styles.deliveryIconText}>🍽️</Text>
                  </View>
                  <View style={styles.deliveryInfo}>
                    <Text style={styles.deliveryProductName}>
                      {item.producto_nombre || "Sin nombre"}
                    </Text>
                    <Text style={styles.deliveryProductCode}>
                      Clave: {item.producto_clave || "N/A"}
                    </Text>
                    <Text style={styles.deliveryDetails}>
                      Mesa: {item.mesa || "N/A"} | Comensal:{" "}
                      {item.comensal || "N/A"}
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
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>
              📋 Reporte Detallado de Comandas
            </Text>
            <Text style={styles.reportDateRange}>
              Del {comandasData.rango?.inicio || "N/A"} al{" "}
              {comandasData.rango?.fin || "N/A"}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {comandasData.total_comandas || 0}
              </Text>
              <Text style={styles.statLabel}>Total Comandas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {comandasData.total_productos || 0}
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

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📋 Detalle de Comandas</Text>
            {Array.isArray(comandasData.comandas) &&
            comandasData.comandas.length > 0 ? (
              comandasData.comandas.map((comanda, index) => {
                const estadoComanda = formatearEstadoComanda(comanda.estado);
                return (
                  <View
                    key={comanda.comanda_id || index}
                    style={styles.comandaCard}
                  >
                    <View style={styles.comandaHeader}>
                      <View style={styles.comandaInfo}>
                        <Text style={styles.comandaTitle}>
                          Mesa {comanda.mesa || "N/A"}
                        </Text>
                      </View>

                      <View style={styles.comandaInfo}>
                        <Text style={styles.comandaDetailText}>
                          👤 {comanda.mesero || "No asignado"}
                        </Text>
                      </View>

                      <View style={styles.comandaInfo}>
                        <Text style={styles.comandaDetailText}>
                          {formatearFechaHora(comanda.fecha)}
                        </Text>
                        {comanda.fecha_cierre && (
                          <Text style={styles.comandaDetailText}>
                            Cerrada: {formatearFechaHora(comanda.fecha_cierre)}
                          </Text>
                        )}
                      </View>

                      <View style={styles.comandaInfo}>
                        <Text style={styles.comandaDetailText}>
                          ${parseFloat(comanda.total || 0).toFixed(2)}
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

                    <View style={styles.productosContainer}>
                      <Text style={styles.productosTitle}>
                        🍽️ Productos (
                        {Array.isArray(comanda.productos)
                          ? comanda.productos.length
                          : 0}
                        ):
                      </Text>
                      <View style={styles.comandaDetails}>
                        {Array.isArray(comanda.productos) &&
                          comanda.productos.map((producto, prodIndex) => {
                            const estadoProducto = formatearEstadoProducto(
                              producto.estado
                            );
                            return (
                              <View key={prodIndex} style={styles.productoItem}>
                                <View style={styles.productoInfo}>
                                  <Text style={styles.productoNombre}>
                                    {producto.nombre || "Sin nombre"}
                                  </Text>
                                  <Text style={styles.productoPrecio}>
                                    $
                                    {parseFloat(
                                      producto.precio_venta || 0
                                    ).toFixed(2)}
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
    fontSize: 30,
    fontWeight: "bold",
    color: "#1A1A2E",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
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
    fontSize: 18,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 15,
    textAlign: "center",
  },
  dateInputContainer: {
    marginBottom: 15,
  },
  dateInputLabel: {
    fontSize: 18,
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
  userSelectorContainer: {
    marginBottom: 20,
  },
  userSelectorLabel: {
    fontSize: 18,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  selectedUserText: {
    color: "#FFFFFF",
  },
  userRole: {
    fontSize: 17,
    color: "#666",
    marginTop: 2,
  },
  selectedUserRole: {
    color: "#E8E8E8",
  },
  userEmail: {
    fontSize: 17,
    color: "#888",
    marginTop: 1,
  },
  selectedUserEmail: {
    color: "#C8C8C8",
  },
  selectedIndicator: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#28a745",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIndicatorText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  noUsersText: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 20,
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
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
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
  reportUserInfo: {
    fontSize: 17,
    color: "#E8E8E8",
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    minWidth: 80,
    flex: 1,
    marginHorizontal: 5,
    minHeight: 80,
    justifyContent: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A2E",
    textAlign: "center",
    flexWrap: "wrap",
  },
  statLabel: {
    fontSize: 20,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
    flexWrap: "wrap",
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 20,
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
  comandaCard: {
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
  comandaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  comandaInfo: {
    flex: 1,
    minWidth: 120,
  },
  comandaTitle: {
    fontWeight: "bold",
    fontSize: 25,
    color: "#000",
    marginBottom: 2,
  },
  comandaDetailText: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#000",
  },
  estadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: "#e9ecef",
  },
  estadoEmoji: {
    fontSize: 16,
    marginRight: 5,
  },
  estadoText: {
    color: "#2c3e50",
    fontSize: 15,
    fontWeight: "bold",
  },
  productosContainer: {
    marginBottom: 18,
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 8,
  },
  productosTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#2c3e50",
  },
  comandaDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  productoItem: {
    width: 180,
    marginRight: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
  },
  productoNombre: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
    marginRight: 8,
  },
  productoPrecio: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#28a745",
  },
  productoEstado: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#e9ecef",
    marginTop: 4,
  },
  productoEstadoEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  productoEstadoText: {
    color: "#2c3e50",
    fontSize: 13,
    fontWeight: "bold",
  },
});
