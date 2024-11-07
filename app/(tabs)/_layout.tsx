import { MaterialBottomTabs } from "../../layouts/material-bottom-tabs";

export default function TabLayout() {
    return (
        <MaterialBottomTabs
            safeAreaInsets={{ bottom: 0 }}
        >
            <MaterialBottomTabs.Screen
                name="index"
                options={{
                    title: 'Connect',
                    tabBarIcon: 'bluetooth-connect',
                }}
            />
            <MaterialBottomTabs.Screen
                name="details"
                options={{
                    title: 'Details',
                    tabBarIcon: 'view-dashboard',
                }}
            />
            <MaterialBottomTabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: 'cog',
                }}
            />
        </MaterialBottomTabs>
    );
}
