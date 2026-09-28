import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { generateSyntheticCadastralDataset, ParcelRecord } from './generate_cadastral';
import { computeCentroid } from '../lib/gis/spatial_queries';

function WKTFromGeoJSONPolygon(coords: any[]): string {
  const pointsStr = coords.map((pt: any) => `${pt[0]} ${pt[1]}`).join(', ');
  return `SRID=4326;POLYGON((${pointsStr}))`;
}

export async function seedSupabaseParcels() {
  console.log("==================================================");
  console.log("LANDSTACK — Supabase PostGIS Parcel Seeder");
  console.log("Target Study Area: Karjat, Raigad, Maharashtra");
  console.log("==================================================");

  // 1. Read .env.local
  let envFile = '';
  try {
    envFile = fs.readFileSync('.env.local', 'utf-8');
  } catch (err) {
    console.error("❌ Error reading .env.local file");
    return;
  }

  let supabaseUrl = '';
  let supabaseKey = '';
  let serviceKey = '';

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/['"]/g, '');
    if (k === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = v;
    if (k === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') supabaseKey = v;
    if (k === 'SUPABASE_SERVICE_ROLE_KEY' || k === 'SUPABASE_SECRET_KEY') serviceKey = v;
  }

  const activeKey = serviceKey || supabaseKey;

  if (!supabaseUrl || !activeKey) {
    console.error("❌ Supabase URL or Key missing in .env.local");
    return;
  }

  console.log(`📡 Connecting to Supabase at ${supabaseUrl}...`);
  if (serviceKey) {
    console.log(`🔒 Using SUPABASE_SERVICE_ROLE_KEY (Server-side Admin credential bypassing RLS securely)`);
  } else {
    console.log(`⚠️ Using Publishable Key.`);
  }

  const supabase = createClient(supabaseUrl, activeKey);

  // 2. Generate 1,000 deterministic Karjat parcels
  const dataset = generateSyntheticCadastralDataset(1000);
  console.log(`📦 Prepared ${dataset.parcels.length} synthetic parcels for database insertion.`);

  // Prepare database rows populating both existing required columns and application columns
  const dbRows = dataset.parcels.map((p: ParcelRecord) => {
    const centroid = computeCentroid(p.geometry);
    const subNo = p.survey_no.includes('/') ? p.survey_no.split('/')[1] : '1';
    
    return {
      ulpin: p.ulpin,
      parcel_id: p.parcel_id,
      survey_no: p.survey_no,
      survey_number: p.survey_no,
      sub_division: subNo,
      gis_area_acres: p.area_acres, // Required NOT NULL column in existing schema
      area_acres: p.area_acres,     // Application area column
      village: p.village,
      taluk: 'Karjat',
      district: p.district,
      state: p.state,
      zone_id: p.zone_id,
      centroid_lng: centroid[0],
      centroid_lat: centroid[1],
      geometry_geojson: JSON.stringify(p.geometry),
      geometry: WKTFromGeoJSONPolygon(p.geometry.coordinates[0])
    };
  });

  // Batch insert/upsert (50 rows per batch)
  const batchSize = 50;
  let insertedCount = 0;

  for (let i = 0; i < dbRows.length; i += batchSize) {
    const batch = dbRows.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('parcels')
      .upsert(batch, { onConflict: 'ulpin' })
      .select('ulpin');

    if (error) {
      console.error(`❌ Batch ${i / batchSize + 1} error:`, error.message);
      process.exit(1);
    } else {
      insertedCount += (data ? data.length : batch.length);
    }
  }

  console.log(`\n==================================================`);
  console.log(`🎉 SUCCESS: ${insertedCount} parcels inserted/upserted into Supabase PostGIS database!`);
  console.log(`Verify directly in Supabase Dashboard -> Table Editor -> parcels table.`);
  console.log(`==================================================\n`);
}

if (require.main === module) {
  seedSupabaseParcels().catch(console.error);
}
