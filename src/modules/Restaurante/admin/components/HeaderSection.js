import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Image } from "react-native";
import { useAuth } from "../../../../AuthContext";
import { useNavigation } from "@react-navigation/native";
import { API } from "../../../../services/api";

export default function HeaderSection({ onOpenDrawer, onRefresh }) {
  const { token, logout, user } = useAuth();
  const navigation = useNavigation();

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        style: "destructive",
        onPress: async () => {
          try {
            if (token) {
              try {
                await API.post(
                  "/logout",
                  {},
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
              } catch (error) { 
                // Silently handle logout API error
              }
            }
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          } catch (error) {
            Alert.alert("Error", "Hubo un problema al cerrar sesión");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        {/* Botón de menú */}
        <TouchableOpacity style={styles.menuButton} onPress={onOpenDrawer}>
          <View style={styles.iconContainer}>
            <Image
              source={require('../../../../../assets/menu.png')} 
              style={styles.iconImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        {/* Logo y nombre de la app */}
        <View style={styles.headerCenter}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Mi Restaurante</Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
            <View style={styles.refreshIconContainer}>
              <Image
                source={require('../../../../../assets/actualizaa.png')} 
                style={styles.actionIconImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Image
                source={require('../../../../../assets/cerrarC.png')} 
                style={styles.actionIconImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // === CONTENEDOR PRINCIPAL ===
  header: {
    width: "100%",
    minHeight: 90,
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#D1D1D2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 9,
    elevation: 10,
  },

  // === LAYOUT ===
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // === BOTONES ===
  menuButton: {
    padding: 4,
  },
  actionButton: {
    padding: 2,
  },

  // === CONTENEDORES DE ICONOS ===
  iconContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  refreshIconContainer: {
    backgroundColor: "#C4D5F9",
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5580D4",
  },
  logoutIconContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  logoContainer: {
    marginRight: 8,
  },

  // === IMÁGENES ===
  iconImage: {
    width: 30,
    height: 28,
  },
  actionIconImage: {
    width: 25,
    height: 28,
  },
  logoImage: {
    width: 35,
    height: 40,
    justifyContent: 'center',
  },

  // === TEXTO ===
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
});