# Signal Strength Interpretation Guide

This document provides guidance on interpreting WiFi and Bluetooth signal strength values in the SeaAir Mobile App API.

## Overview

Signal strength is measured in **dBm (decibels relative to one milliwatt)**, which is a logarithmic scale representing the power level of the radio signal. Values are always negative, with numbers closer to zero indicating stronger signals.

## Bluetooth Signal Strength (BLE RSSI)

The `bleRssi` field in `DeviceInfoResponse` represents the Bluetooth Low Energy (BLE) signal strength.

### Interpretation

| RSSI Range (dBm) | Quality | Description |
|------------------|---------|-------------|
| **≥ -60 dBm** | **Good** | Excellent signal strength, very close proximity to device |
| **-80 to -60 dBm** | **Fair** | Acceptable signal strength, normal operating distance |
| **< -80 dBm** | **Poor** | Weak signal, may experience connection issues |

### Typical Bluetooth Ranges
- **Excellent** (-30 to -50 dBm): Device is very close (< 1 meter)
- **Good** (-50 to -60 dBm): Device is nearby (1-5 meters)
- **Fair** (-60 to -80 dBm): Device is at medium distance (5-15 meters)
- **Poor** (-80 to -100 dBm): Device is far or obstructed (> 15 meters)

### Implementation Notes
- Bluetooth signals are highly affected by obstacles (walls, furniture, etc.)
- Human bodies can significantly attenuate BLE signals
- Values below -100 dBm typically indicate a disconnection or out-of-range condition

## WiFi Signal Strength (WiFi RSSI)

The `rssi` field in the `WiFi` message represents the WiFi signal strength.

### Interpretation

| RSSI Range (dBm) | Quality | Description |
|------------------|---------|-------------|
| **≥ -50 dBm** | **Good** | Excellent signal strength, ideal for all applications |
| **-70 to -50 dBm** | **Fair** | Good signal strength, suitable for most applications |
| **< -70 dBm** | **Poor** | Weak signal, may experience slow speeds or dropouts |

### Typical WiFi Ranges
- **Excellent** (-30 to -40 dBm): Very close to router, maximum speed
- **Good** (-40 to -50 dBm): Strong signal, excellent for streaming/gaming
- **Fair** (-50 to -70 dBm): Acceptable signal, suitable for browsing and email
- **Poor** (-70 to -90 dBm): Weak signal, may have connectivity issues
- **Very Poor** (< -90 dBm): Unreliable, likely to disconnect

### Implementation Notes
- WiFi signals penetrate obstacles better than Bluetooth but are still affected
- 2.4 GHz WiFi typically has better range but lower speeds than 5 GHz
- Interference from other devices can affect signal quality even with good RSSI

## Display Recommendations

### Mobile App UI
When displaying signal strength in the mobile app, use the following approach:

1. **Icon/Bar Display**: Use 1-3 bars or a colored icon
   - Good: 3 bars or green icon
   - Fair: 2 bars or yellow/orange icon  
   - Poor: 1 bar or red icon

2. **Text Display**: Show both the quality label and the numeric value
   - Example: "Good (-55 dBm)"
   - Example: "Fair (-68 dBm)"
   - Example: "Poor (-85 dBm)"

3. **Color Coding**:
   - Green (#4CAF50) for Good
   - Orange (#FF9800) for Fair
   - Red (#F44336) for Poor

### Implementation Example

```typescript
function getSignalQuality(rssi: number, type: 'bluetooth' | 'wifi'): 'good' | 'fair' | 'poor' {
  if (type === 'bluetooth') {
    if (rssi >= -60) return 'good';
    if (rssi >= -80) return 'fair';
    return 'poor';
  } else { // wifi
    if (rssi >= -50) return 'good';
    if (rssi >= -70) return 'fair';
    return 'poor';
  }
}

function getSignalColor(quality: 'good' | 'fair' | 'poor'): string {
  switch (quality) {
    case 'good': return '#4CAF50';
    case 'fair': return '#FF9800';
    case 'poor': return '#F44336';
  }
}
```

## Protobuf Field Locations

### Bluetooth Signal Strength
- **Message**: `DeviceInfoResponse` (ble.proto)
- **Field**: `bleRssi` (field number 4)
- **Type**: `int32`
- **Unit**: dBm
- **Location in UI**: Device Info card, under Controller ID

### WiFi Signal Strength  
- **Message**: `WiFi` (bossmarine.proto)
- **Field**: `rssi` (field number 3)
- **Type**: `int32`
- **Unit**: dBm
- **Location in UI**: WiFi card, after Status field

## References

- [Understanding WiFi Signal Strength](https://www.metageek.com/training/resources/understanding-rssi/)
- [Bluetooth RSSI and Distance Estimation](https://www.bluetooth.com/blog/determining-distance-with-rssi/)
- IEEE 802.11 and Bluetooth Core Specification for technical details
