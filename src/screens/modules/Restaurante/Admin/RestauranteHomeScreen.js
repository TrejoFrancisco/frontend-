import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import {
  SafeAreaProvider,
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
import ComandasSection from "../../../../modules/Restaurante/admin/components/ComandasSection";
import { API } from "../../../../services/api";
import { useBackHandler } from "../../../../hooks/useBackHandler";

export default function HomeScreenWrapper() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}

function HomeScreen() {
  const { token, user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const navigation = useNavigation();

  useEffect(() => {}, [token, user]);
  useBackHandler(navigation);

  const menuItems = useMemo(
    () => [
      {
        id: "dashboard",
        title: "Dashboard",
        icon: require("../../../../../assets/dash.png"),
        color: "#aac6f0ff",
        bgColor: "#e7f1feff",
      },
      {
        id: "usuarios",
        title: "Usuarios",
        icon: require("../../../../../assets/gestionU.png"),
        color: "#58D68D",
        bgColor: "#D5F5E3",
      },
      {
        id: "categorias",
        title: "Categorías",
        icon: require("../../../../../assets/gestionC.png"),
        color: "#eeb98aff",
        bgColor: "#f9eaddff",
      },
      {
        id: "materias-primas",
        title: "Materias Primas",
        icon: require("../../../../../assets/gestionMP.png"),
        color: "#F1948A",
        bgColor: "#FADBD8",
      },
      {
        id: "recetas",
        title: "Gestión de Recetas",
        icon: require("../../../../../assets/gestionR.png"),
        color: "#C39BD3",
        bgColor: "#E8DAEF",
      },
      {
        id: "productos",
        title: "Productos",
        icon: require("../../../../../assets/gestionP.png"),
        color: "#F7DC6F",
        bgColor: "#FCF3CF",
      },
      {
        id: "asociar",
        title: "Asociar Usuarios",
        icon: require("../../../../../assets/asociarU.png"),
        color: "#76D7C4",
        bgColor: "#D1F2EB",
      },
      {
        id: "inventario",
        title: "Inventario",
        icon: require("../../../../../assets/gestionI.png"),
        color: "#ffc089ff",
        bgColor: "#fff0e2ff",
      },
      {
        id: "reportes",
        title: "Gestión de Reportes",
        icon: require("../../../../../assets/reportes.png"),
        color: "#F8BBD0",
        bgColor: "#FCE4EC",
      },
      {
        id: "comandas",
        title: "Comandas",
        icon: require("../../../../../assets/comandas.png"),
        color: "#F4A8FF",
        bgColor: "#FAE8FF",
      },
    ],
    []
  );

  const handleMenuPress = useCallback((itemId) => {
    setActiveSection(itemId);
    setDrawerVisible(false);
  }, []);

  const handleOpenDrawer = useCallback(() => {
    setDrawerVisible(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerVisible(false);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log("Refreshing section:", activeSection);
  }, [activeSection]);

  const renderContent = useCallback(() => {
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
      case "comandas":
        return <ComandasSection token={token} navigation={navigation} />;
      default:
        return <DashboardContent token={token} />;
    }
  }, [activeSection, token, navigation]);

  const getCurrentSectionTitle = useCallback(() => {
    const currentItem = menuItems.find((item) => item.id === activeSection);
    return currentItem ? currentItem.title : "Dashboard";
  }, [activeSection, menuItems]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1A1A2E"
        translucent={false}
      />

      <View style={[styles.safeContainer, { paddingTop: insets.top }]}>
        <Header onOpenDrawer={handleOpenDrawer} onRefresh={handleRefresh} />

        <ScrollView style={styles.content}>{renderContent()}</ScrollView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={drawerVisible}
          onRequestClose={handleCloseDrawer}
          statusBarTranslucent={true}
        >
          <TouchableOpacity
            style={styles.drawerOverlay}
            activeOpacity={1}
            onPress={handleCloseDrawer}
          >
            <DrawerContent
              insets={insets}
              menuItems={menuItems}
              activeSection={activeSection}
              onMenuPress={handleMenuPress}
              user={user}
              onClose={handleCloseDrawer}
            />
          </TouchableOpacity>
        </Modal>
      </View>
    </View>
  );
}

const DrawerContent = React.memo(
  ({ insets, menuItems, activeSection, onMenuPress, user, onClose }) => (
    <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      <View style={styles.drawerHeader}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <View style={styles.closeButtonContainer}>
            <Text style={styles.closeButtonText}>✕</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.drawerHeaderContent}>
          <View style={styles.appLogoContainer}>
            <Image
              source={require("../../../../../assets/logo.png")}
              style={styles.appLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.drawerTitle}>Mi Restaurante</Text>
          <Text style={styles.drawerSubtitle}>Panel de Administración</Text>

          <View style={styles.userInfoContainer}>
            <View style={styles.userAvatarContainer}>
              <Text style={styles.userAvatar}>
                {(user?.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || "Usuario"}</Text>
              <Text style={styles.userRoleText}>
                {user?.role === "admin_local_restaurante"
                  ? "Administrador"
                  : "Admin"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Navegación</Text>
          {menuItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              onPress={() => onMenuPress(item.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.drawerFooter}>
        <Text style={styles.footerText}>v1.0.0 • Mi Restaurante</Text>
      </View>
    </View>
  )
);

DrawerContent.displayName = "DrawerContent";

const MenuItem = React.memo(({ item, isActive, onPress }) => (
  <TouchableOpacity
    style={[
      styles.menuItem,
      isActive && [styles.activeMenuItem, { backgroundColor: item.bgColor }],
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.menuIconContainer,
        isActive && { backgroundColor: item.color },
      ]}
    >
      <Image source={item.icon} style={styles.menuIco} resizeMode="contain" />
    </View>

    <View style={styles.menuItemContent}>
      <Text
        style={[
          styles.menuText,
          isActive && {
            color: item.color,
            fontWeight: "700",
          },
        ]}
      >
        {item.title}
      </Text>
      {isActive && (
        <View style={styles.activeIndicator}>
          <Text style={styles.activeIndicatorText}>●</Text>
        </View>
      )}
    </View>

    {isActive && (
      <View style={[styles.activeBorder, { backgroundColor: item.color }]} />
    )}
  </TouchableOpacity>
));

MenuItem.displayName = "MenuItem";

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

  const fetchDashboardData = useCallback(async () => {
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
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.contentTitle}>Dashboard</Text>
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
        <Text style={styles.contentTitle}>Dashboard</Text>
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
        <View style={styles.rowWrap}>
          <Text style={styles.contentTitle}>Dashboard</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Actualizar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.dateText}>Fecha: {dashboardData.fecha}</Text>
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
        <Text style={styles.sectionTitle}>Cancelaciones del día</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e3151ff" },
  safeContainer: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { flex: 1, backgroundColor: "#F5F5F5" },
  contentContainer: { padding: 20 },
  titleContainer: { paddingVertical: 25 },
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
  dateText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
    alignSelf: "flex-start",
    marginLeft: 10,
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: "#033468ff",
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 150,
    maxWidth: "100%",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: { color: "#fff", fontSize: 18, fontWeight: "500" },
  retryButton: {
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: { color: "#fff", fontWeight: "600" },
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
  rankText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  productInfo: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "600", color: "#333" },
  productQuantity: { fontSize: 14, color: "#666", marginTop: 2 },
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
  canceledIcon: { marginRight: 12 },
  canceledIconText: { fontSize: 20 },
  canceledInfo: { flex: 1 },
  canceledProductName: { fontSize: 16, fontWeight: "600", color: "#333" },
  canceledDetails: { fontSize: 12, color: "#666", marginTop: 2 },
  canceledBadge: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  canceledText: { fontSize: 15, color: "#fff", fontWeight: "bold" },
  loadingContainer: { alignItems: "center", paddingVertical: 50 },
  loadingText: { marginTop: 15, fontSize: 16, color: "#666" },
  errorContainer: { alignItems: "center", paddingVertical: 30 },
  errorText: {
    color: "#dc3545",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 20,
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 20,
  },
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
  closeButton: { position: "absolute", top: 15, right: 15, zIndex: 10 },
  closeButtonContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  drawerHeaderContent: { alignItems: "center", paddingTop: 10 },
  appLogoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 30,
    width: 60,
    height: 61,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 4,
  },
  appLogo: { width: 45, height: 40 },
  drawerTitle: {
    fontSize: 22,
    color: "#c8c8c8ff",
    fontWeight: "bold",
    textAlign: "center",
    flexWrap: "wrap",
  },
  drawerSubtitle: {
    fontSize: 18,
    color: "#b8b8b8ff",
    textAlign: "center",
    flexWrap: "wrap",
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
  userAvatar: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  userDetails: { flex: 1 },
  userName: {
    fontSize: 18,
    color: "#d8d8d8ff",
    fontWeight: "600",
    flexWrap: "wrap",
  },
  userRoleText: { fontSize: 16, color: "#c0c0c0ff", flexWrap: "wrap" },
  drawerContent: { flex: 1, paddingTop: 20 },
  menuSection: { paddingHorizontal: 16, paddingBottom: 20 },
  menuSectionTitle: {
    fontSize: 14,
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
  activeMenuItem: { borderWidth: 1, borderColor: "rgba(59, 130, 246, 0.2)" },
  menuIconContainer: {
    backgroundColor: "#F2F4F4",
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
    paddingVertical: 4,
  },
  menuItemContent: {
    flex: 1,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuText: {
    fontSize: 18,
    flexShrink: 1,
    flexWrap: "wrap",
    width: "80%",
    color: "#333333",
  },
  activeIndicator: { marginLeft: 8 },
  activeIndicatorText: { fontSize: 12, color: "#3B82F6" },
  activeBorder: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    alignItems: "center",
  },
  footerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7d7d7dff",
    textAlign: "center",
    flexWrap: "wrap",
  },
  menuIco: { width: 25, height: 25 },
});
