import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useAuth } from "../AuthContext";
import CategoriasScreen from "../modules/Restaurante/components/CategoriasSection";

export default function HomeScreen({ navigation }) {
  const { token } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", title: "Dashboard", icon: "📊" },
    { id: "categorias", title: "Gestión de Categorías", icon: "🏷️" },
    { id: "recetas", title: "Gestión de Recetas", icon: "👨‍🍳" },
    { id: "productos", title: "Gestión de Productos", icon: "🍽️" },
  ];

  const handleMenuPress = (itemId) => {
    setActiveSection(itemId);
    setDrawerVisible(false);
  };

  const handleRefresh = () => {
    // La lógica de refresh se maneja en cada componente individual
    console.log("Refreshing section:", activeSection);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardContent />;
      case "categorias":
        return <CategoriasScreen token={token} navigation={navigation} />;
      case "recetas":
        return <RecetasContent />;
      case "productos":
        return <ProductosContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.appName}>🍴 Mi Restaurante</Text>
          <Text style={styles.userRole}>Admin</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutIcon}>⚙️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>{renderContent()}</ScrollView>

      {/* Drawer Menu */}
      <Modal
        animationType="none"
        transparent={true}
        visible={drawerVisible}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setDrawerVisible(false)}
        >
          <View style={styles.drawerContainer}>
            <TouchableOpacity style={styles.drawerHeader} activeOpacity={1}>
              <Text style={styles.drawerTitle}>🍴 Mi Restaurante</Text>
              <Text style={styles.drawerSubtitle}>Panel de Administración</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDrawerVisible(false)}
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <ScrollView style={styles.drawerContent}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    activeSection === item.id && styles.activeMenuItem,
                  ]}
                  onPress={() => handleMenuPress(item.id)}
                >
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.menuText,
                      activeSection === item.id && styles.activeMenuText,
                    ]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Componente Dashboard
const DashboardContent = () => {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.contentTitle}>Dashboard del Restaurante</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>10</Text>
          <Text style={styles.statLabel}>Categorías</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>23</Text>
          <Text style={styles.statLabel}>Recetas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>67</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
      </View>
      <Text style={styles.welcomeText}>
        Bienvenido al panel de administración del restaurante
      </Text>
    </View>
  );
};

// Componente Recetas
const RecetasContent = () => {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.contentTitle}>Gestión de Recetas</Text>
      <Text style={styles.contentSubtitle}>Crea y administra tus recetas</Text>
    </View>
  );
};

// Componente Productos
const ProductosContent = () => {
  return (
    <View style={styles.contentContainer}>
      <Text style={styles.contentTitle}>Gestión de Productos</Text>
      <Text style={styles.contentSubtitle}>
        Administra los productos de tu menú
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userRole: {
    fontSize: 14,
    color: "#CCCCCC",
  },
  logoutButton: {
    padding: 8,
    marginRight: 8,
  },
  logoutIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
    padding: 20,
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 8,
  },
  contentSubtitle: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A2E",
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 18,
    textAlign: "center",
    color: "#666666",
    fontStyle: "italic",
  },
  drawerContainer: {
    backgroundColor: "#FFFFFF",
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    maxWidth: "80%",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },

  drawerHeader: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    position: "relative",
  },

  drawerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A2E",
  },

  drawerSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },

  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    padding: 12,
    borderRadius: 50,
    backgroundColor: "#F0F0F0",
  },

  closeIcon: {
    fontSize: 22,
    color: "#333333",
  },

  drawerContent: {
    flex: 1,
    padding: 20,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },

  activeMenuItem: {
    backgroundColor: "#1A1A2E",
  },

  menuText: {
    fontSize: 16,
    color: "#333333",
    marginLeft: 12,
    flex: 1,
  },

  activeMenuText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
