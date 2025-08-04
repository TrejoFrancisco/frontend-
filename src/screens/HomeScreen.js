import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Button,
  SafeAreaView,
  StatusBar,
} from "react-native";
import axios from "axios";
import { useAuth } from "../AuthContext";

export default function HomeScreen() {
  const { token, logout } = useAuth();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    name: "",
    email: "",
    password: "",
    modulos: [],
  });

  const [selectedModulos, setSelectedModulos] = useState({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
  });

  const modulosNames = {
    1: "Módulo de Ventas",
    2: "Módulo de Inventario",
    3: "Módulo de Reportes",
    4: "Módulo de Clientes",
    5: "Módulo de Administración",
  };

  const menuItems = [
    { id: "dashboard", title: "Dashboard", icon: "📊" },
    { id: "tiendas", title: "Gestión de Tiendas", icon: "🏪" },
    { id: "usuarios", title: "Gestión de Usuarios", icon: "👥" },
    { id: "crear-cliente", title: "Crear Cliente Balneario", icon: "🏊" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleModuloToggle = (moduloId) => {
    setSelectedModulos((prev) => ({
      ...prev,
      [moduloId]: !prev[moduloId],
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      direccion: "",
      telefono: "",
      name: "",
      email: "",
      password: "",
      modulos: [],
    });
    setSelectedModulos({
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
    });
  };

  const handleCreateBalneario = async () => {
    if (
      !formData.nombre ||
      !formData.direccion ||
      !formData.telefono ||
      !formData.name ||
      !formData.email ||
      !formData.password
    ) {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }

    const modulosSeleccionados = Object.entries(selectedModulos)
      .filter(([_, selected]) => selected)
      .map(([moduloId, _]) => parseInt(moduloId));

    if (modulosSeleccionados.length === 0) {
      Alert.alert("Error", "Por favor seleccione al menos un módulo");
      return;
    }

    const dataToSend = {
      ...formData,
      modulos: modulosSeleccionados,
    };

    setIsLoading(true);
    try {
      const response = await axios.post(
        "http://192.168.0.13:8000/api/crear-admin-balneario",
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      Alert.alert("Éxito", "Cliente balneario creado exitosamente");
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.log("Error:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        Alert.alert(
          "Error",
          "Sesión expirada. Por favor inicie sesión nuevamente."
        );
        logout();
      } else {
        Alert.alert("Error", "Error al crear cliente balneario");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMenuPress = (itemId) => {
    setActiveSection(itemId);
    setDrawerVisible(false);

    if (itemId === "crear-cliente") {
      setModalVisible(true);
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Está seguro que desea cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sí", onPress: logout },
    ]);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Dashboard</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Balnearios Activos</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>45</Text>
                <Text style={styles.statLabel}>Usuarios Registrados</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Nuevos Este Mes</Text>
              </View>
            </View>
            <Text style={styles.welcomeText}>
              Bienvenido al panel de administración
            </Text>
          </View>
        );
      case "tiendas":
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Gestión de Tiendas</Text>
            <Text style={styles.contentSubtitle}>
              Aquí podrás gestionar todas las tiendas del sistema
            </Text>
          </View>
        );
      case "usuarios":
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Gestión de Usuarios</Text>
            <Text style={styles.contentSubtitle}>
              Administra los usuarios del sistema
            </Text>
          </View>
        );
      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>Dashboard</Text>
            <Text style={styles.welcomeText}>
              Bienvenido al panel de administración
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerVisible(true)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.appName}>Tiendas</Text>
          <Text style={styles.userRole}>Admin</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>{renderContent()}</ScrollView>

      {/* Drawer Menu */}
      <Modal
        animationType="slide"
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
              <Text style={styles.drawerTitle}>Tiendas</Text>
              <Text style={styles.drawerSubtitle}>Admin</Text>
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

      {/* Modal para crear cliente balneario */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Crear Cliente Balneario</Text>

              <Text style={styles.sectionTitle}>Información del Balneario</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del balneario"
                value={formData.nombre}
                onChangeText={(text) => handleInputChange("nombre", text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Dirección"
                value={formData.direccion}
                onChangeText={(text) => handleInputChange("direccion", text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={formData.telefono}
                onChangeText={(text) => handleInputChange("telefono", text)}
                keyboardType="phone-pad"
              />

              <Text style={styles.sectionTitle}>
                Información del Administrador
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={formData.password}
                onChangeText={(text) => handleInputChange("password", text)}
                secureTextEntry
              />

              <Text style={styles.sectionTitle}>Módulos</Text>
              {Object.entries(modulosNames).map(([id, name]) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.moduloItem,
                    selectedModulos[id] && styles.moduloItemSelected,
                  ]}
                  onPress={() => handleModuloToggle(parseInt(id))}
                >
                  <Text
                    style={[
                      styles.moduloText,
                      selectedModulos[id] && styles.moduloTextSelected,
                    ]}
                  >
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.modalButtons}>
                <Button
                  title="Cancelar"
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                  }}
                  color="#666"
                />
                <Button
                  title={isLoading ? "Creando..." : "Crear"}
                  onPress={handleCreateBalneario}
                  disabled={isLoading}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c3e50",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: "#fff",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  userRole: {
    fontSize: 14,
    color: "#bdc3c7",
  },
  logoutButton: {
    padding: 8,
  },
  logoutIcon: {
    fontSize: 20,
    color: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 10,
  },
  contentSubtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3498db",
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 4,
  },
  welcomeText: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
    marginTop: 20,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
  },
  drawerContainer: {
    backgroundColor: "#fff",
    width: "75%",
    height: "100%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  drawerHeader: {
    backgroundColor: "#2c3e50",
    padding: 20,
    paddingTop: 40,
    position: "relative",
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  drawerSubtitle: {
    fontSize: 16,
    color: "#bdc3c7",
    marginTop: 4,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    padding: 8,
  },
  closeIcon: {
    fontSize: 20,
    color: "#fff",
  },
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ecf0f1",
  },
  activeMenuItem: {
    backgroundColor: "#e8f4f8",
    borderRightWidth: 4,
    borderRightColor: "#3498db",
  },
  menuText: {
    fontSize: 16,
    color: "#2c3e50",
    marginLeft: 16,
  },
  activeMenuText: {
    color: "#3498db",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    color: "#2c3e50",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  moduloItem: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f9f9f9",
  },
  moduloItemSelected: {
    backgroundColor: "#e8f4f8",
    borderColor: "#3498db",
  },
  moduloText: {
    fontSize: 16,
    color: "#2c3e50",
  },
  moduloTextSelected: {
    color: "#3498db",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 25,
  },
});
