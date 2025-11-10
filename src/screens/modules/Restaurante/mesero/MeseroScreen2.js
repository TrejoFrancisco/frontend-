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
} from "react-native";
import { API } from "../../../../services/api";
import { useAuth } from "../../../../AuthContext";
import { useNavigation } from "@react-navigation/native";
import { useBackHandler } from "../../../../hooks/useBackHandler";
import ComandaCard from "../../../../modules/Restaurante/Mesero/components/ComandaCard";
import NuevaComandaModal from "../../../../modules/Restaurante/Mesero/components/NuevaComandaModal";
import EditarComandaModal from "../../../../modules/Restaurante/Mesero/components/EditarComandaModal";
import UnificarMesasModal from "../../../../modules/Restaurante/Mesero/components/UnificarMesasModal";
import TicketModal from "../../../../modules/Restaurante/Mesero/components/TicketModal";

export default function ComandaSection() {
  const { token, logout, user } = useAuth();
  const navigation = useNavigation();
  useBackHandler(navigation);

  // Estados principales
  const [comandas, setComandas] = useState([]);
  const [comandasUnificadas, setComandasUnificadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mapa para saber qué comandas pertenecen a unificadas
  const [comandasEnUnificadas, setComandasEnUnificadas] = useState({});

  // Estados de modales
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [unificarModalVisible, setUnificarModalVisible] = useState(false);
  const [ticketModalVisible, setTicketModalVisible] = useState(false);

  // Estados para datos seleccionados
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [isTicketUnificado, setIsTicketUnificado] = useState(false);

  // Obtener comandas
  const fetchComandas = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await API.get("/restaurante/mesero/comanda", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const comandasRegulares = response.data.data.comandas || [];
        const comandasUnif = response.data.data.comandas_unificadas || [];

        setComandas(comandasRegulares);
        setComandasUnificadas(comandasUnif);
      }
    } catch (error) {
      console.log("Error al obtener comandas:", error);
      if (error.response?.status === 401) {
        navigation.navigate("Login");
      }
      setComandas([]);
      setComandasUnificadas([]);
    } finally {
      setLoading(false);
    }
  }, [token, navigation]);

  // Crear mapa de comandas en unificadas
  const crearMapaUnificadas = useCallback((unificadas) => {
    const mapa = {};
    unificadas.forEach((unificada) => {
      unificada.comandas_ids.forEach((id) => {
        mapa[id] = true;
      });
    });
    return mapa;
  }, []);

  // Actualizar mapa cuando cambien las unificadas
  useEffect(() => {
    if (comandasUnificadas.length > 0) {
      const mapa = crearMapaUnificadas(comandasUnificadas);
      setComandasEnUnificadas(mapa);
    } else {
      setComandasEnUnificadas({});
    }
  }, [comandasUnificadas, crearMapaUnificadas]);

  // Cargar comandas al montar
  useEffect(() => {
    if (token) {
      fetchComandas();
    }
  }, [token, fetchComandas]);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchComandas();
    setRefreshing(false);
  }, [fetchComandas]);

  // Abrir modal de edición
  const handleOpenEditModal = (comanda) => {
    setSelectedComanda(comanda);
    setEditModalVisible(true);
  };

  // Generar ticket
  const handleGenerarTicket = useCallback(
    (comanda, isUnificada) => {
      const mensaje = isUnificada
        ? "¿Está seguro de generar el ticket unificado?"
        : "¿Está seguro de generar el ticket? Esta acción marcará los productos pendientes como cancelados.";

      Alert.alert("Generar Ticket", mensaje, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Generar",
          onPress: async () => {
            try {
              const endpoint = isUnificada
                ? `/restaurante/mesero/comanda_unificada/ticket/${comanda.id}`
                : `/restaurante/mesero/comanda_ticket/${comanda.id}`;

              const response = await API.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (response.data.success) {
                const ticketData = response.data.data || response.data.ticket;

                setTicket(ticketData);
                setIsTicketUnificado(isUnificada);
                setTicketModalVisible(true);
                fetchComandas();
              }
            } catch (error) {
              Alert.alert(
                "Error",
                error.response?.data?.error?.message ||
                  "Error al generar ticket"
              );
            }
          },
        },
      ]);
    },
    [token, fetchComandas]
  );

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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Cargando comandas...</Text>
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
        <View style={styles.headerContainer}>
          <Text style={styles.contentTitle}>Mis Comandas</Text>

          {/* ✨ NUEVO: Botones de acción mejorados */}
          <View style={styles.botonesAccion}>
            <TouchableOpacity
              style={[styles.actionButton, styles.nuevaComandaButton]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.actionButtonIcon}>➕</Text>
              <Text style={styles.actionButtonText}>Nueva Comanda</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.unificarButton]}
              onPress={() => setUnificarModalVisible(true)}
            >
              <Text style={styles.actionButtonIcon}>🔗</Text>
              <Text style={styles.actionButtonText}>Unificar Mesas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de comandas */}
        {comandas.length === 0 && comandasUnificadas.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
            </View>
            <Text style={styles.emptyText}>No tienes comandas registradas</Text>
            <Text style={styles.emptySubtext}>
              Crea tu primera comanda usando el botón de arriba
            </Text>
          </View>
        ) : (
          <>
            {/* Comandas regulares */}
            {comandas.map((comanda) => (
              <ComandaCard
                key={`comanda-${comanda.id}`}
                comanda={comanda}
                onEdit={handleOpenEditModal}
                onGenerarTicket={handleGenerarTicket}
                isUnificada={false}
                perteneceAUnificada={comandasEnUnificadas[comanda.id] || false}
              />
            ))}

            {/* Comandas unificadas */}
            {comandasUnificadas.length > 0 && (
              <View style={styles.seccionUnificadas}>
                <Text style={styles.seccionTitle}>Comandas Unificadas</Text>
                {comandasUnificadas.map((comandaUnificada) => (
                  <ComandaCard
                    key={`unificada-${comandaUnificada.id}`}
                    comanda={comandaUnificada}
                    onEdit={handleOpenEditModal}
                    onGenerarTicket={handleGenerarTicket}
                    isUnificada={true}
                    perteneceAUnificada={false}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modales */}
      <NuevaComandaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={fetchComandas}
        token={token}
      />

      <EditarComandaModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedComanda(null);
        }}
        onSuccess={fetchComandas}
        token={token}
        comanda={selectedComanda}
      />

      <UnificarMesasModal
        visible={unificarModalVisible}
        onClose={() => setUnificarModalVisible(false)}
        onSuccess={fetchComandas}
        token={token}
        comandas={comandas}
      />

      {ticket && (
        <TicketModal
          visible={ticketModalVisible}
          onClose={() => {
            setTicketModalVisible(false);
            setTicket(null);
            setIsTicketUnificado(false);
          }}
          ticket={ticket}
          isUnificada={isTicketUnificado}
        />
      )}
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
  nuevaComandaButton: {
    backgroundColor: "#007bff",
    shadowColor: "#007bff",
  },
  unificarButton: {
    backgroundColor: "#6c757d",
    shadowColor: "#6c757d",
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
  seccionUnificadas: {
    marginTop: 28,
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: "#FFC107",
  },
  seccionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
});
