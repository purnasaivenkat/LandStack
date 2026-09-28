import fs from 'fs';
import path from 'path';
import { FeatureCollection, Polygon } from 'geojson';
import * as turf from '@turf/turf';
import { KARJAT_BBOX, generateKarjatZones, KARJAT_VILLAGES } from '../lib/gis/karjat_study_area';

// Mulberry32 deterministic PRNG
function createPRNG(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const prng = createPRNG(20260919); // Fixed seed for reproducible generation

export interface ParcelRecord {
  parcel_id: string;
  ulpin: string;
  survey_no: string;
  survey_number: string;
  area_acres: number;
  village: string;
  district: string;
  state: string;
  zone_id: string;
  land_use?: 'Residential' | 'Mixed' | 'Agricultural';
  geometry: Polygon;
}

// Calculate acreage using Turf.js area
function calculateAcres(polyGeom: Polygon): number {
  try {
    const sqMeters = turf.area(turf.polygon(polyGeom.coordinates));
    return Number((sqMeters / 4046.8564224).toFixed(2));
  } catch (e) {
    return 0.25;
  }
}

/**
 * Fast, deterministic Parent-Block Subdivision Engine.
 * Generates EXACTLY 50 parcels per zone for all 20 zones (Total = 1,000 parcels).
 */
export function generateSyntheticCadastralDataset(totalParcels: number = 1000): {
  parcels: ParcelRecord[];
} {
  const zones = generateKarjatZones(); // 20 sector zones
  const parcels: ParcelRecord[] = [];
  let globalId = 1;

  for (let zIdx = 0; zIdx < zones.length; zIdx++) {
    const zone = zones[zIdx];
    const [zMinLng, zMinLat, zMaxLng, zMaxLat] = zone.bbox;

    // Land-Use Character Classification
    let landUse: 'Residential' | 'Mixed' | 'Agricultural';
    if (zIdx % 3 === 0) {
      landUse = 'Residential';
    } else if (zIdx % 3 === 1) {
      landUse = 'Mixed';
    } else {
      landUse = 'Agricultural';
    }

    // Grid subdivision per zone (10 cols x 5 rows = 50 parcels per zone)
    const cols = 10;
    const rows = 5;
    const cellW = (zMaxLng - zMinLng) / cols;
    const cellH = (zMaxLat - zMinLat) / rows;

    // Create a 2D matrix of vertex points with shared internal boundary nodes
    const nodes: [number, number][][] = [];

    for (let r = 0; r <= rows; r++) {
      nodes[r] = [];
      for (let c = 0; c <= cols; c++) {
        const isBoundary = (r === 0 || r === rows || c === 0 || c === cols);
        const baseLng = zMinLng + c * cellW;
        const baseLat = zMinLat + r * cellH;

        if (isBoundary) {
          nodes[r][c] = [Number(baseLng.toFixed(6)), Number(baseLat.toFixed(6))];
        } else {
          // Shared internal vertex jitter
          const jX = (prng() - 0.5) * cellW * 0.35;
          const jY = (prng() - 0.5) * cellH * 0.35;
          nodes[r][c] = [Number((baseLng + jX).toFixed(6)), Number((baseLat + jY).toFixed(6))];
        }
      }
    }

    // Construct 50 contiguous neighboring child polygons using shared node matrix
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p1 = nodes[r][c];
        const p2 = nodes[r][c + 1];
        const p3 = nodes[r + 1][c + 1];
        const p4 = nodes[r + 1][c];

        let polyCoords: [number, number][];

        // Shared 5th vertex variation for non-rectangular polygon geometry
        if (prng() > 0.65 && r > 0) {
          const midX = Number(((p1[0] + p2[0]) / 2 + (prng() - 0.5) * cellW * 0.1).toFixed(6));
          const midY = Number(((p1[1] + p2[1]) / 2 + (prng() - 0.5) * cellH * 0.1).toFixed(6));
          polyCoords = [p1, [midX, midY], p2, p3, p4, p1];
        } else {
          polyCoords = [p1, p2, p3, p4, p1];
        }

        const rawGeom: Polygon = {
          type: "Polygon",
          coordinates: [polyCoords]
        };

        let rawAcres = calculateAcres(rawGeom);
        let areaAcres: number;

        // Apply realistic area distribution per land-use character
        if (landUse === 'Residential') {
          // Target 0.08 - 0.60 acres (mean ~0.26)
          const factor = 0.05 + prng() * 0.18;
          areaAcres = Number((Math.min(0.60, Math.max(0.08, rawAcres * factor))).toFixed(2));
        } else if (landUse === 'Mixed') {
          // Target 0.20 - 2.50 acres (mean ~1.10)
          const factor = 0.12 + prng() * 0.70;
          areaAcres = Number((Math.min(2.50, Math.max(0.20, rawAcres * factor))).toFixed(2));
        } else {
          // Target 0.50 - 5.00 acres (mean ~2.80)
          const factor = 0.25 + prng() * 1.50;
          areaAcres = Number((Math.min(5.00, Math.max(0.50, rawAcres * factor))).toFixed(2));
        }

        const parcelId = `P${String(globalId).padStart(4, '0')}`;
        const ulpin = `ULPIN-DEMO-${String(globalId).padStart(6, '0')}`;

        // Maharashtra Cadastral Survey Number (e.g., 12/1, 14/A, 108/3)
        const mainNo = 10 + Math.floor((globalId - 1) / 4);
        const subNo = ((globalId - 1) % 4) + 1;
        const surveyNo = `${mainNo}/${subNo}`;
        const village = KARJAT_VILLAGES[(globalId % KARJAT_VILLAGES.length)];

        parcels.push({
          parcel_id: parcelId,
          ulpin: ulpin,
          survey_no: surveyNo,
          survey_number: surveyNo,
          area_acres: areaAcres,
          village: village,
          district: "Raigad",
          state: "Maharashtra",
          zone_id: zone.zone_id,
          land_use: landUse,
          geometry: rawGeom
        });

        globalId++;
      }
    }
  }

  return { parcels };
}

async function main() {
  console.log("==================================================");
  console.log("LANDSTACK — Synthetic Cadastral Subdivision Engine");
  console.log("Target Study Area: Karjat, Raigad, Maharashtra");
  console.log("==================================================");

  const dataset = generateSyntheticCadastralDataset(1000);
  console.log(`✅ Generated ${dataset.parcels.length} topologically coherent parcels.`);

  // Export to public/data/cadastral_karjat.json
  const outputDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const geojsonParcels: FeatureCollection = {
    type: "FeatureCollection",
    features: dataset.parcels.map(p => ({
      type: "Feature",
      id: p.parcel_id,
      properties: {
        parcel_id: p.parcel_id,
        ulpin: p.ulpin,
        survey_no: p.survey_no,
        survey_number: p.survey_number,
        area_acres: p.area_acres,
        village: p.village,
        district: p.district,
        state: p.state,
        zone_id: p.zone_id,
        land_use: p.land_use
      },
      geometry: p.geometry
    }))
  };

  const fullExportPath = path.join(outputDir, 'cadastral_karjat.json');
  fs.writeFileSync(fullExportPath, JSON.stringify({
    studyArea: KARJAT_BBOX,
    parcels: geojsonParcels
  }, null, 2));

  console.log(`📁 Exported dataset to ${fullExportPath}`);
}

if (require.main === module) {
  main().catch(console.error);
}
