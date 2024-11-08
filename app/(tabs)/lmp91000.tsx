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
            data={[
              { x: 1, y: 2288 },
              { x: 2, y: 2224 },
              { x: 3, y: 2169 },
              { x: 4, y: 2123 },
              { x: 5, y: 2081 },
              { x: 6, y: 2046 },
              { x: 7, y: 2013 },
              { x: 8, y: 1983 },
              { x: 9, y: 1956 },
              { x: 10, y: 1932 },
              { x: 11, y: 1909 },
              { x: 12, y: 1888 },
              { x: 13, y: 1869 },
              { x: 14, y: 1852 },
              { x: 15, y: 1835 },
              { x: 16, y: 1820 },
              { x: 17, y: 1805 },
              { x: 18, y: 1793 },
              { x: 19, y: 1780 },
              { x: 20, y: 1768 },
              { x: 21, y: 1757 },
              { x: 22, y: 1747 },
              { x: 23, y: 1737 },
              { x: 24, y: 1727 },
              { x: 25, y: 1718 },
              { x: 26, y: 1710 },
              { x: 27, y: 1702 },
              { x: 28, y: 1695 },
              { x: 29, y: 1688 },
              { x: 30, y: 1681 },
              { x: 31, y: 1674 },
              { x: 32, y: 1668 },
              { x: 33, y: 1663 },
              { x: 34, y: 1656 },
              { x: 35, y: 1652 },
              { x: 36, y: 1647 },
              { x: 37, y: 1642 },
              { x: 38, y: 1637 },
              { x: 39, y: 1632 },
              { x: 40, y: 1627 },
              { x: 41, y: 1624 },
              { x: 42, y: 1620 },
              { x: 43, y: 1617 },
              { x: 44, y: 1612 },
              { x: 45, y: 1609 },
              { x: 46, y: 1606 },
              { x: 47, y: 1602 },
              { x: 48, y: 1599 },
              { x: 49, y: 1596 },
              { x: 50, y: 1593 },
              { x: 51, y: 1590 },
              { x: 52, y: 1587 },
              { x: 53, y: 1585 },
              { x: 54, y: 1582 },
              { x: 55, y: 1580 },
              { x: 56, y: 1577 },
              { x: 57, y: 1575 },
              { x: 58, y: 1573 },
              { x: 59, y: 1571 },
              { x: 60, y: 1569 },
              { x: 61, y: 1566 },
              { x: 62, y: 1564 },
              { x: 63, y: 1563 },
              { x: 64, y: 1560 },
              { x: 65, y: 1559 },
              { x: 66, y: 1557 },
              { x: 67, y: 1556 },
              { x: 68, y: 1554 },
              { x: 69, y: 1552 },
              { x: 70, y: 1551 },
              { x: 71, y: 1549 },
              { x: 72, y: 1548 },
              { x: 73, y: 1546 },
              { x: 74, y: 1544 },
              { x: 75, y: 1544 },
              { x: 76, y: 1542 },
              { x: 77, y: 1541 },
              { x: 78, y: 1540 },
              { x: 79, y: 1539 },
              { x: 80, y: 1538 },
              { x: 81, y: 1536 },
              { x: 82, y: 1535 },
              { x: 83, y: 1534 },
              { x: 84, y: 1533 },
              { x: 85, y: 1532 },
              { x: 86, y: 1531 },
              { x: 87, y: 1530 },
              { x: 88, y: 1528 },
              { x: 89, y: 1527 },
              { x: 90, y: 1527 },
              { x: 91, y: 1526 },
              { x: 92, y: 1525 },
              { x: 93, y: 1524 },
              { x: 94, y: 1523 },
              { x: 95, y: 1522 },
              { x: 96, y: 1522 },
              { x: 97, y: 1521 },
              { x: 98, y: 1520 },
              { x: 99, y: 1519 },
              { x: 100, y: 1518 },
              { x: 101, y: 0 },
              { x: 102, y: 24 },
              { x: 103, y: 23 },
              { x: 104, y: 0 },
              { x: 105, y: 23 },
              { x: 106, y: 0 },
              { x: 107, y: 23 },
              { x: 108, y: 0 },
              { x: 109, y: 24 },
              { x: 110, y: 0 },
              { x: 111, y: 23 },
              { x: 112, y: 0 },
              { x: 113, y: 23 },
              { x: 114, y: 0 },
              { x: 115, y: 23 },
              { x: 116, y: 0 },
              { x: 117, y: 23 },
              { x: 118, y: 0 },
              { x: 119, y: 24 },
              { x: 120, y: 0 },
              { x: 121, y: 23 },
              { x: 122, y: 23 },
              { x: 123, y: 22 },
              { x: 124, y: 23 },
              { x: 125, y: 23 },
              { x: 126, y: 23 },
              { x: 127, y: 23 },
              { x: 128, y: 116 },
              { x: 129, y: 187 },
              { x: 130, y: 241 },
              { x: 131, y: 290 },
              { x: 132, y: 335 },
              { x: 133, y: 376 },
              { x: 134, y: 413 },
              { x: 135, y: 448 },
              { x: 136, y: 481 },
              { x: 137, y: 512 },
              { x: 138, y: 540 },
              { x: 139, y: 567 },
              { x: 140, y: 591 },
              { x: 141, y: 615 },
              { x: 142, y: 636 },
              { x: 143, y: 657 },
              { x: 144, y: 676 },
              { x: 145, y: 696 },
              { x: 146, y: 713 },
              { x: 147, y: 730 },
              { x: 148, y: 745 },
              { x: 149, y: 760 },
              { x: 150, y: 776 },
              { x: 151, y: 789 },
              { x: 152, y: 802 },
              { x: 153, y: 816 },
              { x: 154, y: 826 },
              { x: 155, y: 839 },
              { x: 156, y: 848 },
              { x: 157, y: 859 },
              { x: 158, y: 869 },
              { x: 159, y: 878 },
              { x: 160, y: 888 },
              { x: 161, y: 896 },
              { x: 162, y: 905 },
              { x: 163, y: 913 },
              { x: 164, y: 921 },
              { x: 165, y: 928 },
              { x: 166, y: 935 },
              { x: 167, y: 942 },
              { x: 168, y: 950 },
              { x: 169, y: 956 },
              { x: 170, y: 963 },
              { x: 171, y: 968 },
              { x: 172, y: 975 },
              { x: 173, y: 979 },
              { x: 174, y: 985 },
              { x: 175, y: 990 },
              { x: 176, y: 996 },
              { x: 177, y: 1000 },
              { x: 178, y: 1005 },
              { x: 179, y: 1010 },
              { x: 180, y: 1015 },
              { x: 181, y: 1018 },
              { x: 182, y: 1023 },
              { x: 183, y: 1028 },
              { x: 184, y: 1031 },
              { x: 185, y: 1035 },
              { x: 186, y: 1039 },
              { x: 187, y: 1042 },
              { x: 188, y: 1046 },
              { x: 189, y: 1050 },
              { x: 190, y: 1053 },
              { x: 191, y: 1057 },
              { x: 192, y: 1060 },
              { x: 193, y: 1063 },
              { x: 194, y: 1066 },
              { x: 195, y: 1070 },
              { x: 196, y: 1071 },
              { x: 197, y: 1074 },
              { x: 198, y: 1077 },
              { x: 199, y: 1080 },
              { x: 200, y: 1083 },
              { x: 201, y: 0 },
              { x: 202, y: 2738 },
              { x: 203, y: 2737 },
              { x: 204, y: 0 },
              { x: 205, y: 2735 },
              { x: 206, y: 0 },
              { x: 207, y: 2735 },
              { x: 208, y: 0 },
              { x: 209, y: 2733 },
              { x: 210, y: 0 },
              { x: 211, y: 2732 },
              { x: 212, y: 0 },
              { x: 213, y: 2729 },
              { x: 214, y: 0 },
              { x: 215, y: 2727 },
              { x: 216, y: 0 },
              { x: 217, y: 2725 },
              { x: 218, y: 0 },
              { x: 219, y: 2724 },
              { x: 220, y: 0 },
              { x: 221, y: 2722 },
              { x: 222, y: 2719 },
              { x: 223, y: 2689 },
              { x: 224, y: 2615 },
              { x: 225, y: 2536 },
              { x: 226, y: 2465 },
              { x: 227, y: 2404 },
              { x: 228, y: 2345 },
              { x: 229, y: 2291 },
              { x: 230, y: 2241 },
              { x: 231, y: 2196 },
              { x: 232, y: 2154 },
              { x: 233, y: 2112 },
              { x: 234, y: 2075 },
              { x: 235, y: 2041 },
              { x: 236, y: 2009 },
              { x: 237, y: 1976 },
              { x: 238, y: 1947 },
              { x: 239, y: 1921 },
              { x: 240, y: 1896 },
              { x: 241, y: 1870 },
              { x: 242, y: 1847 },
              { x: 243, y: 1826 },
              { x: 244, y: 1806 },
              { x: 245, y: 1786 },
              { x: 246, y: 1768 },
              { x: 247, y: 1751 },
              { x: 248, y: 1735 },
              { x: 249, y: 1719 },
              { x: 250, y: 1703 },
              { x: 251, y: 1689 },
              { x: 252, y: 1675 },
              { x: 253, y: 1662 },
              { x: 254, y: 1650 },
              { x: 255, y: 1638 },
              { x: 256, y: 1626 },
              { x: 257, y: 1616 },
              { x: 258, y: 1606 },
              { x: 259, y: 1596 },
              { x: 260, y: 1587 },
              { x: 261, y: 1577 },
              { x: 262, y: 1569 },
              { x: 263, y: 1560 },
              { x: 264, y: 1552 },
              { x: 265, y: 1544 },
              { x: 266, y: 1537 },
              { x: 267, y: 1530 },
              { x: 268, y: 1523 },
              { x: 269, y: 1517 },
              { x: 270, y: 1510 },
              { x: 271, y: 1504 },
              { x: 272, y: 1498 },
              { x: 273, y: 1493 },
              { x: 274, y: 1488 },
              { x: 275, y: 1481 },
              { x: 276, y: 1477 },
              { x: 277, y: 1472 },
              { x: 278, y: 1467 },
              { x: 279, y: 1462 },
              { x: 280, y: 1458 },
              { x: 281, y: 1454 },
              { x: 282, y: 1449 },
              { x: 283, y: 1445 },
              { x: 284, y: 1442 },
              { x: 285, y: 1439 },
              { x: 286, y: 1435 },
              { x: 287, y: 1431 },
              { x: 288, y: 1427 },
              { x: 289, y: 1424 },
              { x: 290, y: 1421 },
              { x: 291, y: 1419 },
              { x: 292, y: 1415 },
              { x: 293, y: 1412 },
              { x: 294, y: 1409 },
              { x: 295, y: 1407 },
              { x: 296, y: 1404 },
              { x: 297, y: 1401 },
              { x: 298, y: 1398 },
              { x: 299, y: 1396 },
            ]}
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
