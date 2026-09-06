import ncrData from "./psgc-ncr.json" with { type: "json" };

// Sourced from the PSA's official PSGC (2025 2nd quarter release) — NCR's 17
// LGUs (16 cities + Pateros), with Manila's 14 PSGC districts merged into one
// "Manila" entry so the dropdown matches how customers actually think about
// their city (see the build script notes for jobuntux/psgc, the source
// repo). NCR only, per the address form's own validation rules — no other
// region has data here. Names have the PSA's own "City of " prefix stripped
// (e.g. "City of Manila" -> "Manila") by request — customers just want to
// pick their city, not read its full legal designation; "Pasay City" and
// "Quezon City" keep "City" since it's part of the name there, not a prefix.

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
