import React, { useState, useEffect, useContext } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import PaperTheme from '@/components/PaperTheme';
import {
  StyleSheet,
  View,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  FlatList,
} from 'react-native';
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Peripheral,
  PeripheralInfo,
} from 'react-native-ble-manager';
import { Banner, Button, Card, Icon, Portal, Snackbar, Text } from 'react-native-paper';
import { useNavigation, useRouter } from 'expo-router';
import { PeripheralsContext } from '@/contexts/PeripheralsContext';

const SECONDS_TO_SCAN_FOR = 1;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

declare module 'react-native-ble-manager' {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

const App = () => {
  const paperTheme = PaperTheme();
  const styles = StyleSheet.create({
    AndroidSafeArea: {
      flex: 1,
      backgroundColor: paperTheme.colors.background,
    },
    buttonGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%'
    },
    body: {
      flex: 1,
      marginHorizontal: 16,
    }
  });

  const navigation = useNavigation();
  const router = useRouter();

  const [infoSnackbarVisible, setInfoSnackbarVisible] = React.useState(false);
  const [infoSnackbarMessage, setInfoSnackbarMessage] = React.useState('');
  const onDismissInfoSnackbar = () => setInfoSnackbarVisible(false);

  const [isScanning, setIsScanning] = useState(false);
  // Use context instead now
  // const [peripherals, setPeripherals] = useState(
  //   new Map<Peripheral['id'], Peripheral>(),
  // );
  const { peripherals, setPeripherals } = useContext(PeripheralsContext);

  const startScan = () => {
    if (!isScanning) {
      // reset found peripherals before scan
      setPeripherals(new Map<Peripheral['id'], Peripheral>());

      try {
        console.debug('[startScan] starting scan...');
        setIsScanning(true);
        BleManager.scan(SERVICE_UUIDS, SECONDS_TO_SCAN_FOR, ALLOW_DUPLICATES, {
          matchMode: BleScanMatchMode.Sticky,
          scanMode: BleScanMode.LowLatency,
          callbackType: BleScanCallbackType.AllMatches,
        })
          .then(() => {
            console.debug('[startScan] scan promise returned successfully.');
          })
          .catch((err: any) => {
            console.error('[startScan] ble scan returned in error', err);
          });
      } catch (error) {
        console.error('[startScan] ble scan error thrown', error);
      }
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    console.debug('[handleStopScan] scan is stopped.');
  };

  const handleDisconnectedPeripheral = (
    event: BleDisconnectPeripheralEvent,
  ) => {
    console.debug(
      `[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`,
    );

    setInfoSnackbarMessage(`Disconnected from peripheral ${event.peripheral}.`);
    setInfoSnackbarVisible(true);

    setPeripherals(map => {
      let p = map.get(event.peripheral);
      if (p) {
        p.connected = false;
        return new Map(map.set(event.peripheral, p));
      }
      return map;
    });
  };

  const handleConnectPeripheral = (event: any) => {
    console.log(`[handleConnectPeripheral][${event.peripheral}] connected.`);
  };

  const handleUpdateValueForCharacteristic = (
    data: BleManagerDidUpdateValueForCharacteristicEvent,
  ) => {
    console.debug(
      `[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}'`,
    );
  };

  const handleDiscoverPeripheral = (peripheral: Peripheral) => {
    console.debug('[handleDiscoverPeripheral] new BLE peripheral=', peripheral);
    if (!peripheral.name) {
      // peripheral.name = 'NO NAME';
      return;
    }
    setPeripherals(map => {
      return new Map(map.set(peripheral.id, peripheral));
    });
  };

  const togglePeripheralConnection = async (peripheral: Peripheral) => {
    if (peripheral && peripheral.connected) {
      try {
        await BleManager.disconnect(peripheral.id);
      } catch (error) {
        console.error(
          `[togglePeripheralConnection][${peripheral.id}] error when trying to disconnect device.`,
          error,
        );
      }
    } else {
      await connectPeripheral(peripheral);
    }
  };

  const connectPeripheral = async (peripheral: Peripheral) => {
    try {
      if (peripheral) {
        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        await BleManager.connect(peripheral.id);
        console.debug(`[connectPeripheral][${peripheral.id}] connected.`);
        setInfoSnackbarMessage(`Connected to peripheral ${peripheral.id}.`);
        setInfoSnackbarVisible(true);

        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.connecting = false;
            p.connected = true;
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        // before retrieving services, it is often a good idea to let bonding & connection finish properly
        await sleep(900);

        /* Test read current RSSI value, retrieve services first */
        const peripheralData = await BleManager.retrieveServices(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
          peripheralData,
        );

        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            return new Map(map.set(p.id, p));
          }
          return map;
        });

        const rssi = await BleManager.readRSSI(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`,
        );

        if (peripheralData.characteristics) {
          for (let characteristic of peripheralData.characteristics) {
            if (characteristic.descriptors) {
              for (let descriptor of characteristic.descriptors) {
                try {
                  let data = await BleManager.readDescriptor(
                    peripheral.id,
                    characteristic.service,
                    characteristic.characteristic,
                    descriptor.uuid,
                  );
                  console.debug(
                    `[connectPeripheral][${peripheral.id}] ${characteristic.service} ${characteristic.characteristic} ${descriptor.uuid} descriptor read as:`,
                    data,
                  );
                } catch (error) {
                  console.error(
                    `[connectPeripheral][${peripheral.id}] failed to retrieve descriptor ${descriptor} for characteristic ${characteristic}:`,
                    error,
                  );
                }
              }
            }
          }
        }

        setPeripherals(map => {
          let p = map.get(peripheral.id);
          if (p) {
            p.rssi = rssi;
            return new Map(map.set(p.id, p));
          }
          return map;
        });
      }
    } catch (error) {
      console.error(
        `[connectPeripheral][${peripheral.id}] connectPeripheral error`,
        error,
      );
      setInfoSnackbarMessage(
        `Failed to connect to peripheral ${peripheral.id}. Error: ${error}`,
      );
      setInfoSnackbarVisible(true);
    }
  };

  function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  useEffect(() => {
    try {
      BleManager.start({ showAlert: false })
        .then(() => console.debug('BleManager started.'))
        .catch((error: any) =>
          console.error('BeManager could not be started.', error),
        );
    } catch (error) {
      console.error('unexpected error starting BleManager.', error);
      return;
    }

    const listeners = [
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        handleDiscoverPeripheral,
      ),
      bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan),
      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        handleDisconnectedPeripheral,
      ),
      bleManagerEmitter.addListener(
        'BleManagerDidUpdateValueForCharacteristic',
        handleUpdateValueForCharacteristic,
      ),
      bleManagerEmitter.addListener(
        'BleManagerConnectPeripheral',
        handleConnectPeripheral,
      ),
    ];

    return () => {
      console.debug('[app] main component unmounting. Removing listeners...');
      for (const listener of listeners) {
        listener.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const viewPeripheralDetails = (connectedPeripheralId: string) => {
    // router.navigate('details');
    router.navigate({ pathname: 'details', params: { connectedPeripheralId } });

  }

  const renderItem = ({ item }: { item: Peripheral }) => {
    return (
      <Card>
        <Card.Title title={item.name} subtitle={item.id} left={props => <Icon source="bluetooth" size={30}></Icon>} />
        <Card.Content>
          <Text>RSSI: {item.rssi}</Text>
          <Text>Local name: {item?.advertising?.localName}</Text>
        </Card.Content>
        <Card.Actions>
          {item.connected &&
            <Button mode='outlined' onPress={() => viewPeripheralDetails(item.id)} icon='view-list-outline'>
              Peripheral Details
            </Button>
          }
          <Button onPress={() => togglePeripheralConnection(item)} icon={item.connected ? 'link-variant-remove' : 'link-variant'} disabled={item.connecting}>
            {item.connected ? 'Disconnect' : item.connecting ? 'Connecting...' : 'Connect'}
          </Button>
        </Card.Actions>
      </Card >
    );
  };

  return (
    <SafeAreaView style={styles.AndroidSafeArea}>
      <StatusBar />
      <Portal.Host>
        <View style={styles.body}>
          <View style={styles.buttonGroup}>
            <Button icon="magnify" mode='contained-tonal' onPress={startScan} disabled={isScanning}>
              {isScanning ? 'Scanning...' : 'Scan Bluetooth'}
            </Button>
          </View>

          <Banner
            visible={Array.from(peripherals.values()).length === 0}
            actions={[
              {
                label: 'Scan Bluetooth',
                onPress: startScan,
              },
            ]}
          >
            No peripherals found. Press Scan Bluetooth to search.
          </Banner>


          <FlatList
            data={Array.from(peripherals.values())}
            contentContainerStyle={{ rowGap: 16 }}
            renderItem={renderItem}
            keyExtractor={item => item.id}
          />

          <Portal>
            <Snackbar
              visible={infoSnackbarVisible}
              onDismiss={onDismissInfoSnackbar}
              action={{
                label: 'Dismiss',
                onPress: () => {
                  onDismissInfoSnackbar();
                },
              }}>
              {infoSnackbarMessage}
            </Snackbar>
          </Portal>
        </View>
      </Portal.Host>
    </SafeAreaView>
  );
};

export default App;