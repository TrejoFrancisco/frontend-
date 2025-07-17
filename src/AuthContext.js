// src/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar token al iniciar la app
  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (error) {
      console.error("Error loading token:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToken = async (newToken) => {
    try {
      await AsyncStorage.setItem("authToken", newToken);
      setToken(newToken);
      console.log("Token guardado:", newToken);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  };

  const removeToken = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      setToken(null);
      console.log("Token eliminado");
    } catch (error) {
      console.error("Error removing token:", error);
    }
  };

  const logout = () => {
    removeToken();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isLoading,
        saveToken,
        removeToken,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
