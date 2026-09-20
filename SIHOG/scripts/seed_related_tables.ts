import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Realistic Maharashtra / Indian names generator
const FIRST_NAMES = [
  'Arjun', 'Ramesh', 'Suresh', 'Vijay', 'Ganesh', 'Prakash', 'Sunil', 'Anil', 'Deepak', 'Sanjay',
  'Sachin', 'Nitin', 'Mahesh', 'Dnyaneshwar', 'Santosh', 'Rajendra', 'Vikas', 'Rahul', 'Amol', 'Prashant',
  'Priya', 'Sunita', 'Anita', 'Kavita', 'Shobha', 'Archana', 'Manisha', 'Pooja', 'Swati', 'Asha'
];

const FATHER_NAMES = [
  'Ramesh', 'Suresh', 'Babu', 'Maruti', 'Pandurang', 'Shankar', 'Dattatray', 'Mahadev', 'Eknath', 'Namdeo',
  'Tukaram', 'Kashinath', 'Ganpat', 'Laxman', 'Vishnu', 'Raghunath', 'Vithal', 'Gopinath', 'Bhimrao', 'Sadashiv'
];

const LAST_NAMES = [
  'Patil', 'Deshmukh', 'Jadhav', 'Pawar', 'Kadam', 'Shinde', 'Gaikwad', 'More', 'Chavan', 'Bhosale',
  'Salunkhe', 'Sawant', 'Mane', 'Joshi', 'Kulkarni', 'Thakur', 'Gharat', 'Mhatre', 'Deshpande', 'Wagh'
];

const BANKS = [
  'State Bank of India',
  'Bank of Maharashtra',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Canara Bank',
  'Union Bank of India'
];

function getOwnerName(index: number): { primary: string; father: string } {
  const f = FIRST_NAMES[index % FIRST_NAMES.length];
  const fa = FATHER_NAMES[(index * 3) % FATHER_NAMES.length];
  const l = LAST_NAMES[(index * 7) % LAST_NAMES.length];
  return {
    primary: `${f} ${l}`,
    father: `${fa} ${l}`
  };
}

function getBuyerName(index: number): string {
  const f = FIRST_NAMES[(index + 5) % FIRST_NAMES.length];
  const l = LAST_NAMES[(index * 11) % LAST_NAMES.length];
  return `${f} ${l}`;
}

export async function seedRelatedTables() {
  console.log("==================================================");
  console.log("LANDSTACK — Synthetic Data Population & Seeding");
  console.log("Targeting 1,000 Parcels (ULPIN-DEMO-000001 .. ULPIN-DEMO-001000)");
  console.log("==================================================");

  // 1. Read credentials from .env.local
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

  if (!supabaseUrl || !serviceKey) {
    throw new Error("❌ Supabase URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 2. Fetch Source of Truth: 1,000 parcels
  console.log("📡 Fetching source of truth records from 'public.parcels'...");
  
  let allParcels: any[] = [];
  let page = 0;
  const pageSize = 1000;

  const { data: parcelsData, error: parcelsErr, count } = await supabase
    .from('parcels')
    .select('ulpin, state, district, taluk, village, survey_number, gis_area_acres, area_acres', { count: 'exact' });

  if (parcelsErr) {
    throw new Error(`Failed to fetch parcels: ${parcelsErr.message}`);
  }

  allParcels = parcelsData || [];
  console.log(`✓ Fetched ${allParcels.length} parcels from database.`);

  if (allParcels.length !== 1000) {
    throw new Error(`Expected exactly 1,000 parcels in source of truth table, found ${allParcels.length}!`);
  }

  // Sort parcels by ULPIN for deterministic generation
  allParcels.sort((a, b) => a.ulpin.localeCompare(b.ulpin));

  // Prepare arrays for insertion
  const rorRecordsRows: any[] = [];
  const rorRows: any[] = [];
  
  const deedsRows: any[] = [];
  const registrationRows: any[] = [];

  const propertyTaxRows: any[] = [];
  const taxRows: any[] = [];

  const encumbrancesRows: any[] = [];
  const encumbranceRows: any[] = [];

  const landUseRows: any[] = [];
  const buildingPermitsRows: any[] = [];
  const courtCasesRows: any[] = [];

  console.log("⚙️ Generating deterministic synthetic datasets...");

  for (let i = 0; i < allParcels.length; i++) {
    const p = allParcels[i];
    const ulpin = p.ulpin;
    const numPart = ulpin.replace(/[^0-9]/g, '');
    const idx = parseInt(numPart, 10) || (i + 1);

    const parcelArea = p.gis_area_acres || p.area_acres || 2.5;
    const names = getOwnerName(idx);
    const buyerName = getBuyerName(idx);

    // ----------------------------------------
    // A. ROR / ROR_RECORDS
    // ----------------------------------------
    const khataNumber = `KH-${String(idx).padStart(6, '0')}`;
    const mutationNumber = `MUT-2024-${String(idx).padStart(5, '0')}`;
    const mutatedDate = `2024-02-${String((idx % 25) + 1).padStart(2, '0')}`;
    
    const landTypes = ['Agricultural', 'Dry Crop', 'Irrigated Crop', 'Residential', 'Commercial'];
    const landType = landTypes[idx % landTypes.length];

    const soilTypes = ['Black Cotton Soil', 'Red Soil', 'Alluvial Soil', 'Laterite Soil'];
    const soilType = soilTypes[idx % soilTypes.length];

    const jointOwnersStr = (idx % 3 === 0) ? `${FIRST_NAMES[(idx + 1) % FIRST_NAMES.length]} ${LAST_NAMES[idx % LAST_NAMES.length]}` : 'None';

    const rorObj = {
      ulpin,
      khata_number: khataNumber,
      primary_owner: names.primary,
      father_name: names.father,
      joint_owners: jointOwnersStr,
      document_area_acres: Number(parcelArea.toFixed(2)),
      land_type: landType,
      soil_type: soilType,
      mutation_number: mutationNumber,
      mutated_date: mutatedDate,
      updated_at: new Date().toISOString()
    };

    rorRecordsRows.push(rorObj);
    rorRows.push(rorObj);

    // ----------------------------------------
    // B. DEEDS / REGISTRATION
    // ----------------------------------------
    const deedNumber = `DEED-KJT-2024-${String(idx).padStart(6, '0')}`;
    const regDate = `2024-01-${String((idx % 25) + 1).padStart(2, '0')}`;
    const sroName = 'Sub Registrar Office, Karjat';

    // Market value based on area (~ ₹ 15,00,000 per acre)
    const baseValue = Math.round(parcelArea * 1500000);
    const marketValue = Math.max(500000, baseValue);
    const considerationAmount = Math.round(marketValue * 0.92); // 92% of market value
    const stampDuty = Math.round(considerationAmount * 0.06);   // 6% stamp duty

    const deedObj = {
      ulpin,
      deed_number: deedNumber,
      registration_date: regDate,
      sro_name: sroName,
      party_seller: names.father,
      party_buyer: names.primary,
      consideration_amount: considerationAmount,
      stamp_duty_paid: stampDuty,
      market_value: marketValue,
      document_url: `https://landstack.gov.in/docs/${deedNumber}.pdf`,
      created_at: new Date().toISOString()
    };

    deedsRows.push(deedObj);
    registrationRows.push(deedObj);

    // ----------------------------------------
    // C. PROPERTY TAX / TAX
    // ----------------------------------------
    const assessmentYear = '2024-2025';
    const taxPerAcre = 1200;
    const propertyTaxDue = Math.round(parcelArea * taxPerAcre);
    const cessAmount = Math.round(propertyTaxDue * 0.10); // 10% cess
    
    // Status distribution: ~80% PAID, ~10% PARTIAL, ~5% DUE, ~5% DEFAULTED
    let paymentStatus: "PAID" | "PARTIAL" | "DUE" | "DEFAULTED" = "PAID";
    let penalties = 0;
    let totalPaid = 0;
    let lastPaymentDate: string | null = `2024-04-${String((idx % 25) + 1).padStart(2, '0')}`;
    let receiptNumber: string | null = `RCP-2024-${String(idx).padStart(6, '0')}`;

    if (idx % 20 === 0) {
      paymentStatus = "DEFAULTED";
      penalties = 500;
      totalPaid = 0;
      lastPaymentDate = null;
      receiptNumber = null;
    } else if (idx % 15 === 0) {
      paymentStatus = "DUE";
      penalties = 0;
      totalPaid = 0;
      lastPaymentDate = null;
      receiptNumber = null;
    } else if (idx % 10 === 0) {
      paymentStatus = "PARTIAL";
      penalties = 100;
      totalPaid = Math.round((propertyTaxDue + cessAmount + penalties) * 0.5);
    } else {
      paymentStatus = "PAID";
      penalties = 0;
      totalPaid = propertyTaxDue + cessAmount + penalties;
    }

    const taxObj = {
      ulpin,
      assessment_year: assessmentYear,
      property_tax_due: propertyTaxDue,
      cess_amount: cessAmount,
      penalties: penalties,
      total_paid: totalPaid,
      payment_status: paymentStatus,
      last_payment_date: lastPaymentDate,
      receipt_number: receiptNumber,
      created_at: new Date().toISOString()
    };

    propertyTaxRows.push(taxObj);
    taxRows.push(taxObj);

    // ----------------------------------------
    // D. ENCUMBRANCES / ENCUMBRANCE
    // ----------------------------------------
    const hasEncumbrance = (idx % 5 === 0); // 20% encumbered
    let bankName: string | null = null;
    let loanAccountNo: string | null = null;
    let mortgageAmount = 0;
    let dateOfMortgage: string | null = null;
    let status: "NONE" | "ACTIVE" | "RELEASED" = "NONE";
    let ecCertNumber: string | null = null;
    let periodFrom: string | null = null;
    let periodTo: string | null = null;
    let remarks = "No active encumbrance registered.";

    if (hasEncumbrance) {
      status = "ACTIVE";
      bankName = BANKS[idx % BANKS.length];
      loanAccountNo = `LN-${String(88000 + idx)}-${String(idx).padStart(4, '0')}`;
      mortgageAmount = Math.round(parcelArea * 500000);
      dateOfMortgage = `2022-05-${String((idx % 25) + 1).padStart(2, '0')}`;
      ecCertNumber = `EC-2024-${String(idx).padStart(6, '0')}`;
      periodFrom = dateOfMortgage;
      periodTo = `2037-05-${String((idx % 25) + 1).padStart(2, '0')}`;
      remarks = `Mortgaged to ${bankName} for agricultural loan facility.`;
    }

    const encObj = {
      ulpin,
      has_encumbrance: hasEncumbrance,
      bank_name: bankName,
      loan_account_no: loanAccountNo,
      mortgage_amount: mortgageAmount,
      date_of_mortgage: dateOfMortgage,
      status: status,
      ec_certificate_number: ecCertNumber,
      period_from: periodFrom,
      period_to: periodTo,
      remarks: remarks,
      created_at: new Date().toISOString()
    };

    encumbrancesRows.push(encObj);
    encumbranceRows.push(encObj);

    // ----------------------------------------
    // E. LAND USE
    // ----------------------------------------
    const zones: Array<"AGRICULTURAL" | "RESIDENTIAL" | "COMMERCIAL" | "INDUSTRIAL" | "GREEN_BELT" | "PUBLIC_UTILITY"> = [
      "AGRICULTURAL", "AGRICULTURAL", "AGRICULTURAL", "RESIDENTIAL", "COMMERCIAL", "GREEN_BELT"
    ];
    const masterPlanZone = zones[idx % zones.length];

    let currentUsage = "Agricultural / Crop Land";
    let isConverted = false;
    let conversionOrderNo: string | null = null;
    let conversionDate: string | null = null;

    if (masterPlanZone === "RESIDENTIAL") {
      currentUsage = "Residential Plot / Multi-Family Housing";
      isConverted = true;
      conversionOrderNo = `CONV-KJT-2021-${String(idx).padStart(5, '0')}`;
      conversionDate = `2021-08-${String((idx % 25) + 1).padStart(2, '0')}`;
    } else if (masterPlanZone === "COMMERCIAL") {
      currentUsage = "Commercial Retail / Shop Plot";
      isConverted = true;
      conversionOrderNo = `CONV-KJT-2020-${String(idx).padStart(5, '0')}`;
      conversionDate = `2020-03-${String((idx % 25) + 1).padStart(2, '0')}`;
    } else if (masterPlanZone === "GREEN_BELT") {
      currentUsage = "Green Belt / Forest Buffer";
    }

    const landUseObj = {
      ulpin,
      master_plan_zone: masterPlanZone,
      current_usage: currentUsage,
      is_converted: isConverted,
      conversion_order_no: conversionOrderNo,
      conversion_date: conversionDate,
      zoning_authority: 'MMRDA / Raigad Collectorate',
      flood_zone_risk: (idx % 12 === 0) ? 'MEDIUM' : 'LOW',
      created_at: new Date().toISOString()
    };

    landUseRows.push(landUseObj);

    // ----------------------------------------
    // F. BUILDING PERMITS
    // ----------------------------------------
    const hasPermit = (masterPlanZone === "RESIDENTIAL" || masterPlanZone === "COMMERCIAL");
    let permitNumber: string | null = null;
    let sanctioningAuth = 'Karjat Municipal Council';
    let sanctionedFloors = 0;
    let actualFloors = 0;
    let sanctionedBuiltup = 0;
    let actualBuiltup = 0;
    let approvalStatus: "APPROVED" | "PENDING" | "REJECTED" | "NO_PERMIT" | "REVOKED" = "NO_PERMIT";
    let approvalDate: string | null = null;
    let expiryDate: string | null = null;
    let occupancyCert = false;
    let deviationDetected = false;
    let violationRemarks: string | null = null;

    if (hasPermit) {
      approvalStatus = (idx % 7 === 0) ? "PENDING" : "APPROVED";
      permitNumber = `BP-KJT-2023-${String(idx).padStart(5, '0')}`;
      sanctionedFloors = (masterPlanZone === "COMMERCIAL") ? 4 : 2;
      actualFloors = sanctionedFloors;
      sanctionedBuiltup = Math.round(parcelArea * 1500); // sqft
      actualBuiltup = sanctionedBuiltup;
      approvalDate = `2023-04-${String((idx % 25) + 1).padStart(2, '0')}`;
      expiryDate = `2026-04-${String((idx % 25) + 1).padStart(2, '0')}`;
      occupancyCert = (approvalStatus === "APPROVED");
    }

    const buildingPermitObj = {
      ulpin,
      permit_number: permitNumber,
      sanctioning_authority: sanctioningAuth,
      sanctioned_floors: sanctionedFloors,
      actual_floors: actualFloors,
      sanctioned_builtup_area_sqft: sanctionedBuiltup,
      actual_builtup_area_sqft: actualBuiltup,
      approval_status: approvalStatus,
      approval_date: approvalDate,
      expiry_date: expiryDate,
      occupancy_certificate_issued: occupancyCert,
      deviation_detected: deviationDetected,
      violation_remarks: violationRemarks,
      created_at: new Date().toISOString()
    };

    buildingPermitsRows.push(buildingPermitObj);

    // ----------------------------------------
    // G. COURT CASES
    // ----------------------------------------
    const hasLitigation = (idx % 10 === 0); // 10% litigation
    let caseNumber: string | null = null;
    let courtName: string | null = null;
    let caseType: string | null = null;
    let petitioner: string | null = null;
    let respondent: string | null = null;
    let stayOrderActive = false;
    let caseStatus: "PENDING" | "STAY_GRANTED" | "DISPOSED_FAVOURABLE" | "DISPOSED_DISMISSED" | "NO_LITIGATION" = "NO_LITIGATION";
    let filingDate: string | null = null;
    let nextHearingDate: string | null = null;
    let caseSummary: string | null = null;

    if (hasLitigation) {
      caseStatus = (idx % 20 === 0) ? "STAY_GRANTED" : "PENDING";
      stayOrderActive = (caseStatus === "STAY_GRANTED");
      caseNumber = `CIV-CS-2023-${String(idx).padStart(5, '0')}`;
      courtName = "Civil Court Junior Division, Karjat";
      caseType = "Title Suit / Boundary Demarcation";
      petitioner = `${FIRST_NAMES[(idx + 4) % FIRST_NAMES.length]} ${LAST_NAMES[(idx + 2) % LAST_NAMES.length]}`;
      respondent = names.primary;
      filingDate = `2023-07-${String((idx % 25) + 1).padStart(2, '0')}`;
      nextHearingDate = `2024-11-${String((idx % 25) + 1).padStart(2, '0')}`;
      caseSummary = `Civil title dispute regarding boundary measurement of survey number ${p.survey_number || '10/1'}.`;
    }

    const courtCaseObj = {
      ulpin,
      has_litigation: hasLitigation,
      case_number: caseNumber,
      court_name: courtName,
      case_type: caseType,
      petitioner: petitioner,
      respondent: respondent,
      stay_order_active: stayOrderActive,
      case_status: caseStatus,
      filing_date: filingDate,
      next_hearing_date: nextHearingDate,
      case_summary: caseSummary,
      created_at: new Date().toISOString()
    };

    courtCasesRows.push(courtCaseObj);
  }

  // --------------------------------------------------
  // SAFELY INSERT INTO SUPABASE TABLES (IDEMPOTENT BATCHES)
  // --------------------------------------------------
  const populateTable = async (tableName: string, rows: any[]) => {
    console.log(`\n📤 Populating 'public.${tableName}' (${rows.length} rows)...`);
    
    // First safely delete existing demo records for these ULPINs to guarantee idempotency
    const ulpinList = rows.map(r => r.ulpin);
    const deleteBatchSize = 200;
    for (let d = 0; d < ulpinList.length; d += deleteBatchSize) {
      const batchUlpins = ulpinList.slice(d, d + deleteBatchSize);
      await supabase.from(tableName).delete().in('ulpin', batchUlpins);
    }

    // Batch insert
    const insertBatchSize = 100;
    let inserted = 0;

    for (let b = 0; b < rows.length; b += insertBatchSize) {
      const batch = rows.slice(b, b + insertBatchSize);
      const { data, error } = await supabase
        .from(tableName)
        .insert(batch)
        .select('ulpin');

      if (error) {
        throw new Error(`❌ Error populating '${tableName}' at batch ${b / insertBatchSize + 1}: ${error.message} | details: ${error.details}`);
      } else {
        inserted += (data ? data.length : batch.length);
      }
    }
    console.log(`  ✓ Inserted ${inserted} records into 'public.${tableName}'.`);
  };

  await populateTable('ror_records', rorRecordsRows);
  await populateTable('ror', rorRows);

  await populateTable('deeds', deedsRows);
  await populateTable('registration', registrationRows);

  await populateTable('property_tax', propertyTaxRows);
  await populateTable('tax', taxRows);

  await populateTable('encumbrances', encumbrancesRows);
  await populateTable('encumbrance', encumbranceRows);

  await populateTable('land_use', landUseRows);
  await populateTable('building_permits', buildingPermitsRows);
  await populateTable('court_cases', courtCasesRows);

  console.log("\n==================================================");
  console.log("SEEDING COMPLETED. STARTING DATA INTEGRITY VALIDATION...");
  console.log("==================================================");
}

if (require.main === module) {
  seedRelatedTables().catch(err => {
    console.error("FATAL SEEDING ERROR:", err);
    process.exit(1);
  });
}
