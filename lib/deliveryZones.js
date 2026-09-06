// Distance-based delivery pricing — but "distance" here means a hand-assigned
// city tier, not a measured route. A customer only ever picks their city from
// the fixed NCR list in lib/psgc.js (never a free-typed address or a map
// pin), and both of this restaurant's branches sit within a few blocks of
// each other in Lower Bicutan, Taguig — close enough that one shared table
// works for either branch. Tiers are assigned by real-world proximity to
// Taguig, not a geocoding/mapping API (no API key, no per-lookup cost, and
// nothing that needs a live network call at checkout).
//
// Like the menu's placeholder prices elsewhere in this project, these fees
// are launch guesses (typical Metro Manila food-delivery pricing), not
// researched courier rates — easy to tune per city below once real numbers
// are known. If a third branch ever opens somewhere else in NCR, this would
// need to become a per-branch table instead of one shared one.
const ZONES = [
  {
    tier: 1,
    fee: 49,
    cities: ["Taguig", "Pateros", "Makati", "Pasig", "Muntinlupa", "Parañaque"],
  },
  {
    tier: 2,
    fee: 79,
    cities: ["Mandaluyong", "San Juan", "Marikina", "Pasay City", "Las Piñas"],
  },
  {
    tier: 3,
    fee: 129,
    cities: ["Manila", "Quezon City", "Caloocan", "Malabon", "Navotas", "Valenzuela"],
  },
];

const FEE_BY_CITY = new Map(ZONES.flatMap((zone) => zone.cities.map((city) => [city, zone.fee])));

// Farthest tier's fee — a defensive fallback only. Every city a customer can
// actually pick is validated against the same NCR list this table is built
// from (lib/psgc.js's isValidCity), so this should never actually be hit.
const FALLBACK_FEE = ZONES[ZONES.length - 1].fee;

export function getDeliveryFee(cityName) {
  return FEE_BY_CITY.get(cityName) ?? FALLBACK_FEE;
}
