/** Weighted spherical center, not a road-network/equal-travel-time optimizer. */
export function geographicCenter(locations) {
  if (!Array.isArray(locations) || !locations.length) throw new Error('At least one location is required');
  let x = 0, y = 0, z = 0, total = 0;
  for (const point of locations) {
    const { lat, lng, weight = 1 } = point || {};
    if (![lat, lng, weight].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || weight <= 0) throw new Error('Invalid coordinates or weight');
    const latitude = lat * Math.PI / 180, longitude = lng * Math.PI / 180;
    x += weight * Math.cos(latitude) * Math.cos(longitude);
    y += weight * Math.cos(latitude) * Math.sin(longitude);
    z += weight * Math.sin(latitude);
    total += weight;
  }
  if (Math.hypot(x, y, z) / total < 1e-10) throw new Error('Locations have no unique geographic center');
  return { lat: Math.atan2(z, Math.hypot(x, y)) * 180 / Math.PI, lng: Math.atan2(y, x) * 180 / Math.PI };
}
