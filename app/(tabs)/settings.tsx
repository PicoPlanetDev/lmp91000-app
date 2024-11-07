import React from 'react';
import { useNavigation } from 'expo-router';
import {
    View,
    StyleSheet,
    Platform,
    PermissionsAndroid,
    Permission,
} from 'react-native';
import {
    Button,
    Appbar,
    Snackbar,
    Portal,
    Text,
    Icon,
    Chip,
    Divider
} from 'react-native-paper';
import BleManager from 'react-native-ble-manager';

const styles = StyleSheet.create({
    settingsContainer: {
        margin: 16,
        gap: 16,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
    },
    settingsGroup: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        gap: 8,
    },
    settingsListItem: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
});

const App = () => {
    const navigation = useNavigation(); // for back button

    const [snackBarVisible, setSnackBarVisible] = React.useState(false);
    const [snackBarMessage, setSnackBarMessage] = React.useState('');

    const enableBluetooth = async () => {
        try {
            await BleManager.enableBluetooth();
            setSnackBarMessage('Bluetooth enabled successfully');
            setSnackBarVisible(true);
        } catch (error) {
            console.error('[enableBluetooth] thrown', error);
            setSnackBarMessage('Failed to enable Bluetooth: ' + (error as Error).message);
            setSnackBarVisible(true);
        }
    }

    const requestAndroidPermissions = () => {
        if (Platform.OS === 'android') {
            PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]).then(result => {
                if (result) {
                    console.debug('[requestAndroidPermissions] User accepts runtime permissions');
                    setSnackBarMessage('Permissions granted successfully');
                    setSnackBarVisible(true);
                } else {
                    console.error('[requestAndroidPermissions] User refuses runtime permissions',);
                    setSnackBarMessage('Requesting permissions failed, please try again');
                    setSnackBarVisible(true);
                }
                checkPermissions();
            });
        }
    };

    const getPermissionStatus = async (permission: Permission) => {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.check(permission);
            return granted;
        }
        return false;
    }

    const [bluetoothScanPermission, setBluetoothScanPermission] = React.useState(false);
    const [bluetoothConnectPermission, setBluetoothConnectPermission] = React.useState(false);
    const [accessLocationPermission, setAccessLocationPermission] = React.useState(false);

    const checkPermissions = async () => {
        const scanPermission = await getPermissionStatus(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        const connectPermission = await getPermissionStatus(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        const locationPermission = await getPermissionStatus(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

        setBluetoothScanPermission(scanPermission);
        setBluetoothConnectPermission(connectPermission);
        setAccessLocationPermission(locationPermission);
    };

    checkPermissions();

    return (
        <Portal.Host>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="Settings" />
            </Appbar.Header>

            <View style={styles.settingsContainer}>
                <View style={styles.settingsGroup}>
                    {/* Permissions */}
                    <Text variant='titleMedium'>Permissions</Text>
                    <Text variant='bodyLarge'>
                        Please grant the following permissions to use this app:
                    </Text>
                    <View style={styles.settingsListItem}>
                        <Text>Bluetooth Scan</Text>
                        {bluetoothScanPermission ? <Chip icon="check">Granted</Chip> : <Chip icon="close">Denied</Chip>}
                    </View>
                    <View style={styles.settingsListItem}>
                        <Text>Bluetooth Connect</Text>
                        {bluetoothConnectPermission ? <Chip icon="check">Granted</Chip> : <Chip icon="close">Denied</Chip>}
                    </View>
                    <View style={styles.settingsListItem}>
                        <Text>Access Precise Location</Text>
                        {accessLocationPermission ? <Chip icon="check">Granted</Chip> : <Chip icon="close">Denied</Chip>}
                    </View>
                    <Text variant='bodyMedium'>
                        If any of the permissions are denied, please allow them by clicking the button below.
                    </Text>
                    <Button icon="shield" mode='contained-tonal' onPress={requestAndroidPermissions}>
                        Allow Permissions
                    </Button>
                </View>

                <Divider />

                <View style={styles.settingsGroup}>
                    {/* Bluetooth enable */}
                    <Text variant='titleMedium'>Bluetooth</Text>
                    <View style={styles.settingsListItem}>
                        <Text>Ensure Bluetooth is enabled</Text>
                        <Button icon="bluetooth" mode='contained-tonal' onPress={enableBluetooth}>
                            Enable Bluetooth
                        </Button>
                    </View>
                </View>
            </View>

            <Portal>
                <Snackbar
                    visible={snackBarVisible}
                    onDismiss={() => setSnackBarVisible(false)}
                    action={{
                        label: 'Dismiss',
                        onPress: () => {
                            setSnackBarVisible(false);
                        },
                    }}>
                    {snackBarMessage}
                </Snackbar>
            </Portal>
        </Portal.Host>
    );
}

export default App;