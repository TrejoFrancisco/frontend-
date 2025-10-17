import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import RestauranteScreen from "../screens/modules/Restaurante/Admin/RestauranteHomeScreen";
import MeseroScreen from "../screens/modules/Restaurante/Mesero/MeseroScreen";
import MeseroScreen2 from "../screens/modules/Restaurante/Mesero/MeseroScreen2";
import CocinaScreen from "../screens/modules/Restaurante/Cocina/CocinaScreen";
import BartenderScreen from "../screens/modules/Restaurante/Bartender/BartenderScreen";
import ChefScreen from "../screens/modules/Restaurante/Chef/ChefScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="RestauranteHome"
        component={RestauranteScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MeseroScreen"
        component={MeseroScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MeseroScreen2"
        component={MeseroScreen2}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CocinaScreen"
        component={CocinaScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BartenderScreen"
        component={BartenderScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChefScreen"
        component={ChefScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
