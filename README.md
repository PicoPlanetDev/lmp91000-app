# lmp91000-app

A BLE control app for the EFR32MG12 LMP91000 electrochemical sensor.
Customized from <https://github.com/PicoPlanetDev/blinky-app>, right now implementing additional UUID service and characteristic recognition.

## Usage

### Tabs

- Connect
  - Search for and connect to the LMP91000 BLE peripheral
- Details
  - Read and write arbitrary characteristics exposed by the peripheral
- LMP91000
  - Customized UI for LMP91000 functions such as chronoamperometry
- Settings
  - Allow app permissions
  - Enable Bluetooth