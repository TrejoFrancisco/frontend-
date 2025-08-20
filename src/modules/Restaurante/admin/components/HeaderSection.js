import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
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
              } catch (error) {}
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
            <Text style={styles.iconText}>☰</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>🍽️</Text>
          </View>
          <Text style={styles.appName}>Mi Restaurante</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>↻</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <View style={styles.logoutIconContainer}>
              <Text style={styles.logoutIconText}>⏻</Text>
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
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
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
  iconText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  logoContainer: {
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#FBBF24",
  },
  logoText: {
    fontSize: 20,
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  logoutButton: {
    padding: 4,
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
  logoutIconText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
  },
  welcomeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  greetingIconContainer: {
    marginRight: 12,
  },
  greetingEmoji: {
    fontSize: 24,
  },
  userInfo: {
    alignItems: "flex-start",
  },
  userWelcome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    textTransform: "capitalize",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
});
