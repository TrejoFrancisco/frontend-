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
import axios from "axios";
import { useAuth } from "../AuthContext";
import { API } from "../services/api";

const { width, height } = Dimensions.get("window");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { saveToken } = useAuth(); // Importa la función para guardar el token

  const handleLogin = async () => {
    setError("");

    // Validación básica
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

      const { token, role } = response.data.data;

      // Guarda el token en el contexto
      saveToken(token);

      Alert.alert("Login exitoso");

      // Redirección por rol
      if (role === "admin_local_restaurante") {
        navigation.navigate("RestauranteHome");
      } else if (role === "admin_cliente_Bar") {
        navigation.navigate("BarHome");
      } else if (role === "admin_cliente_Tienda") {
        navigation.navigate("TiendaHome");
      } else {
        navigation.navigate("Home");
      }
    } catch (error) {
      // Verifica si es una respuesta con error del backend
      if (error.response) {
        const { http_code, message } = error.response.data.error || {};

        if (http_code === 401) {
          setError(message || "Credenciales inválidas.");
        } else {
          setError(message || "Ocurrió un error inesperado.");
        }
      } else {
        // Error de red u otro tipo
        setError("No se pudo conectar con el servidor.");
      }

      console.log("Error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Header con logo */}
      <View style={styles.headerContainer}>
        <View style={styles.logoContainer}>
          <Image
            source={require("../../assets/icono.png")} // Ruta a tu imagen
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Inicio de Sesión</Text>
      </View>

      {/* Card principal */}
      <View style={styles.card}>
        {/* Error message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Formulario */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>@</Text>
              <TextInput
                placeholder="tucorreo@gmail.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "🙈"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loadingText}>Iniciando sesión...</Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f9ff",
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
    color: "#64748b",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    marginHorizontal: 4,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    fontSize: 20,
    color: "#9ca3af",
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    paddingVertical: 16,
  },
  eyeButton: {
    padding: 8,
  },
  eyeIcon: {
    fontSize: 20,
    color: "#9ca3af",
  },
  loginButton: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginLeft: 12,
    fontSize: 14,
  },
});
