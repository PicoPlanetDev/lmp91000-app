import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Chip, DataTable, Dialog, Divider, List, Portal, RadioButton, Snackbar, Text, TextInput } from 'react-native-paper';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import BleManager, { PeripheralInfo, Peripheral, Characteristic } from 'react-native-ble-manager';
import { PeripheralsContext } from '@/contexts/PeripheralsContext';
import Dropdown from '@/components/Dropdown';
import { act } from 'react-test-renderer';

const PeripheralDetails = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { peripherals, setPeripherals } = React.useContext(PeripheralsContext);

  const retrieveConnected = async () => {
    try {
      const connectedPeripherals = await BleManager.getConnectedPeripherals();
      if (connectedPeripherals.length === 0) {
        console.warn('[retrieveConnected] No connected peripherals found.');
        return;
      }

      console.debug(
        '[retrieveConnected]', connectedPeripherals.length, 'connectedPeripherals',
        connectedPeripherals,
      );

      for (let peripheral of connectedPeripherals) {
        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connected = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });
      }
    } catch (error) {
      console.error(
        '[retrieveConnected] unable to retrieve connected peripherals.',
        error,
      );
    }
  };

  const [peripheralInfos, setPeripheralInfos] = React.useState<PeripheralInfo[]>([]);

  const retrieveServices = async () => {
    setPeripheralInfos([]);
    for (let [peripheralId, peripheral] of peripherals) {
      if (peripheral.connected) {
        const newPeripheralInfo = await BleManager.retrieveServices(peripheralId);
        setPeripheralInfos(peripheralInfos => [...peripheralInfos, newPeripheralInfo]);
      }
    }
    return peripheralInfos;
  };

  const readCharacteristics = async () => {
    let services = await retrieveServices();

    for (let peripheralInfo of services) {
      peripheralInfo.characteristics?.forEach(async c => {
        try {
          const value = await BleManager.read(peripheralInfo.id, c.service, c.characteristic);
          console.log("[readCharacteristics]", "peripheralId", peripheralInfo.id, "service", c.service, "char", c.characteristic, "\n\tvalue", value);
        } catch (error) {
          console.debug("[readCharacteristics]", "Error reading characteristic", error);
        }
      });
    }
  }

  const readCharacteristic = async (peripheralId: string, service: string, characteristic: string) => {
    try {
      const value = await BleManager.read(peripheralId, service, characteristic);
      return value;
      // console.log("[readCharacteristic]", "peripheralId", peripheralId, "service", service, "char", characteristic, "\n\tvalue", value);
    } catch (error) {
      console.debug("[readCharacteristic]", "Error reading characteristic", error);
    }
  }

  const writeCharacteristic = async (peripheralId: string, service: string, characteristic: string, data: string) => {
    const dataArray = data.split(' ').map(byte => parseInt(byte));
    try {
      await BleManager.write(peripheralId, service, characteristic, dataArray);
      console.log("[writeCharacteristic]", "peripheralId", peripheralId, "service", service, "char", characteristic, "data", dataArray);
    } catch (error) {
      console.debug("[writeCharacteristic]", "Error writing characteristic", error);
    }
  }

  const [snackBarVisible, setSnackBarVisible] = React.useState(false);
  const [snackBarMessage, setSnackBarMessage] = React.useState('');

  const connectedPeripheralsList = Array.from(peripherals)
    .filter(([_, peripheral]) => peripheral.connected)
    .map(([id, peripheral]) => ({
      label: peripheral.name ? peripheral.name : peripheral.id,
      value: peripheral.id,
    }));

  const [selectedPeripheralId, setSelectedPeripheralId] = React.useState("");
  const onSelectedPeripheralChange = (value: string) => {
    setSelectedPeripheralId(value);
    // setSnackBarMessage(`Selected peripheral: ${value}`);
    // setSnackBarVisible(true);
  }

  // Allow button on scan page to set the selectedPeripheralId
  if (params.connectedPeripheralId) {
    if (selectedPeripheralId !== params.connectedPeripheralId) {
      setSelectedPeripheralId(params.connectedPeripheralId.toString());
    }
  }

  const selectedPeripheral = peripherals.get(selectedPeripheralId);

  // Helper functions to get human-readable strings for common services and characteristics
  const getServiceDescriptionString = (uuid: string) => {
    switch (uuid) {
      case '1800':
        return 'Generic Access Service';
      case '1801':
        return 'Generic Attribute Service';
      case '180a':
        return 'Device Information Service';
      default:
        return 'Service';
    }
  }

  const getCharacteristicDescriptionString = (uuid: string) => {
    switch (uuid) {
      case '2a00':
        return 'Device Name';
      case '2a01':
        return 'Appearance';
      case '2a04':
        return 'Peripheral Preferred Connection Parameters';
      case '2a05':
        return 'Service Changed';
      case '2a23':
        return 'System ID';
      case '2a24':
        return 'Model Number String';
      case '2a25':
        return 'Serial Number String';
      case '2a26':
        return 'Firmware Revision String';
      case '2a27':
        return 'Hardware Revision String';
      case '2a28':
        return 'Software Revision String';
      case '2a29':
        return 'Manufacturer Name String';
      default:
        return 'Characteristic';
    }
  }

  const [readDialogVisible, setReadDialogVisible] = React.useState(false);
  const [writeDialogVisible, setWriteDialogVisible] = React.useState(false);
  const [activeCharacteristic, setActiveCharacteristic] = React.useState<Characteristic>();
  const [activeValue, setActiveValue] = React.useState<string>('');
  const showReadDialog = async (characteristic: Characteristic) => {
    setActiveCharacteristic(characteristic);
    setActiveValue(await readCharacteristic(selectedPeripheralId, characteristic.service, characteristic.characteristic)
      .then(value => value ? value.toString() : ''));
    setReadDialogVisible(true);
  }
  const showWriteDialog = (characteristic: Characteristic) => {
    setActiveCharacteristic(characteristic);
    setWriteDialogVisible(true);
  }

  return (
    <Portal.Host>
      <ScrollView style={styles.body}>

        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Peripheral Details" />
        </Appbar.Header>

        <View style={styles.buttonGroup}>
          <Button mode='outlined' onPress={retrieveConnected} icon="refresh" disabled={true}>
            Refresh
          </Button>
        </View>

        <View>
          {connectedPeripheralsList.length > 0 && (
            <Dropdown
              label="Select connected peripheral"
              options={connectedPeripheralsList}
              value={selectedPeripheralId}
              onChange={onSelectedPeripheralChange}
            />)}
        </View>

        <Divider />

        <View>
          <Text variant='titleMedium'>Properties</Text>

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Property</DataTable.Title>
              <DataTable.Title>Value</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>Name</DataTable.Cell>
              <DataTable.Cell>{selectedPeripheral?.name}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>ID</DataTable.Cell>
              <DataTable.Cell>{selectedPeripheral?.id}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>RSSI</DataTable.Cell>
              <DataTable.Cell>{selectedPeripheral?.rssi}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Local Name</DataTable.Cell>
              <DataTable.Cell>{selectedPeripheral?.advertising.localName}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>TX Power Level</DataTable.Cell>
              <DataTable.Cell>{selectedPeripheral?.advertising.txPowerLevel}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </View>

        <Divider />

        <View>
          <Text variant='titleMedium'>Services and Characteristics</Text>
        </View>

        <View style={styles.buttonGroup}>
          <Button mode='outlined' onPress={retrieveServices} icon="file-document-multiple">
            Retrieve services
          </Button>
          {/* <Button mode='outlined' onPress={readCharacteristics} icon="file-document">
            Read characteristics
          </Button> */}
        </View>

        {/* Display tree-style List of services and their characteristics */}
        <List.Section title='Services'>
          {/* Uses peripheralInfos then finds only the services associated with the selectedPeripheral (by ID) */}
          {peripheralInfos.map(peripheralInfo => (
            peripheralInfo.id === selectedPeripheralId && peripheralInfo?.services?.map(service => (
              <List.Accordion
                key={service.uuid}
                title={service.uuid}
                description={getServiceDescriptionString(service.uuid)}
                left={props => <List.Icon {...props} icon="file-document-multiple" />}
              >
                {peripheralInfo.characteristics?.map(characteristic => (
                  characteristic.service === service.uuid && (
                    <List.Item
                      key={characteristic.characteristic}
                      title={characteristic.characteristic}
                      description={getCharacteristicDescriptionString(characteristic.characteristic)}
                      left={props => <List.Icon {...props} icon="file-document" />}
                      right={() =>
                        <View style={styles.buttonGroup}>
                          {characteristic.properties?.Read && <Chip mode="outlined" onPress={() => showReadDialog(characteristic)} icon='eye'>Read</Chip>}
                          {characteristic.properties?.Write && <Chip mode="outlined" onPress={() => showWriteDialog(characteristic)} icon='pencil'>Write</Chip>}
                        </View>
                      }
                    />
                  )
                ))}
              </List.Accordion>
            ))
          ))}
        </List.Section>

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

        <Portal>
          <Dialog visible={readDialogVisible} onDismiss={() => setReadDialogVisible(false)}>
            <Dialog.Title>Read Characteristic</Dialog.Title>
            <Dialog.Content>
              <DataTable>
                <DataTable.Row>
                  <DataTable.Cell>Service</DataTable.Cell>
                  <DataTable.Cell>{activeCharacteristic?.service}</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                  <DataTable.Cell>Characteristic</DataTable.Cell>
                  <DataTable.Cell>{activeCharacteristic?.characteristic}</DataTable.Cell>
                </DataTable.Row>
                <DataTable.Row>
                  <DataTable.Cell>Value</DataTable.Cell>
                  <DataTable.Cell>{activeValue}</DataTable.Cell>
                </DataTable.Row>
              </DataTable>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setReadDialogVisible(false)}>Dismiss</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Portal>
          <Dialog visible={writeDialogVisible} onDismiss={() => setWriteDialogVisible(false)}>
            <Dialog.Title>Write Characteristic</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Data"
                value={activeValue}
                onChangeText={text => setActiveValue(text)}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setReadDialogVisible(false)}>Cancel</Button>
              <Button onPress={() => activeCharacteristic &&
                writeCharacteristic(selectedPeripheralId, activeCharacteristic?.service, activeCharacteristic?.characteristic, activeValue)
                  .then(() => setWriteDialogVisible(false))}>Write</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

      </ScrollView>
    </Portal.Host>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    marginHorizontal: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  }
});

export default PeripheralDetails;