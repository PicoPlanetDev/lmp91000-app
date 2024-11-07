import React from "react";
import { Pressable, View } from "react-native";
import { TextInput, Menu, Button } from "react-native-paper";

interface DropdownProps {
    label: string;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({ label, options, value, onChange }) => {
    const [visible, setVisible] = React.useState(false);

    const [selectedLabel, setSelectedLabel] = React.useState(value);

    React.useEffect(() => {
        const selectedOption = options.find(option => option.value === value);
        if (selectedOption) {
            setSelectedLabel(selectedOption.label);
        }
    }, [value, options]);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);
    const handleSelect = (optionLabel: string, optionValue: string) => {
        onChange(optionValue);
        setSelectedLabel(optionLabel);
        closeMenu();
    };

    return (
        <View>

            <Menu
                visible={visible}
                onDismiss={closeMenu}
                anchor={
                    <Pressable onPress={openMenu}>
                        <TextInput
                            mode="outlined"
                            editable={false}
                            label={label}
                            value={selectedLabel}
                            right={
                                <TextInput.Icon
                                    icon="menu-down"
                                    onPress={openMenu}
                                    forceTextInputFocus={false}
                                />}
                        />
                    </Pressable>
                }
                anchorPosition="bottom"
            >
                {options.map((option) => (
                    <Menu.Item
                        key={option.value}
                        onPress={() => handleSelect(option.label, option.value)}
                        title={option.label}
                    />
                ))}
            </Menu>
        </View>
    );
};

export default Dropdown;