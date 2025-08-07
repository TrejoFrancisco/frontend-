import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import RestauranteScreen from "../screens/modules/Restaurante/Admin/RestauranteHomeScreen";
import MeseroScreen from "../screens/modules/Restaurante/Mesero/MeseroScreen";
import CocinaScreen from "../screens/modules/Restaurante/Cocina/CocinaScreen";
import BartenderScreen from "../screens/modules/Restaurante/Bartender/BartenderScreen";

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="RestauranteHome" component={RestauranteScreen} />
      <Stack.Screen name="MeseroScreen" component={MeseroScreen} />
      <Stack.Screen name="CocinaScreen" component={CocinaScreen} />
      <Stack.Screen name="BartenderScreen" component={BartenderScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
