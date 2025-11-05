import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { API } from "../../../../services/api";
import { useAuth } from "../../../../AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useBackHandler } from "../../../../hooks/useBackHandler";
import ComandaPendienteCard from "../../../../modules/Restaurante/Cajero/components/ComandaPendienteCard";
import AperturaCajaModal from "../../../../modules/Restaurante/Cajero/components/AperturaCajaModal";
import PagoComandaModal from "../../../../modules/Restaurante/Cajero/components/PagoComandaModal";
import VerTicketModal from "../../../../modules/Restaurante/Cajero/components/VerTicketModal";
import CierreCajaModal from "../../../../modules/Restaurante/Cajero/components/CierreCajaModal";
import ReporteTurnoModal from "../../../../modules/Restaurante/Cajero/components/ReporteTurnoModal";
import HistorialArqueosModal from "../../../../modules/Restaurante/Cajero/components/HistorialArqueosModal";

export default function CajaSection() {
  const { token, logout, user } = useAuth();
  const navigation = useNavigation();
  useBackHandler(navigation);

  // Estados principales
  const [comandas, setComandas] = useState([]);
  const [comandasUnificadas, setComandasUnificadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [arqueoActual, setArqueoActual] = useState(null);

  // Estados de modales
  const [aperturaModalVisible, setAperturaModalVisible] = useState(false);
  const [pagoModalVisible, setPagoModalVisible] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [cierreModalVisible, setCierreModalVisible] = useState(false);
  const [reporteModalVisible, setReporteModalVisible] = useState(false);

  // Estados para datos seleccionados
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [isTicketUnificado, setIsTicketUnificado] = useState(false);

  const [historialModalVisible, setHistorialModalVisible] = useState(false);

  // ✅ CORREGIDO: Verificar estado de la caja
  const verificarEstadoCaja = useCallback(async () => {
    try {
      const response = await API.get("/restaurante/cajero/reporte-turno", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setCajaAbierta(true);
        setArqueoActual(response.data.data.arqueo);
      }
    } catch (error) {
      // Si hay error 404, significa que no hay caja abierta
      if (error.response?.status === 404) {
        setCajaAbierta(false);
        setArqueoActual(null);
      } else {
        // Otros errores (403, 500, etc.)
        console.log("Error al verificar estado de caja:", error);
        Alert.alert(
          "Error",
          error.response?.data?.error?.message || "Error al verificar la caja"
        );
      }
    } finally {
      // ✅ IMPORTANTE: Siempre quitar el loading
      setLoading(false);
    }
  }, [token]);

  // Obtener comandas pendientes de pago
  const fetchComandasPendientes = useCallback(async () => {
    if (!token || !cajaAbierta) {
      return;
    }

    try {
      const response = await API.get(
        "/restaurante/cajero/comandas-pendientes-pago",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setComandas(response.data.data.comandas || []);
        setComandasUnificadas(response.data.data.comandas_unificadas || []);
      }
    } catch (error) {
      console.log("Error al obtener comandas:", error);
      setComandas([]);
      setComandasUnificadas([]);
    }
  }, [token, cajaAbierta]);

  // ✅ CORREGIDO: Cargar datos al montar
  useEffect(() => {
    if (token) {
      setLoading(true);
      verificarEstadoCaja();
    }
  }, [token]);

  // Cargar comandas cuando la caja esté abierta
  useEffect(() => {
    if (cajaAbierta) {
      fetchComandasPendientes();
    }
  }, [cajaAbierta, fetchComandasPendientes]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await verificarEstadoCaja();
    if (cajaAbierta) {
      await fetchComandasPendientes();
    }
    setRefreshing(false);
  }, [verificarEstadoCaja, cajaAbierta, fetchComandasPendientes]);

  // Ver ticket
  const handleVerTicket = useCallback(
    async (comanda, isUnificada) => {
      try {
        const endpoint = isUnificada
          ? `/restaurante/cajero/ticket-unificada/${comanda.id}`
          : `/restaurante/cajero/ticket/${comanda.id}`;

        const response = await API.get(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setTicketData(response.data.data);
          setIsTicketUnificado(isUnificada);
          setTicketModalVisible(true);
        }
      } catch (error) {
        Alert.alert(
          "Error",
          error.response?.data?.error?.message || "Error al obtener ticket"
        );
      }
    },
    [token]
  );

  // Pagar comanda
  const handlePagar = useCallback((comanda, isUnificada) => {
    setSelectedComanda({ ...comanda, isUnificada });
    setPagoModalVisible(true);
  }, []);

  // Abrir caja exitosamente
  const handleAperturaExitosa = useCallback(() => {
    setCajaAbierta(true);
    verificarEstadoCaja();
    fetchComandasPendientes();
  }, [verificarEstadoCaja, fetchComandasPendientes]);

  // Cerrar caja exitosamente
  const handleCierreExitoso = useCallback(() => {
    setCajaAbierta(false);
    setArqueoActual(null);
    setComandas([]);
    setComandasUnificadas([]);
  }, []);

  // Cerrar sesión
  const handleLogout = useCallback(() => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            if (token) {
              try {
                await API.post(
                  "/auth/logout",
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              } catch (error) {
                console.log("Error al hacer logout en servidor:", error);
              }
            }

            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            console.error("Error en logout:", error);
            Alert.alert("Error", "Hubo un problema al cerrar sesión");
          }
        },
      },
    ]);
  }, [token, logout, navigation]);

  // ✅ MEJORADO: Pantalla de carga
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Verificando estado de caja...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerColumns}>
          <View style={styles.leftColumn}>
            <View style={styles.userGreeting}>
              <Image
                source={require("../../../../../assets/saludo.png")}
                style={styles.welcomeIcon}
              />
              <Text style={styles.userWelcome}>Hola, {user?.name}</Text>
            </View>

            {/* Indicador de estado de caja */}
            <View style={styles.estadoCajaContainer}>
              <View
                style={[
                  styles.estadoCajaBadge,
                  cajaAbierta ? styles.cajaAbierta : styles.cajaCerrada,
                ]}
              >
                <Text style={styles.estadoCajaText}>
                  {cajaAbierta ? "🟢 CAJA ABIERTA" : "🔴 CAJA CERRADA"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Image
                source={require("../../../../../assets/cerrarC.png")}
                style={styles.logoutIcon}
              />
              <Text style={styles.logoutButtonText}>Salir</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Contenido principal */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Botones de acción */}
        <View style={styles.headerContainer}>
          <View style={styles.rowWrap}>
            <Text style={styles.contentTitle}>Caja</Text>

            {!cajaAbierta ? (
              <TouchableOpacity
                style={styles.abrirCajaButton}
                onPress={() => setAperturaModalVisible(true)}
              >
                <Text style={styles.abrirCajaButtonText}>🔓 Abrir Caja</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.reporteButton}
                  onPress={() => setReporteModalVisible(true)}
                >
                  <Text style={styles.reporteButtonText}>📊 Reporte</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cerrarCajaButton}
                  onPress={() => setCierreModalVisible(true)}
                >
                  <Text style={styles.cerrarCajaButtonText}>
                    🔒 Cerrar Caja
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.historialButton}
                  onPress={() => setHistorialModalVisible(true)}
                >
                  <Text style={styles.historialButtonText}>📚 Historial</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Contenido según estado de caja */}
        {!cajaAbierta ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Debes abrir la caja</Text>
            <Text style={styles.emptySubtext}>
              Haz clic en "Abrir Caja" para comenzar tu turno
            </Text>
          </View>
        ) : comandas.length === 0 && comandasUnificadas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No hay comandas pendientes de pago
            </Text>
            <Text style={styles.emptySubtext}>
              Las comandas cerradas aparecerán aquí
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Comandas Pendientes de Pago</Text>

            {/* Comandas individuales */}
            {comandas.map((comanda) => (
              <ComandaPendienteCard
                key={`comanda-${comanda.id}`}
                comanda={comanda}
                onVerTicket={handleVerTicket}
                onPagar={handlePagar}
                isUnificada={false}
              />
            ))}

            {/* Comandas unificadas */}
            {comandasUnificadas.length > 0 && (
              <View style={styles.seccionUnificadas}>
                <Text style={styles.seccionUnificadasTitle}>
                  Comandas Unificadas
                </Text>
                {comandasUnificadas.map((comandaUnif) => (
                  <ComandaPendienteCard
                    key={`unificada-${comandaUnif.id}`}
                    comanda={comandaUnif}
                    onVerTicket={handleVerTicket}
                    onPagar={handlePagar}
                    isUnificada={true}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modales */}
      <AperturaCajaModal
        visible={aperturaModalVisible}
        onClose={() => setAperturaModalVisible(false)}
        onSuccess={handleAperturaExitosa}
        token={token}
      />

      <PagoComandaModal
        visible={pagoModalVisible}
        onClose={() => {
          setPagoModalVisible(false);
          setSelectedComanda(null);
        }}
        onSuccess={() => {
          fetchComandasPendientes();
          verificarEstadoCaja();
        }}
        token={token}
        comanda={selectedComanda}
      />

      <VerTicketModal
        visible={ticketModalVisible}
        onClose={() => {
          setTicketModalVisible(false);
          setTicketData(null);
        }}
        ticket={ticketData}
        isUnificada={isTicketUnificado}
      />

      <CierreCajaModal
        visible={cierreModalVisible}
        onClose={() => setCierreModalVisible(false)}
        onSuccess={handleCierreExitoso}
        token={token}
        arqueoId={arqueoActual?.id}
      />

      <ReporteTurnoModal
        visible={reporteModalVisible}
        onClose={() => setReporteModalVisible(false)}
        token={token}
      />

      <HistorialArqueosModal
        visible={historialModalVisible}
        onClose={() => setHistorialModalVisible(false)}
        token={token}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    marginBottom: 60,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  topHeader: {
    backgroundColor: "#fff",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 12,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerColumns: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    alignItems: "flex-end",
  },
  userGreeting: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  welcomeIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  userWelcome: {
    fontSize: 25,
    color: "#333",
    fontWeight: "bold",
    maxWidth: 195,
  },
  estadoCajaContainer: {
    marginTop: 4,
  },
  estadoCajaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  cajaAbierta: {
    backgroundColor: "#d4edda",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  cajaCerrada: {
    backgroundColor: "#f8d7da",
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  estadoCajaText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutIcon: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  logoutButtonText: {
    fontSize: 22,
    color: "#000000ff",
    fontWeight: "500",
  },
  headerContainer: {
    paddingVertical: 5,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  contentTitle: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  abrirCajaButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 150,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#28a745",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  abrirCajaButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  reporteButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#17a2b8",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  reporteButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  cerrarCajaButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#dc3545",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cerrarCajaButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 100,
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#999",
    fontSize: 15,
  },
  loadingText: {
    fontSize: 20,
    color: "#000000ff",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  seccionUnificadas: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#FFC107",
  },
  seccionUnificadasTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  historialButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 120,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#6f42c1",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  historialButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
});
