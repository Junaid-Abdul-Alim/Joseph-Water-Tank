const NEW_ARDUINO_PAYLOAD_LENGTH = 14;
const LEGACY_ARDUINO_PAYLOAD_LENGTH = 8;
const ARDUINO_PAYLOAD_LENGTH = NEW_ARDUINO_PAYLOAD_LENGTH;

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asOptionalNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function readUint16(bytes, index) {
  return ((bytes[index] << 8) | bytes[index + 1]) >>> 0;
}

function withDerivedFields(data) {
  const mainTds = asNumber(data.main_tds);
  const roTds = asNumber(data.ro_tds);
  const rejectTds = asOptionalNumber(data.reject_tds);

  return {
    node_id: data.node_id == null ? null : asOptionalNumber(data.node_id),
    main_tds: mainTds,
    main_ec: data.main_ec == null ? mainTds * 2 : asNumber(data.main_ec),
    ro_tds: roTds,
    ro_ec: data.ro_ec == null ? roTds * 2 : asNumber(data.ro_ec),
    reject_tds: rejectTds,
    reject_ec: data.reject_ec == null
      ? (rejectTds == null ? null : rejectTds * 2)
      : asOptionalNumber(data.reject_ec),
    ph: asNumber(data.ph),
    turbidity: asOptionalNumber(data.turbidity),
    temperature: asOptionalNumber(data.temperature),
    water_level_cm: asOptionalNumber(data.water_level_cm),
    flow_rate: asOptionalNumber(data.flow_rate)
  };
}

function normalizeSensorData(decodedPayload) {
  if (!decodedPayload || typeof decodedPayload !== 'object') {
    return null;
  }

  const hasSensorFields = [
    'main_tds',
    'ro_tds',
    'reject_tds',
    'ph',
    'turbidity',
    'temperature',
    'water_level_cm',
    'flow_rate'
  ].some((field) => decodedPayload[field] != null);

  if (!hasSensorFields) {
    return null;
  }

  return withDerivedFields({
    node_id: decodedPayload.node_id ?? decodedPayload.node ?? null,
    main_tds: decodedPayload.main_tds,
    main_ec: decodedPayload.main_ec,
    ro_tds: decodedPayload.ro_tds,
    ro_ec: decodedPayload.ro_ec,
    reject_tds: decodedPayload.reject_tds,
    reject_ec: decodedPayload.reject_ec,
    ph: decodedPayload.ph ?? decodedPayload.pH ?? decodedPayload.PH,
    turbidity: decodedPayload.turbidity ?? decodedPayload.turbidity_ntu ?? decodedPayload.ntu,
    temperature: decodedPayload.temperature,
    water_level_cm: decodedPayload.water_level_cm,
    flow_rate: decodedPayload.flow_rate
  });
}

function decodeNewArduinoPayloadBytes(bytes) {
  if (!bytes || bytes.length < NEW_ARDUINO_PAYLOAD_LENGTH) {
    return null;
  }

  return withDerivedFields({
    node_id: bytes[0],
    main_tds: readUint16(bytes, 1),
    ro_tds: readUint16(bytes, 3),
    ph: readUint16(bytes, 5) / 100,
    turbidity: readUint16(bytes, 7),
    temperature: bytes[9],
    water_level_cm: readUint16(bytes, 10),
    flow_rate: readUint16(bytes, 12)
  });
}

function decodeLegacyArduinoPayloadBytes(bytes) {
  if (!bytes || bytes.length < LEGACY_ARDUINO_PAYLOAD_LENGTH) {
    return null;
  }

  return withDerivedFields({
    node_id: bytes[0],
    main_tds: readUint16(bytes, 1),
    ro_tds: readUint16(bytes, 3),
    reject_tds: readUint16(bytes, 5),
    ph: bytes[7] / 10
  });
}

function decodeArduinoPayloadBytes(bytes) {
  if (!bytes) {
    return null;
  }

  if (bytes.length >= NEW_ARDUINO_PAYLOAD_LENGTH) {
    return decodeNewArduinoPayloadBytes(bytes);
  }

  return decodeLegacyArduinoPayloadBytes(bytes);
}

function decodeFrmPayload(frmPayload) {
  if (!frmPayload || typeof frmPayload !== 'string') {
    return null;
  }

  try {
    const bytes = Buffer.from(frmPayload, 'base64');
    return decodeArduinoPayloadBytes(bytes);
  } catch {
    return null;
  }
}

function extractSensorData(ttnPayload) {
  const uplink = ttnPayload?.uplink_message;
  const rawDecoded = decodeFrmPayload(uplink?.frm_payload);

  if (rawDecoded) {
    return {
      source: 'frm_payload',
      data: rawDecoded
    };
  }

  const decoded = normalizeSensorData(uplink?.decoded_payload);

  if (decoded) {
    return {
      source: 'decoded_payload',
      data: decoded
    };
  }

  return null;
}

export {
  ARDUINO_PAYLOAD_LENGTH,
  LEGACY_ARDUINO_PAYLOAD_LENGTH,
  NEW_ARDUINO_PAYLOAD_LENGTH,
  decodeArduinoPayloadBytes,
  decodeFrmPayload,
  decodeLegacyArduinoPayloadBytes,
  decodeNewArduinoPayloadBytes,
  extractSensorData,
  normalizeSensorData
};
