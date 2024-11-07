import { Peripheral } from "react-native-ble-manager";
import React, { createContext, useState } from "react";

interface PeripheralsContextProps {
    peripherals: Map<Peripheral['id'], Peripheral>;
    setPeripherals: React.Dispatch<React.SetStateAction<Map<Peripheral['id'], Peripheral>>>;
}

export const PeripheralsContext = createContext<PeripheralsContextProps>({
    peripherals: new Map<Peripheral['id'], Peripheral>(),
    setPeripherals: () => { },
});

const PeripheralsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [peripherals, setPeripherals] = useState(new Map<Peripheral['id'], Peripheral>());

    return (
        <PeripheralsContext.Provider value={{ peripherals, setPeripherals }}>
            {children}
        </PeripheralsContext.Provider>
    );
};

export default PeripheralsProvider;