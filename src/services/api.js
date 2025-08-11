import axios from "axios";

const BASE_URL = "https://018c77fa1dde.ngrok-free.app/api";

console.log("API Base URL:", BASE_URL);

export const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000, // Aumentado a 15 segundos
});

// Para debug, añade interceptores más detallados
API.interceptors.request.use(
  (request) => {
    console.log("=== AXIOS REQUEST ===");
    console.log("URL:", request.url);
    console.log("Method:", request.method);
    console.log("Base URL:", request.baseURL);
    console.log("Full URL:", `${request.baseURL}${request.url}`);
    console.log("Headers:", request.headers);
    console.log("Data:", request.data);
    console.log("=====================");
    return request;
  },
  (error) => {
    console.log("Request setup error:", error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log("=== AXIOS RESPONSE ===");
    console.log("Status:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("Data:", response.data);
    console.log("======================");
    return response;
  },
  (error) => {
    console.log("=== AXIOS ERROR ===");
    console.log("Error message:", error.message);
    console.log("Error code:", error.code);

    if (error.response) {
      // El servidor respondió con un código de error
      console.log("Response status:", error.response.status);
      console.log("Response data:", error.response.data);
      console.log("Response headers:", error.response.headers);
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      console.log("Request made but no response received");
      console.log("Request details:", error.request);
    } else {
      // Algo pasó al configurar la petición
      console.log("Error setting up request:", error.message);
    }

    if (error.code === "NETWORK_ERROR" || error.code === "ECONNREFUSED") {
      console.log("❌ NETWORK ERROR - Server might be unreachable");
      console.log("Check if:");
      console.log("1. Backend server is running");
      console.log("2. IP address is correct (192.168.0.15)");
      console.log("3. Port 8000 is open in firewall");
      console.log("4. Phone and PC are on same WiFi network");
    }

    console.log("==================");
    return Promise.reject(error);
  }
);

// Función de prueba para verificar conectividad
export const testConnection = async () => {
  try {
    console.log("Testing connection to:", BASE_URL);
    const response = await API.get("/test-connection");
    console.log("Connection test successful:", response.data);
    return true;
  } catch (error) {
    console.log("Connection test failed:", error.message);
    return false;
  }
};
