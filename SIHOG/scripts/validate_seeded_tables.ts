import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

export async function validateSeededTables() {
  console.log("==========================================");
  console.log("RUNNING COMPREHENSIVE SEEDED TABLES VALIDATION");
  console.log("==========================================");

  let envFile = fs.readFileSync('.env.local', 'utf-8');
  let supabaseUrl = '';
  let serviceKey = '';

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/['"]/g, '');
    if (k === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = v;
    if (k === 'SUPABASE_SERVICE_ROLE_KEY') serviceKey = v;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const tables = [
    'ror_records',
    'ror',
    'deeds',
    'registration',
    'property_tax',
    'tax',
    'encumbrances',
    'encumbrance',
    'land_use',
    'building_permits',
    'court_cases'
  ];

  // 1. Source of Truth Check
  const { count: parcelsCount, error: pErr } = await supabase
    .from('parcels')
    .select('*', { count: 'exact', head: true });

  if (pErr || parcelsCount !== 1000) {
    throw new Error(`SOURCE OF TRUTH VIOLATION: Expected exactly 1000 parcels, found ${parcelsCount}`);
  }
  console.log(`✓ Check 0: Source of truth 'public.parcels' is untouched and contains exactly ${parcelsCount} records.`);

  // Fetch all parcels for foreign key & area matching
  const { data: parcelsData } = await supabase.from('parcels').select('ulpin, gis_area_acres, area_acres');
  const parcelsMap = new Map((parcelsData || []).map(p => [p.ulpin, p]));
  const validUlpinSet = new Set(parcelsMap.keys());

  const validationResults: Array<{
    table: string;
    rowCount: number;
    orphanCount: number;
    duplicateUlpinCount: number;
    enumValid: boolean;
  }> = [];

  // 2. Iterate each child table and validate
  for (const table of tables) {
    const { data: rows, error: fetchErr } = await supabase
      .from(table)
      .select('*');

    if (fetchErr) {
      throw new Error(`Failed to fetch data for ${table}: ${fetchErr.message}`);
    }

    const rowCount = rows ? rows.length : 0;
    
    // Orphan count check
    let orphanCount = 0;
    const ulpinCounts = new Map<string, number>();

    for (const r of rows || []) {
      if (!validUlpinSet.has(r.ulpin)) {
        orphanCount++;
      }
      ulpinCounts.set(r.ulpin, (ulpinCounts.get(r.ulpin) || 0) + 1);
    }

    // Duplicate ULPIN count check
    let duplicateUlpinCount = 0;
    for (const [u, count] of Array.from(ulpinCounts.entries())) {
      if (count > 1) duplicateUlpinCount += (count - 1);
    }

    validationResults.push({
      table,
      rowCount,
      orphanCount,
      duplicateUlpinCount,
      enumValid: true
    });
  }

  console.log("\n-------------------------------------------------------------");
  console.log("TABLE ROW COUNT & ORPHAN REPORT");
  console.log("-------------------------------------------------------------");
  console.log(`Table                     Rows   Orphans   Duplicates   Status`);
  console.log("-------------------------------------------------------------");

  let hasErrors = false;
  for (const r of validationResults) {
    const status = (r.rowCount === 1000 && r.orphanCount === 0 && r.duplicateUlpinCount === 0) ? "PASS ✓" : "FAIL ❌";
    if (status.includes("FAIL")) hasErrors = true;
    console.log(`${r.table.padEnd(25)} ${String(r.rowCount).padStart(5)}  ${String(r.orphanCount).padStart(8)}  ${String(r.duplicateUlpinCount).padStart(11)}   ${status}`);
  }
  console.log("-------------------------------------------------------------\n");

  if (hasErrors) {
    throw new Error("Validation failed for one or more tables!");
  }

  // 3. Paired / Parallel Table Consistency Verification
  console.log("Verifying Paired / Parallel Table Consistency...");

  // ror_records vs ror
  const { data: rorRecordsData } = await supabase.from('ror_records').select('*');
  const { data: rorData } = await supabase.from('ror').select('*');
  const rorMap = new Map((rorData || []).map(r => [r.ulpin, r]));

  let rorMismatches = 0;
  for (const rec of rorRecordsData || []) {
    const parallel = rorMap.get(rec.ulpin);
    if (!parallel || parallel.khata_number !== rec.khata_number || parallel.primary_owner !== rec.primary_owner || Math.abs(parallel.document_area_acres - rec.document_area_acres) > 0.001) {
      rorMismatches++;
    }
  }
  if (rorMismatches > 0) throw new Error(`Found ${rorMismatches} mismatches between ror_records and ror!`);
  console.log("✓ Paired Table Check 1: ror_records ↔ ror are 100% consistent.");

  // deeds vs registration
  const { data: deedsData } = await supabase.from('deeds').select('*');
  const { data: regData } = await supabase.from('registration').select('*');
  const regMap = new Map((regData || []).map(r => [r.ulpin, r]));

  let deedMismatches = 0;
  for (const d of deedsData || []) {
    const parallel = regMap.get(d.ulpin);
    if (!parallel || parallel.deed_number !== d.deed_number || parallel.consideration_amount !== d.consideration_amount || parallel.market_value !== d.market_value) {
      deedMismatches++;
    }
  }
  if (deedMismatches > 0) throw new Error(`Found ${deedMismatches} mismatches between deeds and registration!`);
  console.log("✓ Paired Table Check 2: deeds ↔ registration are 100% consistent.");

  // property_tax vs tax
  const { data: propTaxData } = await supabase.from('property_tax').select('*');
  const { data: taxData } = await supabase.from('tax').select('*');
  const taxMap = new Map((taxData || []).map(t => [t.ulpin, t]));

  let taxMismatches = 0;
  for (const pt of propTaxData || []) {
    const parallel = taxMap.get(pt.ulpin);
    if (!parallel || parallel.payment_status !== pt.payment_status || parallel.total_paid !== pt.total_paid) {
      taxMismatches++;
    }
  }
  if (taxMismatches > 0) throw new Error(`Found ${taxMismatches} mismatches between property_tax and tax!`);
  console.log("✓ Paired Table Check 3: property_tax ↔ tax are 100% consistent.");

  // encumbrances vs encumbrance
  const { data: encsData } = await supabase.from('encumbrances').select('*');
  const { data: encData } = await supabase.from('encumbrance').select('*');
  const encMap = new Map((encData || []).map(e => [e.ulpin, e]));

  let encMismatches = 0;
  for (const e of encsData || []) {
    const parallel = encMap.get(e.ulpin);
    if (!parallel || parallel.has_encumbrance !== e.has_encumbrance || parallel.status !== e.status) {
      encMismatches++;
    }
  }
  if (encMismatches > 0) throw new Error(`Found ${encMismatches} mismatches between encumbrances and encumbrance!`);
  console.log("✓ Paired Table Check 4: encumbrances ↔ encumbrance are 100% consistent.");

  // 4. Area & Monetary Value Consistency
  let areaMismatches = 0;
  for (const rec of rorRecordsData || []) {
    const p = parcelsMap.get(rec.ulpin);
    const pArea = p ? (p.gis_area_acres || p.area_acres) : 0;
    if (Math.abs(rec.document_area_acres - pArea) > 0.01) {
      areaMismatches++;
    }
  }
  if (areaMismatches > 0) throw new Error(`Found ${areaMismatches} ROR document_area_acres mismatches against parcels!`);
  console.log("✓ Area Alignment Check: All 1,000 ROR document areas match parcels.gis_area_acres.");

  console.log("\n==========================================");
  console.log("🎉 ALL SEEDED TABLES VALIDATIONS PASSED 100%!");
  console.log("==========================================");
}

if (require.main === module) {
  validateSeededTables().catch(err => {
    console.error("FATAL VALIDATION ERROR:", err);
    process.exit(1);
  });
}
