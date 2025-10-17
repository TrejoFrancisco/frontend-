import { useEffect } from "react";
import { Alert, BackHandler } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { useAuth } from "../AuthContext";

export const useBackHandler = (navigation) => {
  const { logout } = useAuth();

  useEffect(() => {
    const backAction = () => {
      Alert.alert("Cerrar sesión", "¿Deseas cerrar sesión?", [
        {
          text: "Cancelar",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "Sí",
          onPress: async () => {
            if (logout) {
              await logout();
            }
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
              })
            );
          },
        },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [navigation, logout]);
};
