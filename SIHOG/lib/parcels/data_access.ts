import { supabase } from '../supabase/client';
import { KARJAT_STUDY_AREA, generateKarjatZones, StudyAreaConfig, ZoneConfig } from '../gis/karjat_study_area';
import { ParcelRecord, generateSyntheticCadastralDataset } from '../../scripts/generate_cadastral';
import { stBBoxIntersects, stIntersects } from '../gis/spatial_queries';
import { FeatureCollection, Polygon } from 'geojson';

// Backup fallback dataset (only used if Supabase database table has 0 rows before initial seed)
let localBackupDataset: { parcels: ParcelRecord[] } | null = null;
function getBackupDataset() {
  if (!localBackupDataset) {
    localBackupDataset = generateSyntheticCadastralDataset(1000);
  }
  return localBackupDataset;
}

// Convert Supabase PostGIS Database Row to ParcelRecord
function parseSupabaseParcelRow(row: any): ParcelRecord {
  let geometry: Polygon;

  if (typeof row.geometry === 'object' && row.geometry !== null && row.geometry.type === 'Polygon') {
    geometry = row.geometry;
  } else if (typeof row.geometry_geojson === 'string' && row.geometry_geojson.includes('Polygon')) {
    try {
      geometry = JSON.parse(row.geometry_geojson);
    } catch (e) {
      geometry = getBackupDataset().parcels[0].geometry;
    }
  } else if (typeof row.geometry === 'string' && row.geometry.includes('POLYGON')) {
    // Parse EWKT format e.g. "SRID=4326;POLYGON((lng lat, lng lat...))"
    const match = row.geometry.match(/POLYGON\s*\(\((.*?)\)\)/i);
    if (match && match[1]) {
      const points = match[1].split(',').map((ptStr: string) => {
        const [lng, lat] = ptStr.trim().split(/\s+/).map(Number);
        return [lng, lat] as [number, number];
      });
      geometry = { type: 'Polygon', coordinates: [points] };
    } else {
      geometry = getBackupDataset().parcels[0].geometry;
    }
  } else {
    // Fallback coordinates based on ULPIN / index
    const backup = getBackupDataset().parcels.find(p => p.ulpin === row.ulpin);
    geometry = backup ? backup.geometry : getBackupDataset().parcels[0].geometry;
  }

  const surveyNo = row.survey_no || row.survey_number || "12/1";
  const parcelId = row.parcel_id || `P${String(row.id || 1).padStart(4, '0')}`;
  const areaAcres = row.gis_area_acres || row.area_acres || row.area || 1.25;

  return {
    parcel_id: parcelId,
    ulpin: row.ulpin || `ULPIN-DEMO-000001`,
    survey_no: surveyNo,
    survey_number: surveyNo,
    area_acres: Number(areaAcres),
    village: row.village || "Karjat",
    district: row.district || "Raigad",
    state: row.state || "Maharashtra",
    zone_id: row.zone_id || "Zone-01",
    geometry: geometry
  };
}

export async function getStudyArea(): Promise<StudyAreaConfig> {
  return KARJAT_STUDY_AREA;
}

export async function getZones(): Promise<ZoneConfig[]> {
  return generateKarjatZones();
}

/**
 * PRIMARY SOURCE OF TRUTH: Supabase PostGIS Database
 */

export async function getParcels(limit: number = 1000): Promise<ParcelRecord[]> {
  try {
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map(parseSupabaseParcelRow);
    }
  } catch (err) {
    console.warn("Supabase query note:", err);
  }

  // Backup fallback if Supabase table is empty
  const backup = getBackupDataset();
  return backup.parcels.slice(0, limit);
}

export function cleanSearchQuery(query: string): string {
  let q = query.trim();
  q = q.replace(/^(survey\s*number|survey\s*no\.?|survey\s*#?|parcel\s*id|parcel\s*#?|ulpin\s*#?)\s*/i, '');
  return q.trim();
}

export function generateSearchTokens(query: string): string[] {
  const raw = query.trim();
  const cleaned = cleanSearchQuery(raw);
  const upperRaw = raw.toUpperCase();
  const upperClean = cleaned.toUpperCase();

  const tokens = new Set<string>();
  if (upperRaw) tokens.add(upperRaw);
  if (upperClean) tokens.add(upperClean);

  if (/^\d+$/.test(upperClean)) {
    tokens.add(`P${upperClean.padStart(4, '0')}`);
    tokens.add(`ULPIN-DEMO-${upperClean.padStart(6, '0')}`);
  } else if (/^P\d+$/i.test(upperClean)) {
    const numPart = upperClean.substring(1);
    tokens.add(`P${numPart.padStart(4, '0')}`);
    tokens.add(`ULPIN-DEMO-${numPart.padStart(6, '0')}`);
  }

  return Array.from(tokens);
}

export async function getParcelById(parcelId: string): Promise<ParcelRecord | null> {
  const tokens = generateSearchTokens(parcelId);

  try {
    const orConditions = tokens.map(t => `parcel_id.ilike.%${t}%`).join(',');
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .or(orConditions)
      .limit(1);

    if (!error && data && data.length > 0) {
      return parseSupabaseParcelRow(data[0]);
    }
  } catch (err) {}

  const results = await searchParcels(parcelId, 1);
  return results.length > 0 ? results[0] : null;
}

export async function getParcelByULPIN(ulpin: string): Promise<ParcelRecord | null> {
  const tokens = generateSearchTokens(ulpin);

  try {
    const orConditions = tokens.map(t => `ulpin.ilike.%${t}%`).join(',');
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .or(orConditions)
      .limit(1);

    if (!error && data && data.length > 0) {
      return parseSupabaseParcelRow(data[0]);
    }
  } catch (err) {}

  const results = await searchParcels(ulpin, 1);
  return results.length > 0 ? results[0] : null;
}

export async function getParcelBySurveyNumber(surveyNo: string): Promise<ParcelRecord | null> {
  const cleaned = cleanSearchQuery(surveyNo);
  const searchNo = cleaned.toUpperCase();

  try {
    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .or(`survey_no.ilike.%${searchNo}%,survey_number.ilike.%${searchNo}%`)
      .limit(1);

    if (!error && data && data.length > 0) {
      return parseSupabaseParcelRow(data[0]);
    }
  } catch (err) {}

  const results = await searchParcels(surveyNo, 1);
  return results.length > 0 ? results[0] : null;
}

export async function searchParcels(query: string, limit: number = 10): Promise<ParcelRecord[]> {
  const tokens = generateSearchTokens(query);
  if (tokens.length === 0) return [];

  try {
    const orConditions: string[] = [];
    for (const token of tokens) {
      orConditions.push(`ulpin.ilike.%${token}%`);
      orConditions.push(`parcel_id.ilike.%${token}%`);
      orConditions.push(`survey_no.ilike.%${token}%`);
      orConditions.push(`survey_number.ilike.%${token}%`);
      orConditions.push(`village.ilike.%${token}%`);
    }

    const { data, error } = await supabase
      .from('parcels')
      .select('*')
      .or(orConditions.join(','))
      .limit(limit);

    if (!error && data && data.length > 0) {
      return data.map(parseSupabaseParcelRow);
    }
  } catch (err) {}

  const backup = getBackupDataset();
  return backup.parcels.filter(p => {
    const pId = p.parcel_id.toUpperCase();
    const pUlpin = p.ulpin.toUpperCase();
    const pSurv = p.survey_no.toUpperCase();
    const pSurvNum = p.survey_number.toUpperCase();
    const pVill = p.village.toUpperCase();

    return tokens.some(t =>
      pId.includes(t) || pUlpin.includes(t) || pSurv.includes(t) || pSurvNum.includes(t) || pVill.includes(t)
    );
  }).slice(0, limit);
}

export async function getParcelsIntersectingBBox(bbox: [number, number, number, number]): Promise<ParcelRecord[]> {
  const allParcels = await getParcels(1000);
  return allParcels.filter(p => stBBoxIntersects(bbox, p.geometry));
}

export async function getParcelsIntersectingGeometry(drawPolygon: Polygon): Promise<ParcelRecord[]> {
  const allParcels = await getParcels(1000);
  return allParcels.filter(p => stIntersects(p.geometry, drawPolygon));
}

export async function getParcelsAsGeoJSON(): Promise<FeatureCollection> {
  const parcels = await getParcels(1000);
  return {
    type: "FeatureCollection",
    features: parcels.map(p => ({
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
        zone_id: p.zone_id
      },
      geometry: p.geometry
    }))
  };
}
