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

export function computeCentroid(geom: Polygon): [number, number] {
  try {
    const poly = turf.polygon(geom.coordinates);
    const center = turf.centroid(poly);
    return center.geometry.coordinates as [number, number];
  } catch (err) {
    const first = geom.coordinates[0][0];
    return [first[0], first[1]];
  }
}

export function computeBBox(geom: Polygon): [number, number, number, number] {
  try {
    const poly = turf.polygon(geom.coordinates);
    return turf.bbox(poly) as [number, number, number, number];
  } catch (err) {
    const ring = geom.coordinates[0];
    let minLng = ring[0][0], maxLng = ring[0][0];
    let minLat = ring[0][1], maxLat = ring[0][1];
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
    return [minLng, minLat, maxLng, maxLat];
  }
}
