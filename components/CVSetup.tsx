import * as React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import Dropdown from "@/components/Dropdown";

interface CVSetupProps {
  onChanged: (values: {
    initial: string;
    limit1: string;
    limit2: string;
    final: string;
    step_size: string;
    scan_rate: string;
    initial_delay: string;
    equilibrium_time: string;
    cycles: string;
    current_range: string; // unused for now
  }) => void;
}

const CVSetup: React.FC<CVSetupProps> = ({ onChanged }) => {
  const [initial, setInitial] = React.useState("0");
  const [limit1, setLimit1] = React.useState("0");
  const [limit2, setLimit2] = React.useState("0");
  const [final, setFinal] = React.useState("0");
  const [step_size, setStepSize] = React.useState("0");
  const [scan_rate, setScanRate] = React.useState("0");
  const [initial_delay, setInitialDelay] = React.useState("0");
  const [equilibrium_time, setequilibriumTime] = React.useState("0");
  const [cycles, setCycles] = React.useState("0");
  const [current_range, setCurrentRange] = React.useState("0");

  React.useEffect(() => {
    onChanged({
      initial,
      limit1,
      limit2,
      final,
      step_size,
      scan_rate,
      initial_delay,
      equilibrium_time: equilibrium_time,
      cycles,
      current_range,
    });
  }, [
    initial,
    limit1,
    limit2,
    final,
    step_size,
    scan_rate,
    initial_delay,
    equilibrium_time,
    cycles,
    current_range,
    onChanged,
  ]);

  const isInputValidVoltage = (input: string) => {
    return (
      input !== "" &&
      !isNaN(Number(input)) &&
      Number(input) >= -3300 &&
      Number(input) <= 3300 &&
      Number(input) % 1 === 0
    );
  };

  const isInputValidPosInt = (input: string) => {
    return (
      input !== "" &&
      !isNaN(Number(input)) &&
      Number(input) >= 0 &&
      //Number(input) <= 100000 &&
      Number(input) % 1 === 0
    );
  };

  const styles = StyleSheet.create({
    textInputGroup: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    textInput: {
      width: "49%",
    },
  });

  return (
    <View>
      <View style={styles.textInputGroup}>
        <TextInput
          style={styles.textInput} // 49% wide
          mode="outlined"
          label="Initial"
          value={initial}
          onChangeText={(initial) => setInitial(initial)}
          error={!isInputValidVoltage(initial)}
          right={<TextInput.Affix text="mV" />} // right floating label for units
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Final"
          value={final}
          onChangeText={(final) => setFinal(final)}
          error={!isInputValidVoltage(final)}
          right={<TextInput.Affix text="mV" />}
        />
      </View>
      <View style={styles.textInputGroup}>
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Limit 1"
          value={limit1}
          onChangeText={(limit1) => setLimit1(limit1)}
          error={!isInputValidVoltage(limit1)}
          right={<TextInput.Affix text="mV" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Limit 2"
          value={limit2}
          onChangeText={(limit2) => setLimit2(limit2)}
          error={!isInputValidVoltage(limit2)}
          right={<TextInput.Affix text="mV" />}
        />
      </View>
      <View style={styles.textInputGroup}>
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Step Size"
          value={step_size}
          onChangeText={(step_size) => setStepSize(step_size)}
          error={!isInputValidVoltage(step_size)}
          right={<TextInput.Affix text="mV" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Scan Rate"
          value={scan_rate}
          onChangeText={(scan_rate) => setScanRate(scan_rate)}
          error={!isInputValidVoltage(scan_rate)}
          right={<TextInput.Affix text="mV/s" />}
        />
      </View>
      <View style={styles.textInputGroup}>
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Initial Delay"
          value={initial_delay}
          onChangeText={(initial_delay) => setInitialDelay(initial_delay)}
          error={!isInputValidPosInt(initial_delay)}
          right={<TextInput.Affix text="ms" />}
        />
        <TextInput
          style={styles.textInput}
          mode="outlined"
          label="Equilibrium Time"
          value={equilibrium_time}
          onChangeText={(equilibrium_time) =>
            setequilibriumTime(equilibrium_time)
          }
          error={!isInputValidPosInt(equilibrium_time)}
          right={<TextInput.Affix text="ms" />}
        />
      </View>
      <TextInput
        mode="outlined"
        label="Cycles"
        value={cycles}
        onChangeText={(cycles) => setCycles(cycles)}
        error={!isInputValidPosInt(cycles)}
      />
    </View>
  );
};

export default CVSetup;
