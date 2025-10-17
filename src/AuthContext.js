import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar token al iniciar
  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("userData");

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error("Error loading token:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveToken = async (newToken, userData) => {
    try {
      await AsyncStorage.setItem("authToken", newToken);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
    } catch (error) {
      console.error("Error saving token:", error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, saveToken, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
