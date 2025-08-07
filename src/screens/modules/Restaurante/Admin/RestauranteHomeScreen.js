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
  Image,
} from "react-native";
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

export default function HomeScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const menuItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: (
        <Image
          source={require("../../../../../assets/dashboard.png")}
          style={styles.menuIco}
        />
      ),
    },
    {
      id: "usuarios",
      title: "Gestion de Usuarios",
      icon: (
        <Image
          source={require("../../../../../assets/gestionU.png")}
          style={styles.menuIco}
        />
      ),
    },
    {
      id: "categorias",
      title: "Gestion de Categorias",
      icon: (
        <Image
          source={require("../../../../../assets/gestionC.png")}
          style={styles.menuIco}
        />
      ),
    },
    {
      id: "materias-primas",
      title: "Gestión de Materias Primas",
      icon: (
        <Image
          source={require("../../../../../assets/gestionMP.png")}
          style={styles.menuIco}
        />
      ),
    },
    {
      id: "recetas",
      title: "Gestión de Recetas",
      icon: (
        <Image
          source={require("../../../../../assets/gestionR.png")}
          style={styles.menuIco}
        />
      ),
    },
    {
      id: "productos",
      title: "Gestión de Productos",
      icon: (
        <Image
          source={require("../../../../../assets/gestionP.png")}
          style={styles.menuIco}
        />
      ),
    },
    {
      id: "asociar",
      title: "Asociar Usuarios",
      icon: (
        <Image
          source={require("../../../../../assets/asociarU.png")}
          style={styles.menuIco}
        />
      ),
    },
    {
      id: "inventario",
      title: "Gestión de Inventario",
      icon: (
        <Image
          source={require("../../../../../assets/gestionI.png")}
          style={styles.menuIco}
        />
      ),
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
        return <DashboardContent />;
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
      default:
        return <DashboardContent />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
      <Header onOpenDrawer={() => setDrawerVisible(true)} onRefresh={handleRefresh} />

      <ScrollView style={styles.content}>{renderContent()}</ScrollView>

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
              <View style={styles.iconTitleContainer}>
                <Image
                  source={require('../../../../../assets/logo.png')}
                  style={styles.iconImage}
                />
                <Text style={styles.drawerTitle}>Mi Restaurante</Text>
              </View>
              <Text style={styles.drawerSubtitle}>Panel de Administración</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDrawerVisible(false)}
              >
                <Image
                  source={require('../../../../../assets/cerrar.png')}
                  style={styles.closeIconImage}
                />
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

const DashboardContent = () => (
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


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  appName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  userWelcome: {
    fontSize: 12,
    color: "#E8E8E8",
    marginBottom: 1,
  },
  userRole: {
    fontSize: 10,
    color: "#B0B0B0",
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  menuIco: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 9,
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  refreshIcon: {
    fontSize: 20,
    color: "#fff",
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  content: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
    padding: 20,
  },
  contentTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
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
  iconTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconImage: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  drawerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  closeIconImage: {
    width: 35,
    height: 35,
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
    backgroundColor: "#9ac3f2ff",
  },

  menuText: {
    fontSize: 15,
    color: "#333333",
    marginLeft: 12,
    flex: 1,
    fontWeight: "bold",
  },

  activeMenuText: {
    color: "#000000ff",
    fontWeight: "bold",
  },
});
