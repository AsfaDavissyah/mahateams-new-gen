const SEQUENTIAL_PINS = new Set([
  "012345",
  "123456",
  "234567",
  "345678",
  "456789",
  "987654",
  "876543",
  "765432",
  "654321",
  "543210",
]);

export function getSecurityPinError(pin: string) {
  if (!/^\d{6}$/.test(pin)) {
    return "PIN must contain exactly 6 digits.";
  }

  if (/^(\d)\1{5}$/.test(pin)) {
    return "PIN cannot use the same digit six times.";
  }

  if (SEQUENTIAL_PINS.has(pin)) {
    return "PIN cannot use a simple ascending or descending sequence.";
  }

  return null;
}
