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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { API } from "../services/api";

const { height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const { saveToken } = useAuth();

  const handleLogin = async () => {
    setError("");
    if (!clave) {
      setError("Por favor ingresa tu clave de acceso");
      return;
    }
    try {
      setLoading(true);
      const response = await API.post("/auth/login-clave", { clave });
      const { token: newToken, role, id, name } = response.data.data;
      await saveToken(newToken, { id, name, role });
      Alert.alert("Login exitoso", `Bienvenido ${name}`);

      // Determinar la ruta según el rol
      let targetScreen = "Home";
      if (role === "admin_local_restaurante") targetScreen = "RestauranteHome";
      else if (role === "meseros_restaurant") targetScreen = "MeseroScreen2";
      else if (role === "cocina") targetScreen = "CocinaScreen";
      else if (role === "bartender_restaurante")
        targetScreen = "BartenderScreen";
      else if (role === "chef") targetScreen = "ChefScreen";

      // Resetear el stack de navegación para evitar volver al Login
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: targetScreen }],
        })
      );
    } catch (error) {
      if (error.response) {
        const { http_code, message } = error.response.data.error || {};
        if (http_code === 401)
          setError(message || "Clave inválida o inactiva.");
        else setError(message || "Ocurrió un error inesperado.");
      } else setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled={true}
    >
      {/* Fondos decorativos */}
      <View style={styles.backgroundDecoration}>
        <View style={styles.circleTop} />
        <View style={styles.circleBottom} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
      >
        {/* Logo */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/icono.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoGlow} />
          </View>
          <Text style={styles.title}>Bienvenido</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
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

          {/* Formulario */}
          <View style={styles.formContainer}>
            {/* Clave */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Clave de acceso</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "clave" && styles.inputWrapperFocused,
                  error && styles.inputWrapperError,
                ]}
              >
                <TextInput
                  placeholder="Ingresa tu clave"
                  placeholderTextColor="#6B7280" 
                  value={clave}
                  onChangeText={setClave}
                  onFocus={() => setFocusedInput("clave")}
                  onBlur={() => setFocusedInput(null)}
                  autoCapitalize="characters"
                  secureTextEntry={true}
                  style={[styles.input, { color: "#000" }]} 
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />

              </View>
            </View>

            {/* Botón */}
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
                    <Text style={styles.loadingText}>Verificando...</Text>
                  </>
                ) : (
                  <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /* Layout base */
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },

  /* Decoraciones */
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

  /* Header/logo */
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#1e3a8a",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e3a8a",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },

  /* Card */
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

  /* Error */
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

  /* Formulario */
  formContainer: {
    marginBottom: 1,
  },
  inputContainer: {
    alignItems: "center",
    marginBottom: 20,
    maxWidth: "100%",
  },
  label: {
    fontSize: 25,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginLeft: 4,
  },

  /* Inputs */
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
    fontSize: 22,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: "#1F2937",
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontWeight: "500",
  },

  /* Botón login */
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
    fontSize: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "600",
  },

  /* Footer */
  footerContainer: {
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  versionText: {
    fontSize: 20,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
