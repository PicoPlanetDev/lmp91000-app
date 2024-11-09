import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Appbar,
  Button,
  Chip,
  DataTable,
  Dialog,
  Divider,
  List,
  Portal,
  RadioButton,
  Snackbar,
  Text,
  TextInput,
} from "react-native-paper";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import BleManager, {
  PeripheralInfo,
  Peripheral,
  Characteristic,
} from "react-native-ble-manager";
import { PeripheralsContext } from "@/contexts/PeripheralsContext";
import Dropdown from "@/components/Dropdown";
import {
  Chart,
  Line,
  Area,
  HorizontalAxis,
  VerticalAxis,
} from "react-native-responsive-linechart";

const PeripheralDetails = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { peripherals, setPeripherals } = React.useContext(PeripheralsContext);

  const retrieveConnected = async () => {
    try {
      const connectedPeripherals = await BleManager.getConnectedPeripherals();
      if (connectedPeripherals.length === 0) {
        console.warn("[retrieveConnected] No connected peripherals found.");
        return;
      }

      console.debug(
        "[retrieveConnected]",
        connectedPeripherals.length,
        "connectedPeripherals",
        connectedPeripherals
      );

      for (let peripheral of connectedPeripherals) {
        setPeripherals((map) => {
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
        "[retrieveConnected] unable to retrieve connected peripherals.",
        error
      );
    }
  };

  const [peripheralInfos, setPeripheralInfos] = React.useState<
    PeripheralInfo[]
  >([]);

  const retrieveServices = async () => {
    setPeripheralInfos([]);
    for (let [peripheralId, peripheral] of peripherals) {
      if (peripheral.connected) {
        const newPeripheralInfo = await BleManager.retrieveServices(
          peripheralId
        );
        setPeripheralInfos((peripheralInfos) => [
          ...peripheralInfos,
          newPeripheralInfo,
        ]);
      }
    }
    return peripheralInfos;
  };

  const readCharacteristics = async () => {
    let services = await retrieveServices();

    for (let peripheralInfo of services) {
      peripheralInfo.characteristics?.forEach(async (c) => {
        try {
          const value = await BleManager.read(
            peripheralInfo.id,
            c.service,
            c.characteristic
          );
          console.log(
            "[readCharacteristics]",
            "peripheralId",
            peripheralInfo.id,
            "service",
            c.service,
            "char",
            c.characteristic,
            "\n\tvalue",
            value
          );
        } catch (error) {
          console.debug(
            "[readCharacteristics]",
            "Error reading characteristic",
            error
          );
        }
      });
    }
  };

  const readCharacteristic = async (
    peripheralId: string,
    service: string,
    characteristic: string
  ) => {
    try {
      const value = await BleManager.read(
        peripheralId,
        service,
        characteristic
      );
      return value;
      // console.log("[readCharacteristic]", "peripheralId", peripheralId, "service", service, "char", characteristic, "\n\tvalue", value);
    } catch (error) {
      console.debug(
        "[readCharacteristic]",
        "Error reading characteristic",
        error
      );
    }
  };

  const writeCharacteristic = async (
    peripheralId: string,
    service: string,
    characteristic: string,
    data: string
  ) => {
    const dataArray = data.split(" ").map((byte) => parseInt(byte));
    try {
      await BleManager.write(peripheralId, service, characteristic, dataArray);
      console.log(
        "[writeCharacteristic]",
        "peripheralId",
        peripheralId,
        "service",
        service,
        "char",
        characteristic,
        "data",
        dataArray
      );
    } catch (error) {
      console.debug(
        "[writeCharacteristic]",
        "Error writing characteristic",
        error
      );
    }
  };

  const [snackBarVisible, setSnackBarVisible] = React.useState(false);
  const [snackBarMessage, setSnackBarMessage] = React.useState("");

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
  };

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
      case "1800":
        return "Generic Access Service";
      case "1801":
        return "Generic Attribute Service";
      case "180a":
        return "Device Information Service";
      // LMP91000 specific
      case "ac566969-3134-47a1-bc17-4ece8690fc12":
        return "Chronoamperometry";
      // Unrecognized
      default:
        return "Service";
    }
  };

  const getCharacteristicDescriptionString = (uuid: string) => {
    switch (uuid) {
      case "2a00":
        return "Device Name";
      case "2a01":
        return "Appearance";
      case "2a04":
        return "Peripheral Preferred Connection Parameters";
      case "2a05":
        return "Service Changed";
      case "2a23":
        return "System ID";
      case "2a24":
        return "Model Number String";
      case "2a25":
        return "Serial Number String";
      case "2a26":
        return "Firmware Revision String";
      case "2a27":
        return "Hardware Revision String";
      case "2a28":
        return "Software Revision String";
      case "2a29":
        return "Manufacturer Name String";
      // Chronoamperometry
      case "b65c184f-232b-4a56-b75f-4fead5378693":
        return "Start";
      case "f4aa8625-89b2-4431-a2fa-a521f75a9725":
        return "Results";
      case "b1ff3efa-ca62-4131-93d7-15e8a0eb49f0":
        return "Read Index";
      // Unrecognized
      default:
        return "Characteristic";
    }
  };

  const [readDialogVisible, setReadDialogVisible] = React.useState(false);
  const [writeDialogVisible, setWriteDialogVisible] = React.useState(false);
  const [activeCharacteristic, setActiveCharacteristic] =
    React.useState<Characteristic>();
  const [activeValue, setActiveValue] = React.useState<string>("");
  const showReadDialog = async (characteristic: Characteristic) => {
    setActiveCharacteristic(characteristic);
    setActiveValue(
      await readCharacteristic(
        selectedPeripheralId,
        characteristic.service,
        characteristic.characteristic
      ).then((value) => (value ? value.toString() : ""))
    );
    setReadDialogVisible(true);
  };
  const showWriteDialog = (characteristic: Characteristic) => {
    setActiveCharacteristic(characteristic);
    setWriteDialogVisible(true);
  };

  const runChronoamperometry = () => {
    writeCharacteristic(
      selectedPeripheralId,
      "ac566969-3134-47a1-bc17-4ece8690fc12",
      "b65c184f-232b-4a56-b75f-4fead5378693",
      "1"
    );
  };

  const getChronoamperometryResults = () => {
    const results_array: number[] = [];
    for (let i = 0; i < 3; i++) {
      writeCharacteristic(
        selectedPeripheralId,
        "ac566969-3134-47a1-bc17-4ece8690fc12",
        "b1ff3efa-ca62-4131-93d7-15e8a0eb49f0",
        i.toString()
      );
      readCharacteristic(
        selectedPeripheralId,
        "ac566969-3134-47a1-bc17-4ece8690fc12",
        "f4aa8625-89b2-4431-a2fa-a521f75a9725"
      ).then((value) => {
        console.log("Results", value);
        // value will be a 200-byte array of 8-bit integers
        // where each pair of bytes represents a 16-bit integer
        // the first byte is the least significant byte
        // the second byte is the most significant byte
        if (!value) {
          console.warn("No results found");
          return;
        }
        for (let j = 0; j < value.length; j += 2) {
          let data_point = value[j] + (value[j + 1] << 8);
          results_array.push(data_point);
        }
        setResults(
          results_array.map((value, index) => ({ x: index, y: value }))
        );
      });
    }
  };

  // results will be a list of [{x: number, y: number}] objects
  const [results, setResults] = React.useState<{ x: number; y: number }[]>([
    { x: 0, y: 0 },
  ]);

  return (
    <Portal.Host>
      <ScrollView style={styles.body}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="LMP91000 Control" />
        </Appbar.Header>

        {/* <View style={styles.buttonGroup}>
          <Button mode='outlined' onPress={retrieveConnected} icon="refresh" disabled={true}>
            Refresh
          </Button>
        </View> */}

        {/* Select connected peripheral */}
        <View>
          {connectedPeripheralsList.length > 0 && (
            <Dropdown
              label="Select connected peripheral"
              options={connectedPeripheralsList}
              value={selectedPeripheralId}
              onChange={onSelectedPeripheralChange}
            />
          )}
        </View>

        <Divider />

        <View>
          <Text variant="titleMedium">Chronoamperometry</Text>
          <Chart
            style={{ height: 200, width: 400 }}
            data={results}
            padding={{ left: 40, bottom: 20, right: 20, top: 20 }}
            xDomain={{ min: 0, max: 300 }}
            yDomain={{ min: 0, max: 3300 }}
          >
            <VerticalAxis tickCount={11} />
            <HorizontalAxis tickCount={4} />
            <Line
              theme={{
                stroke: { color: "#000000", width: 0 },
                scatter: { default: { width: 4, height: 4, rx: 2 } },
              }}
            />
          </Chart>
        </View>

        <View style={styles.buttonGroup}>
          <Button mode="outlined" onPress={runChronoamperometry} icon="play">
            Run
          </Button>
          <Button
            mode="outlined"
            onPress={getChronoamperometryResults}
            icon="download"
          >
            Get results
          </Button>
          <Button
            mode="outlined"
            onPress={retrieveConnected}
            icon="content-save"
          >
            Save CSV
          </Button>
        </View>

        <Portal>
          <Snackbar
            visible={snackBarVisible}
            onDismiss={() => setSnackBarVisible(false)}
            action={{
              label: "Dismiss",
              onPress: () => {
                setSnackBarVisible(false);
              },
            }}
          >
            {snackBarMessage}
          </Snackbar>
        </Portal>
      </ScrollView>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    marginHorizontal: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
});

export default PeripheralDetails;
