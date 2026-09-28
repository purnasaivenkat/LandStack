import * as turf from '@turf/turf';
import { Polygon, Feature, Geometry, BBox } from 'geojson';

/**
 * PostGIS-equivalent Spatial Operations Engine
 */

export function stIntersects(geomA: any, geomB: any): boolean {
  try {
    const fA = turf.feature(geomA);
    const fB = turf.feature(geomB);
    return turf.booleanIntersects(fA, fB);
  } catch (err) {
    return false;
  }
}

export function stContains(containerGeom: any, containedGeom: any): boolean {
  try {
    const fA = turf.feature(containerGeom);
    const fB = turf.feature(containedGeom);
    return turf.booleanContains(fA, fB);
  } catch (err) {
    return false;
  }
}

export function stWithin(geom: any, containerGeom: any): boolean {
  try {
    const fA = turf.feature(geom);
    const fB = turf.feature(containerGeom);
    return turf.booleanWithin(fA, fB);
  } catch (err) {
    return false;
  }
}

export function stPointInPolygon(pointCoords: [number, number], polygonGeom: Polygon): boolean {
  try {
    const pt = turf.point(pointCoords);
    const poly = turf.polygon(polygonGeom.coordinates);
    return turf.booleanPointInPolygon(pt, poly);
  } catch (err) {
    return false;
  }
}

export function stAreaAcres(polygonGeom: Polygon): number {
  try {
    const poly = turf.polygon(polygonGeom.coordinates);
    const sqMeters = turf.area(poly);
    return Number((sqMeters / 4046.8564224).toFixed(2));
  } catch (err) {
    return 0;
  }
}

export function stBBoxIntersects(bbox: [number, number, number, number], geom: Polygon): boolean {
  try {
    const bboxPoly = turf.bboxPolygon(bbox);
    const poly = turf.polygon(geom.coordinates);
    return turf.booleanIntersects(bboxPoly, poly);
  } catch (err) {
    return false;
  }
}

export function computeCentroid(geom?: any): [number, number] {
  if (!geom) return [73.3200, 18.9200];
  try {
    const coords = geom.coordinates;
    if (geom.type === 'Point' && Array.isArray(coords)) {
      return [coords[0], coords[1]];
    }
    if (geom.type === 'Polygon' && Array.isArray(coords) && coords[0]?.length) {
      const poly = turf.polygon(coords);
      const center = turf.centroid(poly);
      return center.geometry.coordinates as [number, number];
    }
    if (Array.isArray(coords) && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
      const first = coords[0][0];
      return [Number(first[0]), Number(first[1])];
    }
  } catch (err) {}
  return [73.3200, 18.9200];
}

export function computeBBox(geom?: any): [number, number, number, number] {
  if (!geom) return [73.3050, 18.9050, 73.3350, 18.9350];
  try {
    const coords = geom.coordinates;
    if (geom.type === 'Polygon' && Array.isArray(coords) && coords[0]?.length) {
      const poly = turf.polygon(coords);
      return turf.bbox(poly) as [number, number, number, number];
    }
    if (Array.isArray(coords) && Array.isArray(coords[0])) {
      const ring = coords[0];
      let minLng = ring[0][0], maxLng = ring[0][0];
      let minLat = ring[0][1], maxLat = ring[0][1];
      for (const pt of ring) {
        if (Array.isArray(pt)) {
          const lng = Number(pt[0]), lat = Number(pt[1]);
          if (!isNaN(lng) && !isNaN(lat)) {
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
          }
        }
      }
      return [minLng, minLat, maxLng, maxLat];
    }
  } catch (err) {}
  return [73.3050, 18.9050, 73.3350, 18.9350];
}
