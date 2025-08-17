import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    StyleSheet,
} from "react-native";
import { ImageBackground } from "react-native";
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
        <ImageBackground
            source={require("../../../../../assets/fondo1.jpeg")} // tu imagen de fondo
            style={styles.header}
            resizeMode="stretch" // "cover" o "contain" según quieras ajustar
        >
            {/* Primera fila: menú, logo, botones */}
            <View style={styles.topRow}>
                <TouchableOpacity style={styles.menuButton} onPress={onOpenDrawer}>
                    <Image
                        source={require("../../../../../assets/menuu.png")}
                        style={styles.menuIcon}
                    />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Image
                        source={require('../../../../../assets/logo.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.appName}>Mi Restaurante</Text>
                </View>

                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                        <Image
                            source={require('../../../../../assets/actualizaa.png')}
                            style={styles.iconImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Image
                            source={require('../../../../../assets/cerrarC.png')}
                            style={styles.iconImage}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Segunda fila: saludo y rol */}
            <View style={styles.bottomRow}>
                <View style={styles.row}>
                    <Image
                        source={require('../../../../../assets/saludo.png')}
                        style={styles.icon}
                        resizeMode="contain"
                    />
                    <Text style={styles.userWelcome}>
                        Hola, {user?.name || "Usuario"}
                    </Text>
                </View>
                <Text style={styles.userRole}>
                    Rol:{" "}
                    {user?.role === "admin_local_restaurante"
                        ? "Admin"
                        : user?.role || "Admin"}
                </Text>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    header: {
        width: "100%",   // ocupa todo el ancho
        height: 100,     // altura fija en px
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#7d7d7dff',
        shadowColor: '#000000ff',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 3, // para Android
    },

    topRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 1,
    },
    bottomRow: {
        flexDirection: "column",
        alignItems: "center",
    },
    menuButton: {
        padding: 5,
    },
    menuIcon: {
        width: 35,
        height: 35,
        resizeMode: "contain",
    },
    headerCenter: {
        flexDirection: "row",
        alignItems: "center",
    },
    logo: {
        width: 30,
        height: 30,
        marginRight: 5,
    },
    appName: {
        fontSize: 15,
        fontWeight: "bold",
        color: "#000000ff",
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    refreshButton: {
        padding: 4,
    },
    logoutButton: {
        padding: 4,
    },
    iconImage: {
        width: 25,
        height: 25,
        resizeMode: "contain",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 1,
    },
    icon: {
        width: 30,
        height: 30,
        marginRight: 5,
    },
    userWelcome: {
        fontSize: 10,
        fontWeight: "600",
        color: "#000000ff",
        maxWidth: "70%",
        textAlign: 'center',
    },
    userRole: {
        fontSize: 11,
        fontWeight: "500",
        color: "#B0B0B0",
        fontWeight: "bold",
    },
});