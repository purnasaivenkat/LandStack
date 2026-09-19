# LandStack Member 3 Agent Integration Contract

This document defines the integration contract between the Member 3 AI Agent and the systems owned by Members 1 and 2.

Important scope boundaries:
- This is a documentation contract only.
- No real API calls are made by the Agent in the current implementation.
- No real backend integration is connected yet.
- The current Member 3 Agent uses synthetic mock tools and synthetic data only.
- Member 3 does not perform geometry or spatial calculations.

---

## 1. Member 1 GIS requirements

Member 1 is responsible for the GIS / spatial layer, including PostGIS-based operations and map context.

### Required capability: area selection

The Agent needs:

get_selected_area()
    ↓
area_id

Expected contract:
- Input: none
- Output: a current GIS area identifier
- Purpose: identify the active map area or operational boundary in the user's workspace
- Example synthetic response:
  {
    "area_id": "AREA_001"
  }

### Required capability: parcel lookup by area

The Agent needs:

get_parcels_in_area(area_id)
    ↓
ULPIN list

Expected contract:
- Input: area_id
- Output: list of parcel identifiers in that area
- Purpose: find candidate parcels for a given spatial boundary
- Example synthetic response:
  ["UL001", "UL002", "UL003", "UL004"]

### Critical constraint

Member 3 does not perform geometry calculations.

The GIS/PostGIS layer remains responsible for:
- polygon / boundary operations
- parcel selection by area
- map intersection logic
- spatial filtering
- map highlight boundaries
- any geometry-based parcel identification

The Agent may request an area_id and then receive a parcel list from the GIS layer, but it does not itself calculate geospatial intersections or geometry relationships.

---

## 2. Member 2 backend requirements

Member 2 is responsible for the backend parcel-record and business-data layer.

The following Member 3 Agent tool operations require backend support behind the tool layer:

- get_parcel_details(ulpin)
- get_owner_details(ulpin)
- get_ror_status(ulpin)
- get_registration_status(ulpin)
- get_tax_status(ulpin)
- get_encumbrance(ulpin)
- get_land_use(ulpin)
- get_building_permission(ulpin)
- get_verification_status(ulpin)
- get_risk_score(ulpin)
- get_satellite_alerts(ulpin)

These operations are the core data-access contract for Agent behavior.

### Proposed unified parcel profile interface

The following endpoint is a proposed / expected interface, but it is not a confirmed final Member 2 API contract:

GET /api/parcel-profile/{ulpin}

This is intentionally labeled as:

PROPOSED / EXPECTED INTERFACE

It is not a confirmed endpoint and not a final contract.

This proposed interface is useful as a future simplification layer for the Agent tool adapters, but the final Member 2 API must be designed and confirmed separately.

---

## 3. Expected conceptual data fields

Each tool operation expects a specific data contract. The Agent should treat these as conceptual requirements, not as strict final API schema commitments.

### 3.1 get_parcel_details(ulpin)

Purpose:
- Return the main parcel summary for a specific ULPIN.

Input:
- ulpin: parcel identifier

Expected information:
- parcel identifier
- owner
- area information
- land use
- tax status
- encumbrance status
- verification status
- notes or summary metadata

Example synthetic response:
{
  "ulpin": "UL001",
  "owner": "Ravi Kumar",
  "area_acres": 3.2,
  "document_area_acres": 2.8,
  "survey_number": "SV-101/17A",
  "land_use": "Agriculture",
  "ror_status": "Registered",
  "registration_status": "Active",
  "tax_status": "Paid",
  "encumbrance_status": "None",
  "building_permission": "Approved",
  "verification_status": "Verified",
  "risk_score": 22,
  "satellite_alerts": ["No material change detected"],
  "notes": "Synthetic parcel summary only.",
  "status": "available"
}

Missing-data behavior:
- If the record is absent, return a missing-data result instead of inventing values.
- Example: status = unavailable

Authorization consideration:
- The backend must enforce the user's role and access policy before returning details.

---

### 3.2 get_owner_details(ulpin)

Purpose:
- Return the ownership record for a parcel.

Input:
- ulpin

Expected information:
- ulpin
- owner name or owner record
- source metadata

Example synthetic response:
{
  "ulpin": "UL002",
  "owner": "Anita Sharma",
  "status": "available",
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- If owner data is absent, the result must clearly indicate missing data.
- Do not treat no-owner data and missing record as the same condition.

Authorization consideration:
- Ownership information may be role-sensitive depending on privacy rules.
- Member 2 must enforce RBAC.

---

### 3.3 get_ror_status(ulpin)

Purpose:
- Return the Record of Rights / RoR status for a parcel.

Input:
- ulpin

Expected information:
- status string such as Registered, Pending review, or unavailable

Example synthetic response:
{
  "ulpin": "UL003",
  "status": "Pending review",
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- Missing or unavailable record must be distinguished from a known negative or inactive state.

Authorization consideration:
- Access should be limited according to role and policy.

---

### 3.4 get_registration_status(ulpin)

Purpose:
- Return registration status for the parcel.

Input:
- ulpin

Expected information:
- registration lifecycle state, such as Active or Inactive

Example synthetic response:
{
  "ulpin": "UL003",
  "status": "Inactive",
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- Use unavailable when the record truly does not exist.
- Use a concrete value like Active or Inactive when the record exists and is known.

Authorization consideration:
- Backend RBAC must still be enforced.

---

### 3.5 get_tax_status(ulpin)

Purpose:
- Return parcel tax status.

Input:
- ulpin

Expected information:
- status such as Paid, Pending, or Overdue

Example synthetic response:
{
  "ulpin": "UL003",
  "status": "Pending",
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- Distinguish between record missing and known tax obligation value.

Authorization consideration:
- This may require different visibility by role.

---

### 3.6 get_encumbrance(ulpin)

Purpose:
- Return encumbrance status for a parcel.

Input:
- ulpin

Expected information:
- encumbrance status
- optional detail text
- source metadata

Example synthetic response:
{
  "ulpin": "UL002",
  "status": "active",
  "record": "Active encumbrance found.",
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- Missing encumbrance record: status = unavailable
- Existing no-encumbrance record: status = none
- Existing active encumbrance record: status = active

This distinction is mandatory.

Authorization consideration:
- Encumbrance information may be sensitive and should be governed by Member 2 authorization rules.

---

### 3.7 get_land_use(ulpin)

Purpose:
- Return the current or assigned land-use classification for a parcel.

Input:
- ulpin

Expected information:
- land_use such as Agriculture, Residential, Commercial, etc.

Example synthetic response:
{
  "ulpin": "UL004",
  "land_use": "Agriculture",
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- If the land-use record is missing, return unavailable.
- If it exists and is known, return the specific classification.

Authorization consideration:
- Access can follow normal role-based visibility rules.

---

### 3.8 get_building_permission(ulpin)

Purpose:
- Return building or construction permission status for a parcel.

Input:
- ulpin

Expected information:
- status such as Approved, Pending, Granted, Rejected

Example synthetic response:
{
  "ulpin": "UL002",
  "status": "Pending",
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- Distinguish unavailable from known non-approved statuses.

Authorization consideration:
- This type of operational record may have case-sensitive, role-based visibility.

---

### 3.9 get_verification_status(ulpin)

Purpose:
- Return verification status used to detect mismatches or inconsistent records.

Input:
- ulpin

Expected information:
- verification status such as verified or mismatch
- optional reason or issue list

Example synthetic response:
{
  "ulpin": "UL002",
  "status": "mismatch",
  "record": "Verification mismatch detected.",
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- Missing record must be unavailable.
- Known mismatch must be a different explicit value.

Authorization consideration:
- Backend should restrict access according to role.

---

### 3.10 get_risk_score(ulpin)

Purpose:
- Return a parcel-level risk indicator for operational review.

Input:
- ulpin

Expected information:
- numeric risk score, risk bucket, or risk summary

Example synthetic response:
{
  "ulpin": "UL004",
  "risk_score": 82,
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- If there is no score, return unavailable.
- If score exists, return the numeric value.

Authorization consideration:
- Risk scores may be available only to authorized officers/admin roles.

---

### 3.11 get_satellite_alerts(ulpin)

Purpose:
- Return recent or relevant satellite-based alerts for the parcel.

Input:
- ulpin

Expected information:
- list of alert messages or change observations

Example synthetic response:
{
  "ulpin": "UL002",
  "alerts": [
    "Vegetation change detected",
    "New structure suspected"
  ],
  "source": "synthetic demonstration data"
}

Missing-data behavior:
- Missing alerts should be unavailable.
- Empty-but-valid alert list is a different case from no record.

Authorization consideration:
- Satellite alerts may be operationally sensitive and should be RBAC-protected.

---

## 4. Missing data contract

The following rule must be preserved across all data operations:

"No record found"
must remain different from
"record exists and has a negative/none value."

This is required to avoid ambiguous or misleading behavior.

Examples:
- Missing encumbrance:
  {
    "status": "unavailable"
  }

- Existing no-encumbrance record:
  {
    "status": "none"
  }

This contract should be followed for all similar fields, including:
- encumbrance status
- verification status
- tax status
- ROR / registration status
- caution or alert presence

The Agent must not collapse these cases into the same outcome.

---

## 5. Authentication

Member 2 is responsible for backend authorization and RBAC enforcement.

The Agent must not bypass backend authorization.

Role model:
- Citizen
- Officer
- Admin

Expected behavior:
- The Agent should only receive results that Member 2 authorizes for the current caller.
- The Agent must not attempt to override or bypass access checks.
- The Agent must treat backend enforcement as the source of truth for authorization.

The Agent itself is not the authorization system.

---

## 6. Frontend contract

The Agent response model is defined as AgentResponse and contains:

- answer
- parcel_ids
- action
- sources
- warnings

Expected semantics:
- answer: human-readable response string
- parcel_ids: list of relevant ULPINs
- action: optional action indicator, such as highlight for map requests
- sources: logical source categories used
- warnings: missing-data, guardrail, or unsupported-operation warnings

For map requests:
- action = "highlight"
- parcel_ids = matching ULPINs

Example:
{
  "answer": "The selected area has 2 parcel(s) with active encumbrances: UL002, UL004.",
  "parcel_ids": ["UL002", "UL004"],
  "action": "highlight",
  "sources": ["encumbrance"],
  "warnings": []
}

---

## 7. Integration flow

The current conceptual flow is:

Officer
↓
Frontend
↓
Member 3 Agent
↓
Agent tools
↓
Member 1 GIS / Member 2 backend
↓
Real data
↓
Agent response
↓
Frontend

This is the intended contract for the real integrated architecture.

---

## 8. Mock-to-real migration

Current state:
- Agent → mock tools → synthetic data

Future state:
- Agent → tool adapters → backend APIs → real data

The Agent logic should remain mostly unchanged across this migration.

The important architectural idea is:
- the Agent speaks to tool functions
- the tool adapters map to Member 1 / Member 2 systems
- the real backend replaces synthetic data without requiring a rewrite of Agent reasoning

The Agent should remain focused on:
- understanding natural-language intent
- selecting relevant tools
- assembling safe, policy-compliant responses
- preserving read-only and legal guardrails

---

## 9. Do not make any API calls

This project does not connect to production or external APIs.

The current implementation is intentionally limited to:
- mock tools
- synthetic land data
- local testing
- contract documentation for future integration

No real API calls are to be made by the Agent in the current phase.

---

## 10. Summary for Members 1 and 2

Members 1 and 2 must support the following integration responsibilities:

Member 1 GIS responsibilities:
- provide the active area_id
- provide parcel IDs for an area
- do not perform Agent-side geometry logic
- remain responsible for spatial operations and map-related parcel selection

Member 2 backend responsibilities:
- provide parcel records and parcel metadata
- enforce authorization/RBAC
- return clearly distinct missing-data and negative-value statuses
- support the conceptual operations described above
- expose a future unified parcel-profile capability if desired

---

## Recommended message to send to Members 1 and 2

Please send the following to the relevant project members:

"We are preparing the Member 3 AI Agent integration contract. The Agent currently uses synthetic mock tools and mock data, and the architecture must remain read-only and non-API-connected during this phase. We need the following contract support from the Member 1 GIS and Member 2 backend layers:

1. Member 1 GIS: provide selected area_id and parcel list by area_id. Spatial calculations remain the responsibility of the GIS/PostGIS layer; Member 3 does not perform geometry calculations.
2. Member 2 backend: provide parcel details, owner details, RoR status, registration status, tax status, encumbrance, land use, building permission, verification status, risk score, and satellite alerts using secure, role-aware APIs.
3. Missing data must be distinct from valid negative values: unavailable vs none/active/inactive/etc.
4. Authorization must be enforced by backend RBAC (Citizen, Officer, Admin). The Agent must not bypass authorization.
5. Frontend contract: AgentResponse should return answer, parcel_ids, action, sources, and warnings; for map highlighting, action='highlight' and parcel_ids contains matching ULPINs.
6. The Agent should continue to use the current tool abstraction, with future adapters mapping those tools to real Member 1/2 systems without rewriting the Agent logic.

This is a documentation contract for future integration and not a live production connection yet."

---

## Final note

This document is a contract for future migration, not a final API specification.
The current implementation is intentionally mock-based and read-only.
The real API design remains the responsibility of Members 1 and 2.
