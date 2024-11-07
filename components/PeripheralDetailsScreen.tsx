import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Peripheral, PeripheralInfo } from 'react-native-ble-manager';
import { Appbar, Text } from 'react-native-paper';
import { useNavigation } from 'expo-router';



const PeripheralDetailsScreen = ({ route }: PeripheralDetailsProps) => {
    const navigation = useNavigation();

    const peripheralData = route.params.peripheralData;
    console.log('peripheralData:', JSON.stringify(peripheralData, null, 2));

    // Function to render characteristics for a given service
    const renderCharacteristicsForService = (serviceUUID: string) => {
        const characteristics = peripheralData.characteristics ?? [];
        return characteristics
            .filter(char => char.service === serviceUUID)
            .map((char, index) => (
                <View key={index} style={styles.characteristicContainer}>
                    <Text style={styles.characteristicTitle}>
                        Characteristic: {char.characteristic}
                    </Text>
                    <Text>Properties: {Object.values(char.properties).join(', ')}</Text>
                </View>
            ));
    };

    return (
        
    );
};

// Add some basic styling
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    titleWithMargin: {
        marginTop: 20, // Adjust this value as needed
    },
    detail: {
        marginTop: 5,
        fontSize: 16,
    },
    serviceContainer: {
        marginTop: 15,
    },
    serviceTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    characteristic: {
        fontSize: 16,
    },
    scrollViewStyle: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
    },
    characteristicContainer: {
        marginTop: 10,
    },
    characteristicTitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    propertyText: {
        fontSize: 14,
        marginLeft: 10,
    },
});

export default PeripheralDetailsScreen;