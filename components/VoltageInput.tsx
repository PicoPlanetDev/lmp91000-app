import * as React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";

interface VoltageInputProps {
  onChanged: (values: { v0: string; v1: string; v2: string }) => void;
}

const VoltageInput: React.FC<VoltageInputProps> = ({ onChanged }) => {
  const [v0, setv0] = React.useState("200");
  const [v1, setv1] = React.useState("-200");
  const [v2, setv2] = React.useState("200");

  React.useEffect(() => {
    onChanged({ v0, v1, v2 });
  }, [v0, v1, v2, onChanged]);

  const isInputValid = (input: string) => {
    return (
      input !== "" &&
      !isNaN(Number(input)) &&
      Number(input) >= -3300 &&
      Number(input) <= 3300 &&
      Number(input) % 1 === 0
    );
  };

  const styles = StyleSheet.create({
    textInputGroup: {
      display: "flex",
      flexDirection: "row",
      //   gap: 8,
      //   flexWrap: "wrap",
      justifyContent: "space-between",
      marginTop: 8,
    },
    textInput: {
      width: "32%",
    },
  });

  return (
    <View style={styles.textInputGroup}>
      <TextInput
        style={styles.textInput}
        mode="outlined"
        label="v0"
        value={v0}
        onChangeText={(v0) => setv0(v0)}
        error={!isInputValid(v0)}
        right={<TextInput.Affix text="mV" />}
      />
      <TextInput
        style={styles.textInput}
        mode="outlined"
        label="v1"
        value={v1}
        onChangeText={(v1) => setv1(v1)}
        error={!isInputValid(v1)}
        right={<TextInput.Affix text="mV" />}
      />
      <TextInput
        style={styles.textInput}
        mode="outlined"
        label="v2"
        value={v2}
        onChangeText={(v2) => setv2(v2)}
        error={!isInputValid(v2)}
        right={<TextInput.Affix text="mV" />}
      />
    </View>
  );
};

export default VoltageInput;
