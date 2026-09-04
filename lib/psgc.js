import ncrData from "./psgc-ncr.json" with { type: "json" };

// Sourced from the PSA's official PSGC (2025 2nd quarter release) — NCR's 17
// LGUs (16 cities + Pateros), with Manila's 14 PSGC districts merged into one
// "City of Manila" entry so the dropdown matches how customers actually think
// about their city (see the build script notes for jobuntux/psgc, the source
// repo). NCR only, per the address form's own validation rules — no other
// region has data here.

export function getNcrCities() {
  return ncrData.map((c) => c.name);
}

export function getBarangaysForCity(cityName) {
  const city = ncrData.find((c) => c.name === cityName);
  return city ? city.barangays : [];
}

export function isValidCity(cityName) {
  return ncrData.some((c) => c.name === cityName);
}

export function isValidBarangay(cityName, barangayName) {
  return getBarangaysForCity(cityName).includes(barangayName);
}
