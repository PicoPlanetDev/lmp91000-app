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

## Build

For a development build,

```bash
bun run android
```

For a final/release build, use

```bash
bunx react-native build-android --mode=release
```

to create an AAB file in the `android/app/build/outputs/bundle/release` directory.
Then use

```bash
cd android
.\gradlew assembleRelease
```

to generate a release APK file located in the `android\app\build\outputs\apk\release` directory.