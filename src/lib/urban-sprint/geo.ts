/**
 * Placeholder location data for the participant "Shops" screen.
 *
 * ⚠ Nothing here is real. Distances are generated from the station id, and the
 * maps are centred on a fixed address rather than on the viewer. It exists so
 * the screen can be designed and demoed before any location work is done, and
 * it is deliberately the only file that would need to change:
 *
 *   - `distanceFromTeam()` becomes a real calculation once stations carry
 *     lat/lng and the browser supplies a position (navigator.geolocation, or a
 *     coarser IP lookup). The shape it returns is what the UI renders, so the
 *     components don't change.
 *   - `mapEmbedUrl()` already takes a free-text query, which is why it works
 *     without an API key. Swapping to the official Google Maps Embed API means
 *     changing this URL and adding a key.
 *
 * Because it is fabricated, the UI that uses it says so — a participant is
 * never shown an invented number that looks like a measurement.
 */

export const PLACEHOLDER_NOTICE =
  "Distances are sample values for now — live positioning isn't switched on yet.";

/** The race area every map falls back to. */
export const RACE_AREA = {
  label: "George Town, Penang",
  query: "George Town, Penang, Malaysia",
};

export type Distance = {
  metres: number;
  /** "320 m" under a kilometre, "1.2 km" above it. */
  label: string;
  walkMinutes: number;
};

/**
 * A stable fake distance. Derived from the station id rather than random, so a
 * refresh — or the live-update tick — doesn't teleport the team between
 * renders, and two participants on the same team see the same number.
 */
export function distanceFromTeam(stationId: number): Distance {
  const MIN = 90;
  const SPAN = 1500;

  // Knuth multiplicative hash via imul, so this stays in 32-bit range for any
  // id the database can produce.
  const hash = Math.abs(Math.imul(stationId, 2654435761)) % SPAN;
  const metres = MIN + hash;

  return {
    metres,
    label: metres < 1000 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`,
    // ~80 m/min is a normal walking pace, and these teams are moving.
    walkMinutes: Math.max(1, Math.round(metres / 80)),
  };
}

function mapQuery(address: string, businessName: string): string {
  const place = address.trim() || businessName.trim();
  return place ? `${place}, ${RACE_AREA.label}` : RACE_AREA.query;
}

/**
 * Google Maps' keyless embed. Good enough for a placeholder and for a demo;
 * the official Embed API (and a key) is the production path.
 */
export function mapEmbedUrl(address: string, businessName = ""): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(
    mapQuery(address, businessName)
  )}&z=16&output=embed`;
}

export function areaMapEmbedUrl(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(RACE_AREA.query)}&z=15&output=embed`;
}

/** Opens the real Maps app on a phone, which is the one genuinely useful link here. */
export function directionsUrl(address: string, businessName = ""): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    mapQuery(address, businessName)
  )}`;
}
