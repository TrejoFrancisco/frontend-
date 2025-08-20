import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../../../AuthContext";
import Header from "../../../../modules/Restaurante/admin/components/HeaderSection";
import CategoriasScreen from "../../../../modules/Restaurante/admin/components/CategoriasSection";
import MateriaPrimaSection from "../../../../modules/Restaurante/admin/components/MateriasPrimasSection";
import RecetasSection from "../../../../modules/Restaurante/admin/components/RecetasSection";
import ProductosSection from "../../../../modules/Restaurante/admin/components/ProductosSection";
import UsuariosSection from "../../../../modules/Restaurante/admin/components/UsuariosSection";
import AsociarSection from "../../../../modules/Restaurante/admin/components/AsociarSection";
import InventarioSection from "../../../../modules/Restaurante/admin/components/InventarioSection";
import ReportesSection from "../../../../modules/Restaurante/admin/components/ReportesSection";
import { API } from "../../../../services/api";

// Componente principal envuelto con SafeAreaProvider
export default function HomeScreenWrapper() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}

function HomeScreen() {
  const { token, user } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: "📊",
      color: "#3B82F6",
      bgColor: "#EFF6FF",
    },
    {
      id: "usuarios",
      title: "Gestión de Usuarios",
      icon: "👥",
      color: "#10B981",
      bgColor: "#ECFDF5",
    },
    {
      id: "categorias",
      title: "Gestión de Categorías",
      icon: "📂",
      color: "#F59E0B",
      bgColor: "#FFFBEB",
    },
    {
      id: "materias-primas",
      title: "Materias Primas",
      icon: "🥕",
      color: "#EF4444",
      bgColor: "#FEF2F2",
    },
    {
      id: "recetas",
      title: "Gestión de Recetas",
      icon: "📝",
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
    },
    {
      id: "productos",
      title: "Gestión de Productos",
      icon: "🍽️",
      color: "#06B6D4",
      bgColor: "#ECFEFF",
    },
    {
      id: "asociar",
      title: "Asociar Usuarios",
      icon: "🔗",
      color: "#84CC16",
      bgColor: "#F7FEE7",
    },
    {
      id: "inventario",
      title: "Gestión de Inventario",
      icon: "📦",
      color: "#F97316",
      bgColor: "#FFF7ED",
    },
    {
      id: "reportes",
      title: "Gestión de Reportes",
      icon: "📈",
      color: "#EC4899",
      bgColor: "#FDF2F8",
    },
  ];

  const handleMenuPress = (itemId) => {
    setActiveSection(itemId);
    setDrawerVisible(false);
  };

  const handleRefresh = () => {
    console.log("Refreshing section:", activeSection);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent token={token} />;
      case "usuarios":
        return <UsuariosSection token={token} navigation={navigation} />;
      case "categorias":
        return <CategoriasScreen token={token} navigation={navigation} />;
      case "materias-primas":
        return <MateriaPrimaSection token={token} navigation={navigation} />;
      case "recetas":
        return <RecetasSection token={token} navigation={navigation} />;
      case "productos":
        return <ProductosSection token={token} navigation={navigation} />;
      case "asociar":
        return <AsociarSection token={token} navigation={navigation} />;
      case "inventario":
        return <InventarioSection token={token} navigation={navigation} />;
      case "reportes":
        return <ReportesSection token={token} navigation={navigation} />;
      default:
        return <DashboardContent token={token} />;
    }
  };

  const getCurrentSectionTitle = () => {
    const currentItem = menuItems.find((item) => item.id === activeSection);
    return currentItem ? currentItem.title : "Dashboard";
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1A1A2E"
        translucent={false}
      />

      <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
        <Header
          onOpenDrawer={() => setDrawerVisible(true)}
          onRefresh={handleRefresh}
        />

        <ScrollView style={styles.content}>{renderContent()}</ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={drawerVisible}
          onRequestClose={() => setDrawerVisible(false)}
          statusBarTranslucent={true}
        >
          <TouchableOpacity
            style={styles.drawerOverlay}
            activeOpacity={1}
            onPress={() => setDrawerVisible(false)}
          >
            <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
              {/* Header del Drawer */}
              <View style={styles.drawerHeader}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setDrawerVisible(false)}
                >
                  <View style={styles.closeButtonContainer}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.drawerHeaderContent}>
                  <View style={styles.appLogoContainer}>
                    <Text style={styles.appLogo}>🍽️</Text>
                  </View>
                  <Text style={styles.drawerTitle}>Mi Restaurante</Text>
                  <Text style={styles.drawerSubtitle}>
                    Panel de Administración
                  </Text>

                  {/* Info del usuario */}
                  <View style={styles.userInfoContainer}>
                    <View style={styles.userAvatarContainer}>
                      <Text style={styles.userAvatar}>
                        {(user?.name || "U").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={styles.userName}>
                        {user?.name || "Usuario"}
                      </Text>
                      <Text style={styles.userRoleText}>
                        {user?.role === "admin_local_restaurante"
                          ? "Administrador"
                          : "Admin"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Contenido del Drawer */}
              <ScrollView
                style={styles.drawerContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.menuSection}>
                  <Text style={styles.menuSectionTitle}>Navegación</Text>
                  {menuItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.menuItem,
                        activeSection === item.id && [
                          styles.activeMenuItem,
                          { backgroundColor: item.bgColor },
                        ],
                      ]}
                      onPress={() => handleMenuPress(item.id)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.menuIconContainer,
                          activeSection === item.id && {
                            backgroundColor: item.color,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.menuIconText,
                            activeSection === item.id && { color: "#FFFFFF" },
                          ]}
                        >
                          {item.icon}
                        </Text>
                      </View>

                      <View style={styles.menuItemContent}>
                        <Text
                          style={[
                            styles.menuText,
                            activeSection === item.id && {
                              color: item.color,
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {item.title}
                        </Text>
                        {activeSection === item.id && (
                          <View style={styles.activeIndicator}>
                            <Text style={styles.activeIndicatorText}>●</Text>
                          </View>
                        )}
                      </View>

                      {activeSection === item.id && (
                        <View
                          style={[
                            styles.activeBorder,
                            { backgroundColor: item.color },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Footer del Drawer */}
              <View style={styles.drawerFooter}>
                <Text style={styles.footerText}>v1.0.0 • Mi Restaurante</Text>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
}

// El resto del código DashboardContent permanece igual...
const DashboardContent = ({ token }) => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    total_comandas: 0,
    ganancias: 0,
    productos_mas_vendidos: [],
    productos_cancelados: [],
    fecha: new Date().toLocaleDateString(),
  });
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get("/restaurante/admin/reporte-hoy", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      } else {
        setError(response.data.message || "Error al cargar los datos");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(
        error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Error de conexión. Verifica tu conexión a internet."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.contentTitle}>Dashboard del Restaurante</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A2E" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.contentTitle}>Dashboard del Restaurante</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.contentTitle}>Dashboard del Restaurante</Text>
        <Text style={styles.dateText}>Fecha: {dashboardData.fecha}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{dashboardData.total_comandas}</Text>
          <Text style={styles.statLabel}>Comandas Hoy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            ${dashboardData.ganancias?.toLocaleString() || 0}
          </Text>
          <Text style={styles.statLabel}>Ganancias</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {dashboardData.productos_cancelados?.length || 0}
          </Text>
          <Text style={styles.statLabel}>Cancelados</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Productos Más Vendidos</Text>
        {dashboardData.productos_mas_vendidos &&
        dashboardData.productos_mas_vendidos.length > 0 ? (
          dashboardData.productos_mas_vendidos.map((item, index) => (
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
          <Text style={styles.emptyText}>No hay productos vendidos hoy</Text>
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Productos Cancelados Hoy</Text>
        {dashboardData.productos_cancelados &&
        dashboardData.productos_cancelados.length > 0 ? (
          dashboardData.productos_cancelados.map((item, index) => (
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
            No hay productos cancelados hoy 🎉
          </Text>
        )}
      </View>

      <Text style={styles.welcomeText}>
        Panel de administración del restaurante
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  safeContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
    padding: 20,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  contentTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  dateText: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 10,
  },
  refreshButton: {
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
    minWidth: 80,
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
  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666666",
    fontStyle: "italic",
    marginTop: 20,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  // Nuevos estilos para el Drawer mejorado
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  drawerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    width: "85%",
    maxWidth: 320,
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  drawerHeader: {
    backgroundColor: "#1A1A2E",
    borderTopRightRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
  },
  closeButtonContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  drawerHeaderContent: {
    alignItems: "center",
    paddingTop: 10,
  },
  appLogoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  appLogo: {
    fontSize: 28,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  drawerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 20,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "100%",
  },
  userAvatarContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatar: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  userRoleText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  menuSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    position: "relative",
    overflow: "hidden",
  },
  activeMenuItem: {
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  menuIconContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuIconText: {
    fontSize: 18,
    color: "#6B7280",
  },
  menuItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  activeIndicator: {
    marginLeft: 8,
  },
  activeIndicatorText: {
    fontSize: 12,
    color: "#3B82F6",
  },
  activeBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  currentSectionContainer: {
    marginTop: 20,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
  },
  currentSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  currentSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
