import * as turf from '@turf/turf';

/**
 * Menghitung luas poligon dalam meter persegi menggunakan Turf.js
 * @param geojson Feature Polygon atau MultiPolygon
 * @returns Luas dalam meter persegi
 */
export const calculateAreaSqMeters = (geojson: any): number => {
  if (!geojson) return 0;
  try {
    const area = turf.area(geojson);
    return Math.round(area * 100) / 100; // Pembulatan 2 angka di belakang koma
  } catch (error) {
    console.error('Error calculating area:', error);
    return 0;
  }
};

/**
 * Mencari titik tengah (centroid) dari poligon
 * @param geojson Feature Polygon
 * @returns [longitude, latitude]
 */
export const getCentroid = (geojson: any): [number, number] | null => {
  if (!geojson) return null;
  try {
    const center = turf.centroid(geojson);
    return center.geometry.coordinates as [number, number];
  } catch (error) {
    console.error('Error calculating centroid:', error);
    return null;
  }
};

/**
 * Membuat kotak simulasi (rectangle) berukuran 6x6 meter di sekitar titik tengah
 * Pendekatan ini sangat ringan dan cepat untuk auto-polygon
 * @param lat Latitude titik klik
 * @param lng Longitude titik klik
 * @returns Feature Polygon GeoJSON
 */
export const generateSimulationRectangle = (lat: number, lng: number): any => {
  const centerPoint = turf.point([lng, lat]);
  // 6 meter = 0.006 kilometer. Kita pakai radius 3m (0.003km) dari pusat untuk dapat 6x6m
  // turf.envelope dari circle atau buffer
  const options = { steps: 4, units: 'kilometers' as turf.Units };
  // Karena circle turf.js berorientasi radial, kita bisa buat buffer lalu envelope
  const buffered = turf.buffer(centerPoint, 0.003, options);
  const bbox = turf.bbox(buffered);
  return turf.bboxPolygon(bbox);
};
