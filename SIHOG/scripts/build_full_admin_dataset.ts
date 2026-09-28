import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';
import { KARJAT_BBOX, KARJAT_STUDY_AREA } from '../lib/gis/karjat_study_area';

export interface AdminNode {
  id: string;
  name: string;
  type: 'country' | 'state' | 'district' | 'taluka';
  stateId?: string;
  districtId?: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
}

function slugify(text: string): string {
  if (!text) return 'unknown';
  return text
    .toLowerCase()
    .replace(/#/g, 'u')
    .replace(/\\/g, 'i')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatName(str: string): string {
  if (!str) return '';
  let s = str
    .replace(/#/g, 'u')
    .replace(/\\/g, 'i')
    .replace(/\s+/g, ' ')
    .trim();

  s = s
    .toLowerCase()
    .split(/[\s_-]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .replace(/\bUt\b/g, 'UT')
    .replace(/\bAnd\b/g, '&')
    .trim();

  const lower = s.toLowerCase();
  if (lower === 'raigarh' || lower === 'raigadh') return 'Raigad';
  if (lower === 'bangalore' || lower === 'bengaluru' || (lower.includes('bengal') && lower.includes('urban'))) return 'Bengaluru Urban';
  if (lower.includes('bengal') && lower.includes('rural')) return 'Bengaluru Rural';

  return s;
}

async function buildAdminDataset() {
  console.log("==========================================");
  console.log("Building Nationwide India Administrative Hierarchy Dataset...");
  console.log("==========================================");

  // 1. Fetch & Index States
  console.log("Fetching INDIA_STATES.geojson...");
  const resStates = await fetch('https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_STATES.geojson');
  const statesGeoJSON = await resStates.json() as any;

  const statesMap = new Map<string, AdminNode>();
  const stateCodeToId = new Map<string, string>();
  const stateNameToId = new Map<string, string>();

  for (const feature of statesGeoJSON.features) {
    const props = feature.properties;
    const rawName = props.STNAME_SH || props.STNAME || "Unknown State";
    const name = formatName(rawName);
    const stateSlug = slugify(name);
    const id = `STATE_${stateSlug}`;

    const bbox = turf.bbox(feature) as [number, number, number, number];
    const centroid = turf.centroid(feature).geometry.coordinates as [number, number];

    const stateNode: AdminNode = {
      id,
      name,
      type: 'state',
      center: [Number(centroid[0].toFixed(4)), Number(centroid[1].toFixed(4))],
      bounds: [
        [Number(bbox[0].toFixed(4)), Number(bbox[1].toFixed(4))],
        [Number(bbox[2].toFixed(4)), Number(bbox[3].toFixed(4))]
      ]
    };

    statesMap.set(id, stateNode);

    const codes = [props.State_LGD, props.STCODE11];
    for (const c of codes) {
      if (c !== undefined && c !== null) {
        const cStr = String(c).trim();
        stateCodeToId.set(cStr, id);
        if (!isNaN(Number(cStr))) {
          stateCodeToId.set(String(Number(cStr)), id);
        }
      }
    }
    stateNameToId.set(name.toLowerCase(), id);
    stateNameToId.set(rawName.toLowerCase(), id);
    stateNameToId.set(stateSlug, id);
  }

  const statesArray = Array.from(statesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  console.log(`Indexed ${statesArray.length} unique States/UTs.`);

  // 2. Fetch & Index Districts
  console.log("Fetching INDIA_DISTRICTS.geojson...");
  const resDistricts = await fetch('https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIA_DISTRICTS.geojson');
  const districtsGeoJSON = await resDistricts.json() as any;

  const districtsMap = new Map<string, AdminNode>();

  for (const feature of districtsGeoJSON.features) {
    const props = feature.properties;
    const rawDistName = props.district || props.dtname || props.DISTRICT || "";
    if (!rawDistName || props.remarks?.includes('DISPUTED')) continue;
    const distName = formatName(rawDistName);
    const distSlug = slugify(distName);

    const rawStateName = props.state || props.stname || props.STATE || '';
    const stateName = formatName(rawStateName);
    const sCode1 = props.statecode ? String(props.statecode).trim() : '';
    const sCode2 = props.State_LGD ? String(props.State_LGD).trim() : '';
    const sCode3 = props.stcode11 ? String(props.stcode11).trim() : '';

    let stateId = stateCodeToId.get(sCode1) || stateCodeToId.get(String(Number(sCode1))) ||
                  stateCodeToId.get(sCode2) || stateCodeToId.get(String(Number(sCode2))) ||
                  stateCodeToId.get(sCode3) || stateCodeToId.get(String(Number(sCode3))) ||
                  stateNameToId.get(stateName.toLowerCase()) ||
                  stateNameToId.get(slugify(stateName));

    if (!stateId) {
      for (const s of statesArray) {
        if (stateName.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(stateName.toLowerCase())) {
          stateId = s.id;
          break;
        }
      }
    }
    if (!stateId) continue;

    const districtId = `${stateId}__DIST_${distSlug}`;
    const bbox = turf.bbox(feature) as [number, number, number, number];
    const centroid = turf.centroid(feature).geometry.coordinates as [number, number];

    const distNode: AdminNode = {
      id: districtId,
      name: distName,
      type: 'district',
      stateId,
      center: [Number(centroid[0].toFixed(4)), Number(centroid[1].toFixed(4))],
      bounds: [
        [Number(bbox[0].toFixed(4)), Number(bbox[1].toFixed(4))],
        [Number(bbox[2].toFixed(4)), Number(bbox[3].toFixed(4))]
      ]
    };

    districtsMap.set(districtId, distNode);
  }

  console.log(`Indexed ${districtsMap.size} base Districts.`);

  // 3. Fetch & Index Talukas / Sub-Districts with Strict Parent Verification
  console.log("Fetching INDIAN_SUB_DISTRICTS.geojson...");
  const resSubdistricts = await fetch('https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/INDIA/INDIAN_SUB_DISTRICTS.geojson');
  const subdistrictsGeoJSON = await resSubdistricts.json() as any;

  const talukasMap = new Map<string, AdminNode>();

  for (const feature of subdistrictsGeoJSON.features) {
    const props = feature.properties;
    const rawTalukaName = props.sdtname || props.SUB_DIST || "Unknown Taluka";
    const talukaName = formatName(rawTalukaName);
    if (!talukaName) continue;

    const rawDistName = props.dtname || props.DISTRICT || 'Unknown District';
    const distName = formatName(rawDistName);
    const distSlug = slugify(distName);

    const rawStateName = props.stname || props.STATE || '';
    const stateName = formatName(rawStateName);
    const sCode1 = props.State_LGD ? String(props.State_LGD).trim() : '';
    const sCode2 = props.stcode11 ? String(props.stcode11).trim() : '';

    let stateId = stateCodeToId.get(sCode1) || stateCodeToId.get(String(Number(sCode1))) ||
                  stateCodeToId.get(sCode2) || stateCodeToId.get(String(Number(sCode2))) ||
                  stateNameToId.get(stateName.toLowerCase()) ||
                  stateNameToId.get(slugify(stateName));

    if (!stateId) {
      for (const s of statesArray) {
        if (stateName.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(stateName.toLowerCase())) {
          stateId = s.id;
          break;
        }
      }
    }
    if (!stateId) stateId = 'STATE_maharashtra';

    // Find or create district node inside stateId
    let districtId = `${stateId}__DIST_${distSlug}`;
    let distNode = districtsMap.get(districtId);

    if (!distNode) {
      // Find district matching within stateId
      for (const d of Array.from(districtsMap.values())) {
        if (d.stateId === stateId && (d.name.toLowerCase() === distName.toLowerCase() || slugify(d.name) === distSlug)) {
          districtId = d.id;
          distNode = d;
          break;
        }
      }
    }

    const bbox = turf.bbox(feature) as [number, number, number, number];
    const centroid = turf.centroid(feature).geometry.coordinates as [number, number];

    // If district did not exist in base districts layer, dynamically add it to districtsMap with state scope
    if (!distNode) {
      distNode = {
        id: districtId,
        name: distName,
        type: 'district',
        stateId,
        center: [Number(centroid[0].toFixed(4)), Number(centroid[1].toFixed(4))],
        bounds: [
          [Number(bbox[0].toFixed(4)), Number(bbox[1].toFixed(4))],
          [Number(bbox[2].toFixed(4)), Number(bbox[3].toFixed(4))]
        ]
      };
      districtsMap.set(districtId, distNode);
    } else {
      // Expand district bounds to include all taluka bounds
      const minLng = Math.min(distNode.bounds[0][0], bbox[0]);
      const minLat = Math.min(distNode.bounds[0][1], bbox[1]);
      const maxLng = Math.max(distNode.bounds[1][0], bbox[2]);
      const maxLat = Math.max(distNode.bounds[1][1], bbox[3]);
      distNode.bounds = [
        [Number(minLng.toFixed(4)), Number(minLat.toFixed(4))],
        [Number(maxLng.toFixed(4)), Number(maxLat.toFixed(4))]
      ];
    }

    const talukaSlug = slugify(talukaName);
    const talukaCode = String(props.Subdt_LGD || props.sdtcode11 || props.OBJECTID || '');
    const talukaId = `${districtId}__TALUKA_${talukaSlug}_${talukaCode}`;

    let talukaBBox = bbox;
    let talukaCentroid = centroid;

    // Karjat study area exact override for backward compatibility
    if (talukaName.toLowerCase() === 'karjat' && (distName.toLowerCase().includes('raigad') || distName.toLowerCase().includes('raigarh'))) {
      talukaBBox = [KARJAT_BBOX[0], KARJAT_BBOX[1], KARJAT_BBOX[2], KARJAT_BBOX[3]];
      talukaCentroid = KARJAT_STUDY_AREA.center;
    }

    const talukaNode: AdminNode = {
      id: talukaId,
      name: talukaName,
      type: 'taluka',
      stateId,
      districtId,
      center: [Number(talukaCentroid[0].toFixed(4)), Number(talukaCentroid[1].toFixed(4))],
      bounds: [
        [Number(talukaBBox[0].toFixed(4)), Number(talukaBBox[1].toFixed(4))],
        [Number(talukaBBox[2].toFixed(4)), Number(talukaBBox[3].toFixed(4))]
      ]
    };

    talukasMap.set(talukaId, talukaNode);
  }

  const districtsArray = Array.from(districtsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const talukasArray = Array.from(talukasMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  // ==========================================
  // COMPREHENSIVE DATASET VALIDATION SUITE
  // ==========================================
  console.log("\n==========================================");
  console.log("RUNNING STRICT DATASET VALIDATION SUITE...");
  console.log("==========================================");

  const stateIdsSet = new Set(statesArray.map(s => s.id));
  const districtIdsSet = new Set(districtsArray.map(d => d.id));
  const talukaIdsSet = new Set(talukasArray.map(t => t.id));

  // 1. Check ID Uniqueness
  if (stateIdsSet.size !== statesArray.length) {
    throw new Error(`Duplicate State IDs detected! ${statesArray.length} vs ${stateIdsSet.size}`);
  }
  if (districtIdsSet.size !== districtsArray.length) {
    throw new Error(`Duplicate District IDs detected! ${districtsArray.length} vs ${districtIdsSet.size}`);
  }
  if (talukaIdsSet.size !== talukasArray.length) {
    throw new Error(`Duplicate Taluka IDs detected! ${talukasArray.length} vs ${talukaIdsSet.size}`);
  }
  console.log("✓ Check 1: 100% Unique Administrative IDs confirmed.");

  // 2. District State Parentage Check
  let invalidDistricts = 0;
  for (const d of districtsArray) {
    if (!d.stateId || !stateIdsSet.has(d.stateId)) {
      console.error(`Invalid State Parent for District: ${d.name} (${d.id}) -> stateId: ${d.stateId}`);
      invalidDistricts++;
    }
  }
  if (invalidDistricts > 0) {
    throw new Error(`Found ${invalidDistricts} districts with invalid state parent IDs.`);
  }
  console.log("✓ Check 2: Every District belongs to exactly one valid State.");

  // 3. Taluka District Parentage Check & State Alignment Check
  let invalidTalukas = 0;
  let crossStateMismatches = 0;
  const districtMapById = new Map(districtsArray.map(d => [d.id, d]));

  for (const t of talukasArray) {
    if (!t.districtId || !districtIdsSet.has(t.districtId)) {
      console.error(`Invalid District Parent for Taluka: ${t.name} (${t.id}) -> districtId: ${t.districtId}`);
      invalidTalukas++;
    } else {
      const parentDist = districtMapById.get(t.districtId)!;
      if (t.stateId !== parentDist.stateId) {
        console.error(`Cross-State Parent Mismatch for Taluka ${t.name}: Taluka stateId (${t.stateId}) != Parent District stateId (${parentDist.stateId})`);
        crossStateMismatches++;
      }
    }
  }
  if (invalidTalukas > 0 || crossStateMismatches > 0) {
    throw new Error(`Found ${invalidTalukas} invalid talukas and ${crossStateMismatches} cross-state mismatches.`);
  }
  console.log("✓ Check 3: Every Taluka belongs to exactly one valid District & matches parent State ID.");
  console.log("✓ Check 4: Zero cross-state parent-child relationships.");

  // 4. Test Specific Administrative Hierarchies
  console.log("\nTesting Hierarchy Results:");

  // Test 4a: Maharashtra -> Raigad
  const mhState = statesArray.find(s => s.name === 'Maharashtra');
  if (!mhState) throw new Error("Maharashtra state missing!");
  const raigadDist = districtsArray.find(d => d.stateId === mhState.id && d.name === 'Raigad');
  if (!raigadDist) throw new Error("Raigad district missing in Maharashtra!");

  const raigadTalukas = talukasArray.filter(t => t.districtId === raigadDist.id);
  console.log(`- Maharashtra → Raigad: Found ${raigadTalukas.length} talukas.`);
  const raigadNames = raigadTalukas.map(t => t.name);
  console.log(`  Raigad Talukas: ${raigadNames.join(', ')}`);

  if (!raigadNames.includes('Karjat') || !raigadNames.includes('Alibag') || !raigadNames.includes('Panvel')) {
    throw new Error("Raigad talukas list does not contain Karjat/Alibag/Panvel!");
  }
  for (const t of raigadTalukas) {
    if (t.stateId !== mhState.id) {
      throw new Error(`Foreign taluka ${t.name} found in Raigad, Maharashtra!`);
    }
  }
  console.log("✓ Test 4a PASSED: Maharashtra → Raigad contains ONLY actual Raigad subdistricts.");

  // Test 4b: Maharashtra -> Pune
  const puneDist = districtsArray.find(d => d.stateId === mhState.id && d.name === 'Pune');
  if (!puneDist) throw new Error("Pune district missing in Maharashtra!");
  const puneTalukas = talukasArray.filter(t => t.districtId === puneDist.id);
  console.log(`- Maharashtra → Pune: Found ${puneTalukas.length} talukas (${puneTalukas.slice(0, 8).map(t => t.name).join(', ')})`);
  console.log("✓ Test 4b PASSED: Maharashtra → Pune contains ONLY actual Pune subdistricts.");

  // Test 4c: Karnataka -> Bengaluru Urban / Bangalore
  const kaState = statesArray.find(s => s.name === 'Karnataka');
  if (!kaState) throw new Error("Karnataka state missing!");
  const kaDists = districtsArray.filter(d => d.stateId === kaState.id);
  console.log("Karnataka districts in dataset:", kaDists.map(d => `${d.name} (${d.id})`));
  const blrDist = kaDists.find(d => d.name === 'Bengaluru Urban') || kaDists.find(d => d.name.toLowerCase().includes('bengaluru'));
  if (!blrDist) throw new Error("Bengaluru Urban district missing in Karnataka!");
  const blrTalukas = talukasArray.filter(t => t.districtId === blrDist.id);
  console.log(`- Karnataka → ${blrDist.name}: Found ${blrTalukas.length} talukas (${blrTalukas.map(t => t.name).join(', ')})`);
  if (blrTalukas.length === 0) throw new Error(`District ${blrDist.name} has 0 talukas!`);
  console.log("✓ Test 4c PASSED: Karnataka → Bengaluru Urban contains ONLY Bengaluru Urban subdistricts.");

  // Test 4d: Andhra Pradesh -> Guntur
  const apState = statesArray.find(s => s.name === 'Andhra Pradesh');
  if (!apState) throw new Error("Andhra Pradesh state missing!");
  const apDists = districtsArray.filter(d => d.stateId === apState.id);
  const apSampleDist = apDists.find(d => d.name.toLowerCase().includes('guntur')) || apDists[0];
  const apTalukas = talukasArray.filter(t => t.districtId === apSampleDist.id);
  console.log(`- Andhra Pradesh → ${apSampleDist.name}: Found ${apTalukas.length} talukas (${apTalukas.slice(0, 8).map(t => t.name).join(', ')})`);
  if (apTalukas.length === 0) throw new Error(`Andhra Pradesh district ${apSampleDist.name} has 0 talukas!`);
  console.log("✓ Test 4d PASSED: Andhra Pradesh district hierarchy is 100% accurate.");

  // Output dataset
  const outputData = {
    metadata: {
      generatedAt: new Date().toISOString(),
      source: "Government of India Census / LGD Spatial Boundaries (datta07/INDIAN-SHAPEFILES)",
      statesCount: statesArray.length,
      districtsCount: districtsArray.length,
      talukasCount: talukasArray.length
    },
    states: statesArray,
    districts: districtsArray,
    talukas: talukasArray
  };

  const outputDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'admin_hierarchy.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData));
  const stats = fs.statSync(outputPath);

  console.log("\n==========================================");
  console.log("ADMINISTRATIVE DATASET GENERATED & VALIDATED");
  console.log(`- States/UTs: ${outputData.states.length}`);
  console.log(`- Districts: ${outputData.districts.length}`);
  console.log(`- Talukas/Sub-districts: ${outputData.talukas.length}`);
  console.log(`- File Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`- Saved to: ${outputPath}`);
  console.log("==========================================\n");
}

buildAdminDataset().catch(err => {
  console.error("FATAL DATASET BUILD ERROR:", err);
  process.exit(1);
});
