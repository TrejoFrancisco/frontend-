import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { useAuth } from "../AuthContext";
import { API } from "../services/api";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const { saveToken } = useAuth();

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Por favor ingresa tu email y contraseña");
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/login", {
        email,
        password,
      });

      const { token: newToken, role, id, name } = response.data.data;

      await saveToken(newToken, { id, name, role });

      Alert.alert("Login exitoso", `Bienvenido ${name}`);

      if (role === "admin_local_restaurante") {
        navigation.navigate("RestauranteHome");
      } else if (role === "meseros_restaurant") {
        navigation.navigate("MeseroScreen");
      } else if (role === "cocina") {
        navigation.navigate("CocinaScreen");
      } else if (role === "bartender_restaurante") {
        navigation.navigate("BartenderScreen");
      } else if (role === "chef") {
        navigation.navigate("ChefScreen");
      } else {
        navigation.navigate("Home");
      }
    } catch (error) {
      if (error.response) {
        const { http_code, message } = error.response.data.error || {};

        if (http_code === 401) {
          setError(message || "Credenciales inválidas.");
        } else {
          setError(message || "Ocurrió un error inesperado.");
        }
      } else {
        setError("No se pudo conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={styles.circleTop} />
        <View style={styles.circleBottom} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header con logo mejorado */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/icono.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoGlow} />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Bienvenido</Text>
          </View>
        </View>

        {/* Card principal mejorado */}
        <View style={styles.card}>
          {/* Error message mejorado */}
          {error ? (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconContainer}>
                <Image
                  source={require("../../assets/warning.png")}
                  style={styles.errorIcon}
                />
              </View>
              <View style={styles.errorContent}>
                <Text style={styles.errorTitle}>Ups, algo salió mal</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            </View>
          ) : null}

          {/* Formulario mejorado */}
          <View style={styles.formContainer}>
            {/* Campo Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "email" && styles.inputWrapperFocused,
                  error && error.includes("email") && styles.inputWrapperError,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Text style={styles.inputIcon}>@</Text>
                </View>
                <TextInput
                  placeholder="tucorreo@ejemplo.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "password" && styles.inputWrapperFocused,
                  error &&
                    error.includes("contraseña") &&
                    styles.inputWrapperError,
                ]}
              >
                <TextInput
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry={!showPassword}
                  style={styles.input}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <View style={styles.eyeIconContainer}>
                    <Image
                      source={
                        showPassword
                          ? require("../../assets/open.png")
                          : require("../../assets/close.png")
                      }
                      style={styles.eyeIcon}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Botón de login mejorado */}
            <TouchableOpacity
              onPress={handleLogin}
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={styles.loginButtonContent}>
                {loading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.loadingText}>Iniciando sesión...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer informativo */}
          <View style={styles.footerContainer}>
            <View style={styles.bottomInfo}>
              <Text style={styles.versionText}>Mi Restaurante v1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Bottom info */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  backgroundDecoration: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circleTop: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(0, 98, 255, 0.1)",
    top: -50,
    right: -50,
  },
  circleBottom: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(0, 255, 170, 0.1)",
    bottom: -30,
    left: -30,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    minHeight: height,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#1e3a8a",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    top: -10,
    left: -10,
    zIndex: -1,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  errorContainer: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  errorIconContainer: {
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  errorIcon: {
    width: 28,
    height: 30,
    resizeMode: "contain",
  },
  errorContent: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 4,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  formContainer: {
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 20,
    maxWidth: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    transition: "all 0.2s ease",
  },
  inputWrapperFocused: {
    borderColor: "#3B82F6",
    shadowColor: "#3B82F6",
    shadowOpacity: 0.15,
  },
  inputWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  inputIconContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  inputIcon: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: "#1F2937",
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontWeight: "500",
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  eyeIconContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  eyeIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
  loginButton: {
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    flexDirection: "row",
    gap: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  loginButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  loginButtonIcon: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 6,
    marginLeft: 12,
  },
  loginButtonIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#FFFFFF",
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
  },
  footerContainer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  securityText: {
    fontSize: 14,
    marginRight: 6,
  },
  securityLabel: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "600",
  },
  bottomInfo: {
    alignItems: "center",
    marginTop: 24,
  },
  versionText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
