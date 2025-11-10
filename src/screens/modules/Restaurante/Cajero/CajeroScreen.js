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

  // Verificar estado de la caja
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
      if (error.response?.status === 404) {
        setCajaAbierta(false);
        setArqueoActual(null);
      } else {
        console.log("Error al verificar estado de caja:", error);
        Alert.alert(
          "Error",
          error.response?.data?.error?.message || "Error al verificar la caja"
        );
      }
    } finally {
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

  useEffect(() => {
    if (token) {
      setLoading(true);
      verificarEstadoCaja();
    }
  }, [token]);

  useEffect(() => {
    if (cajaAbierta) {
      fetchComandasPendientes();
    }
  }, [cajaAbierta, fetchComandasPendientes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await verificarEstadoCaja();
    if (cajaAbierta) {
      await fetchComandasPendientes();
    }
    setRefreshing(false);
  }, [verificarEstadoCaja, cajaAbierta, fetchComandasPendientes]);

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

  const handlePagar = useCallback((comanda, isUnificada) => {
    setSelectedComanda({ ...comanda, isUnificada });
    setPagoModalVisible(true);
  }, []);

  const handleAperturaExitosa = useCallback(() => {
    setCajaAbierta(true);
    verificarEstadoCaja();
    fetchComandasPendientes();
  }, [verificarEstadoCaja, fetchComandasPendientes]);

  const handleCierreExitoso = useCallback(() => {
    setCajaAbierta(false);
    setArqueoActual(null);
    setComandas([]);
    setComandasUnificadas([]);
  }, []);

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
        {/* Título y botones de acción */}
        <View style={styles.headerContainer}>
          <Text style={styles.contentTitle}>Caja</Text>

          {/* Contenedor de botones mejorado */}
          <View style={styles.botonesAccion}>
            {!cajaAbierta ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.abrirCajaButton]}
                onPress={() => setAperturaModalVisible(true)}
              >
                <Text style={styles.actionButtonIcon}>🔓</Text>
                <Text style={styles.actionButtonText}>Abrir Caja</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.reporteButton]}
                  onPress={() => setReporteModalVisible(true)}
                >
                  <Text style={styles.actionButtonIcon}>📊</Text>
                  <Text style={styles.actionButtonText}>Reporte</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.historialButton]}
                  onPress={() => setHistorialModalVisible(true)}
                >
                  <Text style={styles.actionButtonIcon}>📚</Text>
                  <Text style={styles.actionButtonText}>Historial</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cerrarCajaButton]}
                  onPress={() => setCierreModalVisible(true)}
                >
                  <Text style={styles.actionButtonIcon}>🔒</Text>
                  <Text style={styles.actionButtonText}>Cerrar Caja</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Contenido según estado de caja */}
        {!cajaAbierta ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>💰</Text>
            </View>
            <Text style={styles.emptyText}>Debes abrir la caja</Text>
            <Text style={styles.emptySubtext}>
              Haz clic en "Abrir Caja" para comenzar tu turno
            </Text>
          </View>
        ) : comandas.length === 0 && comandasUnificadas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>✅</Text>
            </View>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    width: 28,
    height: 28,
    marginRight: 8,
  },
  userWelcome: {
    fontSize: 24,
    color: "#1a1a1a",
    fontWeight: "700",
    maxWidth: 195,
  },
  estadoCajaContainer: {
    marginTop: 4,
  },
  estadoCajaBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cajaAbierta: {
    backgroundColor: "#d4edda",
    borderWidth: 1.5,
    borderColor: "#28a745",
  },
  cajaCerrada: {
    backgroundColor: "#f8d7da",
    borderWidth: 1.5,
    borderColor: "#dc3545",
  },
  estadoCajaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a1a1a",
    letterSpacing: 0.3,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  logoutIcon: {
    width: 22,
    height: 22,
    marginRight: 6,
  },
  logoutButtonText: {
    fontSize: 18,
    color: "#dc3545",
    fontWeight: "600",
  },
  headerContainer: {
    paddingVertical: 12,
    marginBottom: 8,
  },
  contentTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  // ✨ NUEVO: Contenedor de botones mejorado
  botonesAccion: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  // ✨ NUEVO: Estilo base para botones de acción
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 140,
    flex: 1,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  abrirCajaButton: {
    backgroundColor: "#28a745",
    shadowColor: "#28a745",
  },
  reporteButton: {
    backgroundColor: "#17a2b8",
    shadowColor: "#17a2b8",
  },
  historialButton: {
    backgroundColor: "#6f42c1",
    shadowColor: "#6f42c1",
  },
  cerrarCajaButton: {
    backgroundColor: "#dc3545",
    shadowColor: "#dc3545",
  },
  // ✨ MEJORADO: Empty state con iconos
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyText: {
    textAlign: "center",
    color: "#333",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: "center",
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    marginTop: 12,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
    marginTop: 12,
    letterSpacing: -0.3,
  },
  seccionUnificadas: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: "#FFC107",
  },
  seccionUnificadasTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
});
