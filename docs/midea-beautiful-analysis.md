# midea-beautiful-air protocol notes (for Node.js porting)

This document captures the minimum integration model used by the Python library and mirrored by this adapter backend abstraction.

## Discovery

- `find_appliances(...)` scans the LAN by default through broadcast (`255.255.255.255`) and can also target explicit addresses.
- Discovery returns appliance handles with a typed runtime `state` object that includes identifiers, model information, address, and (when available) token/key material for local status/control.
- If account/password are passed and no cloud instance is provided, `find_appliances` auto-initializes cloud authentication before scanning.

## Authentication (token/key)

- `connect_to_cloud(...)` builds a cloud client with app-specific credentials (appkey/appid/sign key and optional iot/hmac keys for proxied variants such as MSmartHome).
- Successful cloud login enables retrieval of devices and cloud-backed state/control.
- For LAN control, each device needs `token` and `key`; local status uses address + token + key + appliance id.

## Command transport / encryption model

- The library exposes two control paths:
  1. **Cloud path** (`use_cloud=True`) for state polling and settings through Midea cloud APIs.
  2. **LAN path** (`address + token + key`) for direct local commands/status where token/key authentication is required.
- Adapter-side API surface is normalized to:
  - `connect()` for cloud login
  - `get_status()` for either LAN or cloud polling
  - `set_state()` for mutable attributes

## Minimal methods mapped to adapter backend

- `connect(config)` -> cloud login with selected app credential profile.
- `discover()` -> enumerate appliances and cache appliance handles by appliance id.
- `getStatus({ applianceId, address, token, key, useLocal })` -> choose LAN vs cloud transport.
- `setState(applianceId, patch)` -> apply a property patch (e.g., `running`, `target_humidity`, etc.).
