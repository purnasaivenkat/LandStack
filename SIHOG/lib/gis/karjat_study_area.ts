import { Feature, Polygon, MultiPolygon } from 'geojson';

export interface StudyAreaConfig {
  id: string;
  name: string;
  village: string;
  district: string;
  state: string;
  country: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  geometry: Polygon;
}

export interface ZoneConfig {
  zone_id: string;
  name: string;
  study_area_name: string;
  bbox: [number, number, number, number];
  geometry: Polygon;
}

// Bounding Box for Karjat Study Area (~3km x 3km geographic study area)
// Center ~ 73.3200 E, 18.9200 N
export const KARJAT_BBOX: [number, number, number, number] = [
  73.3050, // minLng
  18.9050, // minLat
  73.3350, // maxLng
  18.9350  // maxLat
];

export const KARJAT_STUDY_AREA: StudyAreaConfig = {
  id: "SA-KARJAT-01",
  name: "Karjat Cadastral Study Area",
  village: "Karjat",
  district: "Raigad",
  state: "Maharashtra",
  country: "India",
  center: [73.3200, 18.9200],
  zoom: 15.2,
  bbox: KARJAT_BBOX,
  geometry: {
    type: "Polygon",
    coordinates: [[
      [73.3050, 18.9050],
      [73.3350, 18.9050],
      [73.3350, 18.9350],
      [73.3050, 18.9350],
      [73.3050, 18.9050]
    ]]
  }
};

// Sub-villages within Karjat Study Area
export const KARJAT_VILLAGES = [
  "Karjat",
  "Dahivali",
  "Mudre",
  "Akurle",
  "Posheri"
];

// Generate 20 Zones in a 5x4 Grid across Karjat Study Area
export function generateKarjatZones(): ZoneConfig[] {
  const [minLng, minLat, maxLng, maxLat] = KARJAT_BBOX;
  const cols = 5;
  const rows = 4;
  const lngStep = (maxLng - minLng) / cols;
  const latStep = (maxLat - minLat) / rows;

  const zones: ZoneConfig[] = [];
  let index = 1;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const zMinLng = Number((minLng + c * lngStep).toFixed(6));
      const zMaxLng = Number((minLng + (c + 1) * lngStep).toFixed(6));
      const zMinLat = Number((minLat + r * latStep).toFixed(6));
      const zMaxLat = Number((minLat + (r + 1) * latStep).toFixed(6));

      const zoneId = `Zone-${String(index).padStart(2, '0')}`;
      zones.push({
        zone_id: zoneId,
        name: `Karjat Sector ${index}`,
        study_area_name: KARJAT_STUDY_AREA.name,
        bbox: [zMinLng, zMinLat, zMaxLng, zMaxLat],
        geometry: {
          type: "Polygon",
          coordinates: [[
            [zMinLng, zMinLat],
            [zMaxLng, zMinLat],
            [zMaxLng, zMaxLat],
            [zMinLng, zMaxLat],
            [zMinLng, zMinLat]
          ]]
        }
      });
      index++;
    }
  }

  return zones;
}
