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
import PagoModal from "../../../../modules/Restaurante/Mesero/components/PagoModal";
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
  const [pagoModalVisible, setPagoModalVisible] = useState(false);
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

  // Procesar pago
  const handlePagar = useCallback((comanda, isUnificada) => {
    setSelectedComanda(comanda);
    setPagoModalVisible(true);
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
          <View style={styles.rowWrap}>
            <Text style={styles.contentTitle}>Mis Comandas</Text>

            <TouchableOpacity
              style={styles.nuevaComandaButton}
              onPress={() => setModalVisible(true)}
            >
              <View style={styles.buttonContent}>
                <Image
                  source={require("../../../../../assets/agreg.png")}
                  style={styles.iconImage}
                />
                <Text style={styles.nuevaComandaButtonText}>Nueva Comanda</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.unificarButton}
              onPress={() => setUnificarModalVisible(true)}
            >
              <Text style={styles.unificarButtonText}>Unificar Mesas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista de comandas */}
        {comandas.length === 0 && comandasUnificadas.length === 0 ? (
          <View style={styles.emptyState}>
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
                onPagar={handlePagar}
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
                    onPagar={handlePagar}
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

      <PagoModal
        visible={pagoModalVisible}
        onClose={() => {
          setPagoModalVisible(false);
          setSelectedComanda(null);
        }}
        onSuccess={fetchComandas}
        token={token}
        comanda={selectedComanda}
        isUnificada={selectedComanda?.tipo === "unificada"}
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
  nuevaComandaButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 150,
    maxWidth: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#007bff",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  unificarButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#6c757d",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  unificarButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 24,
    height: 24,
    marginRight: 6,
    resizeMode: "contain",
  },
  nuevaComandaButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    flexShrink: 1,
    textAlign: "center",
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
  seccionUnificadas: {
    marginTop: 20,
    marginBottom: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#FFC107",
  },
  seccionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
});
