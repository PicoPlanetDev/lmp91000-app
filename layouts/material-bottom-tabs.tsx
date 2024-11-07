import {
    createMaterialBottomTabNavigator,
    MaterialBottomTabNavigationOptions,
} from "react-native-paper/react-navigation";

import { withLayoutContext } from "expo-router";

const { Navigator } = createMaterialBottomTabNavigator();

export const MaterialBottomTabs = withLayoutContext<
    MaterialBottomTabNavigationOptions,
    typeof Navigator
>(Navigator);