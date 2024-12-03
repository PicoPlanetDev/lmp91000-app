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
  useTheme,
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
  HorizontalAxis,
  VerticalAxis,
} from "react-native-responsive-linechart";
import RNFS from "react-native-fs";
import { FileSystem } from "react-native-file-access";
import VoltageInput from "@/components/VoltageInput";
import CVSetup from "@/components/CVSetup";

const PeripheralDetails = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams();

  const theme = useTheme();

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
      console.log(
        "[readCharacteristic]",
        "peripheralId",
        peripheralId,
        "service",
        service,
        "char",
        characteristic,
        "data",
        value
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

  const SERVICE_LMP91000 = "ac566969-3134-47a1-bc17-4ece8690fc12";
  const CHARACTERISTIC_START = "b65c184f-232b-4a56-b75f-4fead5378693";
  const CHARACTERISTIC_RESULTS = "f4aa8625-89b2-4431-a2fa-a521f75a9725";
  const CHARACTERISTIC_READ_INDEX = "b1ff3efa-ca62-4131-93d7-15e8a0eb49f0";
  const CHARACTERISTIC_ACTIVE_LMP91000 = "6945ae32-4384-4d21-bd63-54eda76b1d62";
  const CHARACTERISTIC_VOLTAGES = "7e416a4d-ffcb-4006-90c4-b890630d4bd2";
  const CHARACTERISTIC_STATUS = "23c0714a-d460-4001-a9e0-a34d75088e31";
  const CHARACTERISTIC_TIA_GAIN = "5409175c-80fe-4892-8b17-caa75855c678";
  const CHARACTERISTIC_EXPERIMENT = "b48e58cd-4a7d-42d7-8d96-a7c917eee619";

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
      case SERVICE_LMP91000:
        return "LMP91000";
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
      case CHARACTERISTIC_START:
        return "Start";
      case CHARACTERISTIC_RESULTS:
        return "Results";
      case CHARACTERISTIC_READ_INDEX:
        return "Read Index";
      case CHARACTERISTIC_ACTIVE_LMP91000:
        return "Active LMP91000";
      case CHARACTERISTIC_VOLTAGES:
        return "Voltages";
      case CHARACTERISTIC_STATUS:
        return "Status";
      case CHARACTERISTIC_TIA_GAIN:
        return "TIA Gain";
      case CHARACTERISTIC_EXPERIMENT:
        return "Experiment";

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

  const [isChronoamperometryRunning, setIsChronoamperometryRunning] =
    React.useState(false);
  const runChronoamperometry = () => {
    writeCharacteristic(
      selectedPeripheralId,
      SERVICE_LMP91000,
      CHARACTERISTIC_START,
      "1"
    );
    // Status
    setIsChronoamperometryRunning(true);
    setSnackBarMessage("Chronoamperometry in progress...");
    setSnackBarVisible(true);

    // Clear busy status after a second
    setTimeout(() => {
      setIsChronoamperometryRunning(false);
      setSnackBarVisible(false);
    }, 1000);
  };

  const [isRecievingResults, setIsRecievingResults] = React.useState(false);
  const getChronoamperometryResults = async () => {
    // Visual status inddicator
    setIsRecievingResults(true);
    setSnackBarMessage("Recieving results...");
    setSnackBarVisible(true);

    const results_array: number[] = [];
    for (let i = 0; i < 3; i++) {
      await writeCharacteristic(
        selectedPeripheralId,
        SERVICE_LMP91000,
        CHARACTERISTIC_READ_INDEX,
        i.toString()
      );

      // we cannot read the results immediately, so we need to wait a bit
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const value = await readCharacteristic(
        selectedPeripheralId,
        SERVICE_LMP91000,
        CHARACTERISTIC_RESULTS
      );

      if (!value) {
        console.error("No results found");
        return;
      }

      // iterate over the value array and convert the pairs of little endian bytes to a number
      for (let j = 0; j < value.length; j += 2) {
        const data_point = value[j] + (value[j + 1] << 8);
        results_array.push(data_point);
      }
    }
    setResults(results_array.map((value, index) => ({ x: index, y: value })));
    console.log("Results", results_array);

    // Clear busy status
    setSnackBarVisible(false);
    setIsRecievingResults(false);
  };

  // results will be a list of [{x: number, y: number}] objects
  const [results, setResults] = React.useState<{ x: number; y: number }[]>([
    { x: 0, y: 0 },
  ]);

  const saveResultsToCSV = async () => {
    const headers = "Time (ms),Voltage (mV)\n";
    const rows = results.map((result) => `${result.x},${result.y}\n`).join("");
    const csv = `${headers}${rows}`;
    const filename = `lmp91000-results-${new Date()
      .toISOString()
      .replace(/:/g, "-")}.csv`;
    const temp_path = `${RNFS.TemporaryDirectoryPath}/${filename}`;

    try {
      await RNFS.writeFile(temp_path, csv, "utf8");
      FileSystem.cpExternal(temp_path, `${filename}`, "downloads");

      // Log and inform user
      console.log("Results saved to", "downloads/" + filename);
      setSnackBarMessage("Results saved to downloads/" + filename);
      setSnackBarVisible(true);
    } catch (error) {
      console.error("Error saving results to CSV", error);
      setSnackBarMessage("Error saving results to CSV");
      setSnackBarVisible(true);
    }
  };

  const [voltages, setVoltages] = React.useState({
    v0: "",
    v1: "",
    v2: "",
  });

  const readChronoamperometryConfiguration = async () => {};

  const saveChronoamperometryConfiguration = async () => {
    // Voltages
    const voltages_array = [
      parseInt(voltages.v0),
      parseInt(voltages.v1),
      parseInt(voltages.v2),
    ];
    // convert the voltages to a string (space separated) of 6 bytes, where each pair is a little endian 16-bit integer
    const voltages_string = voltages_array
      .map((voltage) => [voltage & 0xff, (voltage >> 8) & 0xff])
      .flat()
      .join(" ");
    console.log("Voltages", voltages_string);
    writeCharacteristic(
      selectedPeripheralId,
      SERVICE_LMP91000,
      CHARACTERISTIC_VOLTAGES,
      voltages_string
    );

    // TIA Gain
    writeCharacteristic(
      selectedPeripheralId,
      SERVICE_LMP91000,
      CHARACTERISTIC_TIA_GAIN,
      tiaGain
    );
  };

  // TIA gain
  const [tiaGain, setTiaGain] = React.useState("3");
  const onTiaGainChange = (value: string) => {
    setTiaGain(value);
    console.log("TIA Gain", value);
  };
  const tiaGainLabels = [
    "External (not recommended)",
    "2.75kΩ",
    "3.5kΩ",
    "7kΩ",
    "14kΩ",
    "35kΩ",
    "120kΩ",
    "350kΩ",
  ];
  const tiaGainValues = ["0", "1", "2", "3", "4", "5", "6", "7"];
  const tiaGainOptions = tiaGainLabels.map((label, index) => ({
    label,
    value: tiaGainValues[index],
  }));

  // Experiment mode
  const experimentModeLabels = [
    "Chronoamperometry", // trigger with constant voltage
    "Cyclic Voltammetry", // linearly sweep voltage up then back down
    "Square Wave Voltammetry", // linear sweep with square wave modulation steps
    "Normal Pulse Voltammetry", // repeated short pulses of constant voltage
    "Temperature",
  ];
  const experimentModeOptions = experimentModeLabels.map((label, index) => ({
    label,
    value: index.toString(),
  }));
  const [experimentMode, setExperimentMode] = React.useState("0");
  const onExperimentChange = (value: string) => {
    console.log("Experiment", value);
    setExperimentMode(value);
    writeCharacteristic(
      selectedPeripheralId,
      SERVICE_LMP91000,
      CHARACTERISTIC_EXPERIMENT,
      value
    );
  };

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
        {/* Experiment mode */}
        <View>
          <Dropdown
            label="Experiment mode"
            options={experimentModeOptions}
            value={experimentMode}
            onChange={onExperimentChange}
          />
        </View>
        <View>
          <Text variant="titleMedium">Results</Text>
          <Chart
            style={{ height: 200, width: 400 }}
            data={results}
            padding={{ left: 40, bottom: 20, right: 20, top: 20 }}
            xDomain={{ min: 0, max: 300 }}
            yDomain={{ min: 0, max: 3300 }}
          >
            <VerticalAxis
              tickCount={11}
              theme={{
                axis: {
                  visible: true,
                  stroke: { color: theme.colors.outline, width: 2 },
                },
                grid: {
                  visible: true,
                  stroke: { color: theme.colors.outline, width: 1 },
                },
                labels: {
                  label: {
                    color: theme.colors.primary,
                  },
                },
                ticks: {
                  stroke: {
                    color: theme.colors.outline,
                  },
                },
              }}
            />
            <HorizontalAxis
              tickCount={4}
              theme={{
                axis: {
                  visible: true,
                  stroke: { color: theme.colors.outline, width: 2 },
                },
                grid: {
                  visible: true,
                  stroke: { color: theme.colors.outline, width: 1 },
                },
                labels: {
                  label: {
                    color: theme.colors.primary,
                  },
                },
                ticks: {
                  stroke: {
                    color: theme.colors.outline,
                  },
                },
              }}
            />
            <Line
              theme={{
                stroke: { color: theme.colors.primary, width: 0 },
                scatter: {
                  default: {
                    width: 4,
                    height: 4,
                    rx: 2,
                    color: theme.colors.primary,
                  },
                },
              }}
            />
          </Chart>
        </View>
        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            onPress={runChronoamperometry}
            icon="play"
            loading={isChronoamperometryRunning}
            disabled={isChronoamperometryRunning}
          >
            Run
          </Button>
          <Button
            mode="outlined"
            onPress={getChronoamperometryResults}
            icon="download"
            loading={isRecievingResults}
            disabled={isRecievingResults}
          >
            Get results
          </Button>
          <Button
            mode="outlined"
            onPress={saveResultsToCSV}
            icon="content-save"
            disabled={results.length > 1 ? false : true}
          >
            Save CSV
          </Button>
        </View>
        <View>
          <Text variant="titleMedium">Configuration</Text>
        </View>
        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            onPress={saveChronoamperometryConfiguration}
            icon="check"
          >
            Apply
          </Button>
        </View>

        {/* Eventually the TIA gain needs to be abstracted */}
        <View>
          <Dropdown
            label="TIA Gain"
            options={tiaGainOptions}
            value={tiaGain}
            onChange={onTiaGainChange}
          />
        </View>

        {
          // show voltage input in CA mode only
          experimentMode === "0" && (
            <VoltageInput onChanged={setVoltages}></VoltageInput>
          )
        }

        {
          // show CV setup in CV mode only
          experimentMode === "1" && (
            <CVSetup onChanged={(value) => console.log(value)}></CVSetup>
          )
        }

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
