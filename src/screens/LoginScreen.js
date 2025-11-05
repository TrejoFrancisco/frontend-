import React, { useState, useEffect } from "react";
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
  Keyboard,
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const { saveToken } = useAuth();

  // Fix para el KeyboardAvoidingView en primera carga
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    setError("");

    if (!clave) {
      setError("Por favor ingresa tu clave de acceso");
      return;
    }

    if (clave.length < 4) {
      setError("La clave debe tener al menos 4 caracteres");
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/auth/login-clave", { clave });
      const { token: newToken, role, id, name } = response.data.data;
      await saveToken(newToken, { id, name, role });

      // Cerrar el teclado antes de navegar
      Keyboard.dismiss();

      Alert.alert("Login exitoso", `Bienvenido ${name}`);

      // Determinar la ruta según el rol
      let targetScreen = "Home";
      if (role === "admin_local_restaurante") targetScreen = "RestauranteHome";
      else if (role === "meseros_restaurant") targetScreen = "MeseroScreen2";
      else if (role === "cocina") targetScreen = "CocinaScreen";
      else if (role === "bartender_restaurante")
        targetScreen = "BartenderScreen";
      else if (role === "cajero") targetScreen = "CajeroScreen";
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
      } else {
        setError("No se pudo conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearError = () => {
    setError("");
  };

  return (
    <View style={styles.container}>
      {/* Fondos decorativos */}
      <View style={styles.backgroundDecoration}>
        <View style={styles.circleTop} />
        <View style={styles.circleBottom} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Logo - Se mantiene arriba */}
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
            <Text style={styles.subtitle}>Ingresa tu clave para continuar</Text>
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
                <TouchableOpacity
                  style={styles.errorCloseButton}
                  onPress={handleClearError}
                >
                  <Text style={styles.errorCloseText}>✕</Text>
                </TouchableOpacity>
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
                  <View style={styles.inputIconContainer}>
                    <Text style={styles.inputIcon}>🔑</Text>
                  </View>
                  <TextInput
                    placeholder="Ingresa tu clave"
                    placeholderTextColor="#6B7280"
                    value={clave}
                    onChangeText={(text) => {
                      setClave(text);
                      if (error) setError(""); // Limpiar error al escribir
                    }}
                    onFocus={() => setFocusedInput("clave")}
                    onBlur={() => setFocusedInput(null)}
                    autoCapitalize="characters"
                    secureTextEntry={true}
                    style={[styles.input, { color: "#000" }]}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                    maxLength={20}
                    editable={!loading}
                  />
                  {clave.length > 0 && !loading && (
                    <TouchableOpacity
                      style={styles.clearInputButton}
                      onPress={() => {
                        setClave("");
                        setError("");
                      }}
                    >
                      <Text style={styles.clearInputText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {clave.length > 0 && clave.length < 4 && (
                  <Text style={styles.helperText}>Mínimo 4 caracteres</Text>
                )}
              </View>

              {/* Botón */}
              <TouchableOpacity
                onPress={handleLogin}
                style={[
                  styles.loginButton,
                  (loading || !clave) && styles.loginButtonDisabled,
                ]}
                disabled={loading || !clave}
                activeOpacity={0.8}
              >
                <View style={styles.loginButtonContent}>
                  {loading ? (
                    <>
                      <ActivityIndicator color="#FFFFFF" size="small" />
                      <Text style={styles.loadingText}>Verificando...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                      <Text style={styles.loginButtonIcon}>→</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerContainer}>
              <Text style={styles.versionText}>v1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Layout base */
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  keyboardAvoidingView: {
    flex: 1,
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
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#1e3a8a",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
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
    marginBottom: 8,
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
  errorCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  errorCloseText: {
    fontSize: 20,
    color: "#DC2626",
    fontWeight: "bold",
  },

  /* Formulario */
  formContainer: {
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
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
    paddingRight: 12,
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
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  inputIcon: {
    fontSize: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontWeight: "500",
  },
  clearInputButton: {
    padding: 8,
  },
  clearInputText: {
    fontSize: 18,
    color: "#9CA3AF",
    fontWeight: "bold",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    marginLeft: 4,
  },

  /* Botón login */
  loginButton: {
    backgroundColor: "#1F2937",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: "#1F2937",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.5,
    backgroundColor: "#9CA3AF",
  },
  loginButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  loginButtonIcon: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  loadingText: {
    color: "#FFFFFF",
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
  },

  /* Footer */
  footerContainer: {
    alignItems: "center",
    paddingTop: 20,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  versionText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
