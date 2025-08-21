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
              } catch (error) { }
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
      {/* Primera fila: menú, logo, botones */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.menuButton} onPress={onOpenDrawer}>
          <View style={styles.iconContainer}>
            <Image
              source={require('../../../../../assets/menu.png')} // Asegúrate que esta ruta sea correcta
              style={styles.iconImage}
              resizeMode="contain"
            />

          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../../../assets/logo.png')} // Asegúrate de que la ruta sea correcta
              style={styles.logoImage}
              resizeMode="contain"
            />

          </View>
          <Text style={styles.appName}>Mi Restaurante</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
            <View style={styles.iconContaine}>
              <Image
                source={require('../../../../../assets/actualizaa.png')} 
                style={styles.iconImag}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Image
                source={require('../../../../../assets/cerrarC.png')} 
                style={styles.logoutIconImage}
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
  header: {
    width: "100%",
    minHeight: 90,
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#d1d1d2ff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 9,
    elevation: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bottomRow: {
    alignItems: "center",
  },
  menuButton: {
    padding: 4,
  },
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
  iconImage: {
    width: 30,
    height: 28,
  },
  iconContaine: {
    backgroundColor: "#c4d5f9ff",
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5580d4ff",
  },
  iconImag: {
    width: 25,
    height: 28,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  logoImage: {
    width: 30,
    height: 26,

  },
  appName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionButton: {
    padding: 2,
  },
  logoutButton: {
    padding: -2,
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
  logoutIconImage: {
    width: 25,
    height: 28,
  }
});