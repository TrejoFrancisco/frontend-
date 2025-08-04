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
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      const storedUser = await AsyncStorage.getItem("userData");

      if (storedToken) {
        setToken(storedToken);
      }

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToken = async (newToken, userData) => {
    try {
      await AsyncStorage.setItem("authToken", newToken);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      console.log("Token y datos de usuario guardados:", newToken, userData);
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  const removeToken = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");

      setToken(null);
      setUser(null);

      console.log("Token y datos de usuario eliminados");
    } catch (error) {
      console.error("Error removing auth data:", error);
    }
  };

  const logout = () => {
    removeToken();
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
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
