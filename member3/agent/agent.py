from __future__ import annotations

import json
import re
from functools import lru_cache
from typing import Any, TypedDict

import requests
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import Tool
from langchain_ollama import ChatOllama
from langgraph.graph import END, START, StateGraph

from agent.prompts import SYSTEM_PROMPT
from agent.router import route_question
from config.settings import OLLAMA_BASE_URL, OLLAMA_MODEL
from schemas.response import AgentResponse
from tools.land_tools import (
    get_building_permission,
    get_encumbrance,
    get_land_use,
    get_multiple_parcels_details,
    get_owner_details,
    get_parcel_details,
    get_parcels_in_area,
    get_risk_score,
    get_registration_status,
    get_ror_status,
    get_satellite_alerts,
    get_selected_area,
    get_tax_status,
    get_verification_status,
)

TOOL_MAP = {
    "get_selected_area": get_selected_area,
    "get_parcels_in_area": get_parcels_in_area,
    "get_parcel_details": get_parcel_details,
    "get_multiple_parcels_details": get_multiple_parcels_details,
    "get_owner_details": get_owner_details,
    "get_land_use": get_land_use,
    "get_ror_status": get_ror_status,
    "get_registration_status": get_registration_status,
    "get_tax_status": get_tax_status,
    "get_encumbrance": get_encumbrance,
    "get_building_permission": get_building_permission,
    "get_verification_status": get_verification_status,
    "get_risk_score": get_risk_score,
    "get_satellite_alerts": get_satellite_alerts,
}


class AgentState(TypedDict):
    question: str
    messages: list
    response: AgentResponse | None


def is_ollama_available() -> bool:
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=0.3)
        return response.status_code == 200
    except requests.RequestException:
        return False


@lru_cache(maxsize=1)
def get_llm() -> ChatOllama:
    return ChatOllama(model=OLLAMA_MODEL, base_url=OLLAMA_BASE_URL, temperature=0)


def _extract_ulpins(payload: list[Any] | dict | str) -> list[str]:
    if isinstance(payload, list):
        ids = []
        for item in payload:
            ids.extend(_extract_ulpins(item))
        return ids
    if isinstance(payload, dict):
        ids: list[str] = []
        for key, value in payload.items():
            if key == "ulpin" and isinstance(value, str):
                ids.append(value)
            elif isinstance(value, (dict, list)):
                ids.extend(_extract_ulpins(value))
        return ids
    if isinstance(payload, str):
        matches = re.findall(r"UL\d+", payload)
        return matches
    return []


def _build_response_from_question(question: str, payload: list[Any], reply: str, action: str | None = None) -> AgentResponse:
    question_lower = question.lower()
    parcel_ids = []
    for item in payload:
        parcel_ids.extend(_extract_ulpins(item))
    parcel_ids.extend(_extract_ulpins(question))
    parcel_ids.extend(_extract_ulpins(reply))
    parcel_ids = list(dict.fromkeys(parcel_ids))

    sources: list[str] = []
    warnings: list[str] = []

    if "not found" in reply.lower() or "unavailable" in reply.lower():
        warnings.append("Record unavailable or not found.")
    if "legal" in question_lower:
        warnings.append("Legal interpretation requires authorized legal review and is not determined by the AI Agent alone.")
    if "write" in question_lower or "modify" in question_lower or "delete" in question_lower or "approve" in question_lower:
        warnings.append("This system is read-only. Write actions are not supported in the current implementation.")

    if "highlight" in question_lower or "map" in question_lower:
        action = "highlight"

    if not sources:
        if any("encumbrance" in str(item).lower() for item in payload):
            sources.append("encumbrance")
        if any("verification" in str(item).lower() for item in payload):
            sources.append("verification")
        if any("land_use" in str(item).lower() or "agriculture" in str(item).lower() for item in payload):
            sources.append("land_use")
        if any("owner" in str(item).lower() for item in payload):
            sources.append("owner")

    return AgentResponse(
        answer=reply,
        parcel_ids=parcel_ids,
        action=action,
        sources=sources,
        warnings=warnings,
    )


def _heuristic_agent(question: str) -> AgentResponse:
    text = (question or "").strip()
    if not text:
        return AgentResponse(
            answer="Please provide a question.",
            parcel_ids=[],
            action=None,
            sources=[],
            warnings=["No question was provided."],
        )

    q_lower = text.lower()
    route = route_question(q_lower)

    if (
        "write" in q_lower
        or "modify" in q_lower
        or "delete" in q_lower
        or "approve" in q_lower
        or "update" in q_lower
        or "change" in q_lower
        or "assign" in q_lower
        or "amend" in q_lower
    ):
        return AgentResponse(
            answer="LandStack Agent is currently read-only. It cannot modify parcel records or approve changes.",
            parcel_ids=[],
            action=None,
            sources=[],
            warnings=["Read-only guardrail enforced."],
        )

    if "legal" in q_lower:
        return AgentResponse(
            answer="Legal interpretation requires authorized legal review and the available records only. The current Agent is not a legal authority.",
            parcel_ids=[],
            action=None,
            sources=[],
            warnings=["Unsupported legal conclusion avoided."],
        )

    raw_ulpins = re.findall(r"UL\d+", text, flags=re.IGNORECASE)
    ulpins = list(dict.fromkeys([u.upper() for u in raw_ulpins]))

    if len(ulpins) > 1:
        if route == "owner" or "who owns" in q_lower or "owner" in q_lower:
            owner_lines = []
            warnings = []
            for u in ulpins:
                owner = get_owner_details(u)
                name = owner.get("owner") if isinstance(owner, dict) else None
                if name:
                    owner_lines.append(f"• Parcel {u}: {name}")
                else:
                    owner_lines.append(f"• Parcel {u}: owner record not found")
                    warnings.append(f"Owner record not found for {u}.")
            return AgentResponse(
                answer=f"Ownership details for {len(ulpins)} parcels:\n" + "\n".join(owner_lines),
                parcel_ids=ulpins,
                action=None,
                sources=["owner"],
                warnings=warnings,
            )

        if route == "land_use" or "land use" in q_lower or "land-use" in q_lower:
            lu_lines = []
            warnings = []
            for u in ulpins:
                lu = get_land_use(u)
                val = lu.get("land_use") if isinstance(lu, dict) else None
                if val:
                    lu_lines.append(f"• Parcel {u}: {val}")
                else:
                    lu_lines.append(f"• Parcel {u}: no land use record found")
                    warnings.append(f"Land use record not found for {u}.")
            return AgentResponse(
                answer=f"Land use for {len(ulpins)} parcels:\n" + "\n".join(lu_lines),
                parcel_ids=ulpins,
                action=None,
                sources=["land_use"],
                warnings=warnings,
            )

        if "tax status" in q_lower or "tax" in q_lower:
            tax_lines = []
            warnings = []
            for u in ulpins:
                tax = get_tax_status(u)
                val = tax.get("status") if isinstance(tax, dict) else None
                if val:
                    tax_lines.append(f"• Parcel {u}: {val}")
                else:
                    tax_lines.append(f"• Parcel {u}: no tax status record found")
                    warnings.append(f"Tax status record not found for {u}.")
            return AgentResponse(
                answer=f"Tax status for {len(ulpins)} parcels:\n" + "\n".join(tax_lines),
                parcel_ids=ulpins,
                action=None,
                sources=["tax_status"],
                warnings=warnings,
            )

        if "building permission" in q_lower or "building permit" in q_lower or "permission" in q_lower:
            bp_lines = []
            warnings = []
            for u in ulpins:
                bp = get_building_permission(u)
                val = bp.get("status") if isinstance(bp, dict) else None
                if val:
                    bp_lines.append(f"• Parcel {u}: {val}")
                else:
                    bp_lines.append(f"• Parcel {u}: no building permission record found")
                    warnings.append(f"Building permission record not found for {u}.")
            return AgentResponse(
                answer=f"Building permission status for {len(ulpins)} parcels:\n" + "\n".join(bp_lines),
                parcel_ids=ulpins,
                action=None,
                sources=["building_permission"],
                warnings=warnings,
            )

        if "encumbrance" in q_lower or "mortgage" in q_lower or "lien" in q_lower:
            enc_lines = []
            warnings = []
            for u in ulpins:
                enc = get_encumbrance(u)
                status_val = enc.get("status") if isinstance(enc, dict) else None
                rec = enc.get("record", "") if isinstance(enc, dict) else ""
                if status_val and status_val != "unavailable":
                    enc_lines.append(f"• Parcel {u}: {status_val} ({rec})")
                else:
                    enc_lines.append(f"• Parcel {u}: no encumbrance record found")
                    warnings.append(f"Encumbrance record not found for {u}.")
            return AgentResponse(
                answer=f"Encumbrance details for {len(ulpins)} parcels:\n" + "\n".join(enc_lines),
                parcel_ids=ulpins,
                action="highlight" if "highlight" in q_lower else None,
                sources=["encumbrance"],
                warnings=warnings,
            )

        if "risk" in q_lower:
            risk_lines = []
            warnings = []
            for u in ulpins:
                r = get_risk_score(u)
                score = r.get("risk_score") if isinstance(r, dict) else None
                if score is not None:
                    risk_lines.append(f"• Parcel {u}: risk score {score}")
                else:
                    risk_lines.append(f"• Parcel {u}: no risk record found")
                    warnings.append(f"Risk score record not found for {u}.")
            return AgentResponse(
                answer=f"Risk scores for {len(ulpins)} parcels:\n" + "\n".join(risk_lines),
                parcel_ids=ulpins,
                action=None,
                sources=["risk_score"],
                warnings=warnings,
            )

        if "satellite" in q_lower or "alert" in q_lower:
            sat_lines = []
            warnings = []
            for u in ulpins:
                s = get_satellite_alerts(u)
                alerts = s.get("alerts") if isinstance(s, dict) else None
                if isinstance(alerts, list) and alerts:
                    sat_lines.append(f"• Parcel {u}: {', '.join(alerts)}")
                elif isinstance(alerts, list):
                    sat_lines.append(f"• Parcel {u}: No alerts")
                else:
                    sat_lines.append(f"• Parcel {u}: no satellite alert record found")
                    warnings.append(f"Satellite alert record not found for {u}.")
            return AgentResponse(
                answer=f"Satellite alerts for {len(ulpins)} parcels:\n" + "\n".join(sat_lines),
                parcel_ids=ulpins,
                action=None,
                sources=["satellite_alerts"],
                warnings=warnings,
            )

        if "verification" in q_lower or "mismatch" in q_lower:
            v_lines = []
            warnings = []
            for u in ulpins:
                v = get_verification_status(u)
                status_val = v.get("status") if isinstance(v, dict) else None
                rec = v.get("record", "") if isinstance(v, dict) else ""
                if status_val and status_val != "unavailable":
                    v_lines.append(f"• Parcel {u}: {status_val} ({rec})")
                else:
                    v_lines.append(f"• Parcel {u}: no verification record found")
                    warnings.append(f"Verification record not found for {u}.")
            return AgentResponse(
                answer=f"Verification status for {len(ulpins)} parcels:\n" + "\n".join(v_lines),
                parcel_ids=ulpins,
                action=None,
                sources=["verification"],
                warnings=warnings,
            )

        # Default multi-parcel details (e.g. details, comparison, show)
        detail_lines = []
        warnings = []
        for u in ulpins:
            det = get_parcel_details(u)
            if isinstance(det, dict) and det.get("status") != "unavailable":
                owner_str = det.get('owner', 'Unknown')
                area_str = f"{det.get('area_acres')} acres"
                doc_area = det.get('document_area_acres')
                if doc_area is not None and doc_area != det.get('area_acres'):
                    area_str += f" (doc: {doc_area} acres)"
                detail_lines.append(
                    f"• Parcel {u}: owner {owner_str}, area {area_str}, "
                    f"land use {det.get('land_use', 'N/A')}, tax status {det.get('tax_status', 'N/A')}, "
                    f"encumbrance {det.get('encumbrance_status', 'None')}, risk score {det.get('risk_score', 'N/A')}."
                )
            else:
                detail_lines.append(f"• Parcel {u}: record not found.")
                warnings.append(f"Parcel record not found for {u}.")

        return AgentResponse(
            answer=f"Details for {len(ulpins)} parcels:\n\n" + "\n".join(detail_lines),
            parcel_ids=ulpins,
            action="highlight" if "highlight" in q_lower or "map" in q_lower else None,
            sources=["parcel_details"],
            warnings=warnings,
        )

    if len(ulpins) == 1:
        ulpin = ulpins[0]
        details = get_parcel_details(ulpin)

        if route == "owner" or "who owns" in q_lower:
            owner = get_owner_details(ulpin)
            name = owner.get("owner") if isinstance(owner, dict) else None
            if name:
                return AgentResponse(
                    answer=f"The owner of {ulpin} is {name}.",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["owner"],
                    warnings=[],
                )
            return AgentResponse(
                answer=f"No owner record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["owner"],
                warnings=["Owner record not found."],
            )

        if route == "land_use" or "land use" in q_lower or "land-use" in q_lower:
            result = get_land_use(ulpin)
            value = result.get("land_use") if isinstance(result, dict) else None
            if value:
                return AgentResponse(
                    answer=f"The land use for {ulpin} is {value}.",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["land_use"],
                    warnings=[],
                )
            return AgentResponse(
                answer=f"No land use record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["land_use"],
                warnings=["Land use record not found."],
            )

        if "tax status" in q_lower or "tax" in q_lower:
            result = get_tax_status(ulpin)
            value = result.get("status") if isinstance(result, dict) else None
            if value:
                return AgentResponse(
                    answer=f"The tax status for {ulpin} is {value}.",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["tax_status"],
                    warnings=[],
                )
            return AgentResponse(
                answer=f"No tax status record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["tax_status"],
                warnings=["Tax status record not found."],
            )

        if "building permission" in q_lower or "building permit" in q_lower or "permission" in q_lower:
            result = get_building_permission(ulpin)
            value = result.get("status") if isinstance(result, dict) else None
            if value:
                return AgentResponse(
                    answer=f"The building permission status for {ulpin} is {value}.",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["building_permission"],
                    warnings=[],
                )
            return AgentResponse(
                answer=f"No building permission record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["building_permission"],
                warnings=["Building permission record not found."],
            )

        if "risk" in q_lower:
            result = get_risk_score(ulpin)
            value = result.get("risk_score") if isinstance(result, dict) else None
            if value is not None:
                return AgentResponse(
                    answer=f"The risk score for {ulpin} is {value}.",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["risk_score"],
                    warnings=[],
                )
            return AgentResponse(
                answer=f"No risk score record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["risk_score"],
                warnings=["Risk score record not found."],
            )

        if "satellite" in q_lower or "alert" in q_lower:
            result = get_satellite_alerts(ulpin)
            alerts = result.get("alerts") if isinstance(result, dict) else None
            if isinstance(alerts, list) and alerts:
                return AgentResponse(
                    answer=f"Satellite alerts for {ulpin}: {', '.join(alerts)}.",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["satellite_alerts"],
                    warnings=[],
                )
            return AgentResponse(
                answer=f"No satellite alert record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["satellite_alerts"],
                warnings=["Satellite alert record not found."],
            )

        if route == "encumbrance" or "encumbrance" in q_lower or "mortgage" in q_lower or "lien" in q_lower:
            enc = get_encumbrance(ulpin)
            status_val = enc.get("status") if isinstance(enc, dict) else None
            rec = enc.get("record", "") if isinstance(enc, dict) else ""
            if status_val and status_val != "unavailable":
                if status_val.lower() == "none":
                    reply_text = f"Parcel {ulpin} has no active encumbrance ({rec})."
                elif status_val.lower() == "active":
                    reply_text = f"Parcel {ulpin} has an active encumbrance: {rec}."
                else:
                    reply_text = f"The encumbrance status for {ulpin} is {status_val} ({rec})."
                return AgentResponse(
                    answer=reply_text,
                    parcel_ids=[ulpin],
                    action="highlight" if "highlight" in q_lower else None,
                    sources=["encumbrance"],
                    warnings=[],
                )
            return AgentResponse(
                answer=f"No encumbrance record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["encumbrance"],
                warnings=["Encumbrance record not found."],
            )

        if route == "verification" or "verification" in q_lower or "mismatch" in q_lower or "verify" in q_lower or "verified" in q_lower:
            v = get_verification_status(ulpin)
            status_val = v.get("status") if isinstance(v, dict) else None
            rec = v.get("record", "") if isinstance(v, dict) else ""
            issues = v.get("issues", []) if isinstance(v, dict) else []
            if status_val and status_val != "unavailable":
                issue_str = f" Flagged issues: {', '.join(issues)}." if issues else ""
                return AgentResponse(
                    answer=f"Verification status for {ulpin}: {status_val} ({rec}).{issue_str}",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["verification"],
                    warnings=[],
                )
            return AgentResponse(
                answer=f"No verification record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["verification"],
                warnings=["Verification record not found."],
            )

        if "ror" in q_lower or "pahani" in q_lower:
            r = get_ror_status(ulpin)
            st = r.get("status") if isinstance(r, dict) else None
            if st and st != "unavailable":
                return AgentResponse(
                    answer=f"The RoR status for {ulpin} is {st}.",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["ror_status"],
                    warnings=[],
                )

        if "registration" in q_lower or "deed" in q_lower:
            rg = get_registration_status(ulpin)
            st = rg.get("status") if isinstance(rg, dict) else None
            if st and st != "unavailable":
                return AgentResponse(
                    answer=f"The registration status for {ulpin} is {st}.",
                    parcel_ids=[ulpin],
                    action=None,
                    sources=["registration_status"],
                    warnings=[],
                )

        # Default single parcel details (covers details, status, tell me about, info, or any general query on this parcel)
        if details.get("status") == "unavailable":
            return AgentResponse(
                answer=f"No parcel record was returned for {ulpin}.",
                parcel_ids=[ulpin],
                action=None,
                sources=["parcel_details"],
                warnings=["Parcel record not found."],
            )
        return AgentResponse(
            answer=f"Parcel {ulpin}: owner {details.get('owner')}, area {details.get('area_acres')} acres, land use {details.get('land_use')}, tax status {details.get('tax_status')}.",
            parcel_ids=[ulpin],
            action=None,
            sources=["parcel_details"],
            warnings=[],
        )

    if "selected area" in q_lower or "area" in q_lower:
        selected_area = get_selected_area()
        parcels = get_parcels_in_area(selected_area)

        if "encumbrance" in q_lower:
            active = []
            for item in parcels:
                enc = get_encumbrance(item)
                if isinstance(enc, dict) and enc.get("status") == "active":
                    active.append(item)
            if active:
                return AgentResponse(
                    answer=f"The selected area has {len(active)} parcel(s) with active encumbrances: {', '.join(active)}.",
                    parcel_ids=active,
                    action="highlight" if "highlight" in q_lower else None,
                    sources=["encumbrance"],
                    warnings=[],
                )
            return AgentResponse(
                answer="No active encumbrance was found in the selected area.",
                parcel_ids=[],
                action=None,
                sources=["encumbrance"],
                warnings=["No active encumbrance matches were returned."],
            )

        if "agricultural" in q_lower:
            agricultural = []
            for item in parcels:
                detail = get_parcel_details(item)
                if isinstance(detail, dict) and str(detail.get("land_use", "")).lower() == "agriculture":
                    agricultural.append(item)
            if agricultural:
                return AgentResponse(
                    answer=f"The selected area contains {len(agricultural)} agricultural parcel(s): {', '.join(agricultural)}.",
                    parcel_ids=agricultural,
                    action="highlight" if "highlight" in q_lower else None,
                    sources=["land_use"],
                    warnings=[],
                )
            return AgentResponse(
                answer="No agricultural parcels were returned for the selected area.",
                parcel_ids=[],
                action=None,
                sources=["land_use"],
                warnings=["No agricultural parcels matched the selected area."],
            )

        if "verification" in q_lower or "mismatch" in q_lower:
            mismatches = []
            for item in parcels:
                status = get_verification_status(item)
                if isinstance(status, dict) and status.get("status") == "mismatch":
                    mismatches.append(item)
            if mismatches:
                return AgentResponse(
                    answer=f"The selected area has verification mismatches for: {', '.join(mismatches)}.",
                    parcel_ids=mismatches,
                    action=None,
                    sources=["verification"],
                    warnings=[],
                )
            return AgentResponse(
                answer="No verification mismatches were returned for the selected area.",
                parcel_ids=[],
                action=None,
                sources=["verification"],
                warnings=["No verification mismatch records were returned."],
            )

        # Multi-parcel details for the selected area
        details_list = []
        for item in parcels:
            detail = get_parcel_details(item)
            if isinstance(detail, dict) and detail.get("status") != "unavailable":
                details_list.append(
                    f"Parcel {item}: owner {detail.get('owner')}, area {detail.get('area_acres')} acres, "
                    f"land use {detail.get('land_use')}, tax status {detail.get('tax_status')}."
                )
            else:
                details_list.append(f"Parcel {item}: details unavailable.")

        return AgentResponse(
            answer=f"The selected area ({selected_area}) contains {len(parcels)} parcel(s):\n\n" + "\n".join(f"• {d}" for d in details_list),
            parcel_ids=parcels,
            action="highlight" if "highlight" in q_lower or "map" in q_lower else None,
            sources=["selected_area", "parcels_in_area", "parcel_details"],
            warnings=[],
        )

    if any(k in q_lower for k in [
        "all parcels", "all the parcels", "all of the parcels", "every parcel",
        "details all", "details of all", "list parcels", "list all parcels", "parcels list",
        "show all parcels", "show all the parcels", "all plots", "all land",
        "details all the parcels", "get the details all the parcels"
    ]) or bool(re.search(r"\b(?:all\s+(?:the\s+)?parcels?|details\s+(?:of\s+)?all(?:\s+the)?(?:\s+parcels?)?|every\s+parcel)\b", q_lower)):
        selected_area = get_selected_area()
        parcels = get_parcels_in_area(selected_area)
        details_list = []
        for item in parcels:
            detail = get_parcel_details(item)
            if isinstance(detail, dict) and detail.get("status") != "unavailable":
                details_list.append(
                    f"Parcel {item}: owner {detail.get('owner')}, area {detail.get('area_acres')} acres, "
                    f"land use {detail.get('land_use')}, tax status {detail.get('tax_status')}."
                )
            else:
                details_list.append(f"Parcel {item}: details unavailable.")

        return AgentResponse(
            answer=f"Found {len(parcels)} parcel(s):\n\n" + "\n".join(f"• {d}" for d in details_list),
            parcel_ids=parcels,
            action="highlight" if "highlight" in q_lower or "map" in q_lower else None,
            sources=["parcels_in_area", "parcel_details"],
            warnings=[],
        )

    if "agricultural" in q_lower and "encumbrance" in q_lower and "highlight" in q_lower:
        area_parcels = get_parcels_in_area(get_selected_area())
        highlighted = []
        for parcel_id in area_parcels:
            parcel = get_parcel_details(parcel_id)
            enc = get_encumbrance(parcel_id)
            if isinstance(parcel, dict) and str(parcel.get("land_use", "")).lower() == "agriculture" and isinstance(enc, dict) and enc.get("status") == "active":
                highlighted.append(parcel_id)
        return AgentResponse(
            answer=f"{len(highlighted)} agricultural parcel(s) with active encumbrances were found: {', '.join(highlighted)}.",
            parcel_ids=highlighted,
            action="highlight",
            sources=["land_use", "encumbrance"],
            warnings=[],
        )

    if "verification" in q_lower or "mismatch" in q_lower:
        matches = []
        for parcel_id in get_parcels_in_area(get_selected_area()):
            status = get_verification_status(parcel_id)
            if isinstance(status, dict) and status.get("status") == "mismatch":
                matches.append(parcel_id)
        return AgentResponse(
            answer=f"Verification mismatches were found for: {', '.join(matches)}.",
            parcel_ids=matches,
            action=None,
            sources=["verification"],
            warnings=[],
        )

    # ── Domain & Governance Knowledge Responses ──
    if "ulpin" in q_lower or "bhu-aadhaar" in q_lower or "bhu aadhaar" in q_lower:
        return AgentResponse(
            answer="ULPIN (Unique Land Parcel Identification Number) is a 14-digit alphanumeric identification number based on the geo-referenced coordinates of the parcel's vertices, acting as Bhu-Aadhaar for every land parcel in India to prevent fraudulent double-sales and ensure single-source land records.",
            parcel_ids=[],
            action=None,
            sources=["governance_knowledge"],
            warnings=[],
        )

    if "7/12" in q_lower or "pahani" in q_lower or "ror" in q_lower or "record of rights" in q_lower or "khata" in q_lower:
        return AgentResponse(
            answer="A 7/12 extract (Pahani / RTC / Record of Rights) is an official revenue document maintained by state revenue departments. Form VII records title ownership, occupancy rights, survey numbers, and legal liabilities; Form XII records crop details, seasonal cultivation, and land use.",
            parcel_ids=[],
            action=None,
            sources=["governance_knowledge"],
            warnings=[],
        )

    if any(k in q_lower for k in ["what is encumbrance", "what is an encumbrance", "define encumbrance", "what does encumbrance mean", "encumbrance certificate", "what is mortgage"]):
        return AgentResponse(
            answer="An encumbrance is a legal liability or financial charge on a land parcel—such as an active bank mortgage, court attachment, or lien—that prevents a clean transfer of title until it is formally discharged.",
            parcel_ids=[],
            action=None,
            sources=["governance_knowledge"],
            warnings=[],
        )

    if "mutation" in q_lower or "dakhil kharij" in q_lower or "namantaran" in q_lower:
        return AgentResponse(
            answer="Mutation (Namantaran / Dakhil Kharij) is the formal administrative process of updating ownership entries in local revenue land records (RoR) following deed registration, inheritance, gift, partition, or court decree.",
            parcel_ids=[],
            action=None,
            sources=["governance_knowledge"],
            warnings=[],
        )

    if any(k in q_lower for k in ["what is stay order", "what is a stay order", "what is court stay", "what is injunction", "what does stay order mean"]):
        return AgentResponse(
            answer="A court stay order is an interim judicial injunction issued by a court of law that halts any alienation, sale, mutation, or construction on a disputed parcel until legal proceedings conclude.",
            parcel_ids=[],
            action=None,
            sources=["governance_knowledge"],
            warnings=[],
        )

    if any(k in q_lower for k in ["what is discrepancy", "what is area discrepancy", "what is an anomaly", "what is survey mismatch"]):
        return AgentResponse(
            answer="An area discrepancy is a measurable mismatch between the physical GIS land boundary area (derived from satellite mapping or cadastral resurvey) and the legal document area stated on the registered title deed or Pahani.",
            parcel_ids=[],
            action=None,
            sources=["governance_knowledge"],
            warnings=[],
        )

    # Search by owner name in synthetic data
    owner_map = {
        "ravi kumar": "UL001",
        "anita sharma": "UL002",
        "rahul patil": "UL003",
        "priya singh": "UL004",
    }
    for owner_name, matched_ulpin in owner_map.items():
        if owner_name in q_lower:
            det = get_parcel_details(matched_ulpin)
            return AgentResponse(
                answer=f"Owner **{det.get('owner')}** holds parcel **{matched_ulpin}** ({det.get('area_acres')} acres, {det.get('land_use')}, tax status: {det.get('tax_status')}, risk score: {det.get('risk_score', 'N/A')}).",
                parcel_ids=[matched_ulpin],
                action=None,
                sources=["owner", "parcel_details"],
                warnings=[],
            )

    # Search by survey number in synthetic data
    survey_map = {
        "101/17a": "UL001",
        "205/18b": "UL002",
        "310/19c": "UL003",
        "415/20d": "UL004",
    }
    for s_no, matched_ulpin in survey_map.items():
        if s_no in q_lower:
            det = get_parcel_details(matched_ulpin)
            return AgentResponse(
                answer=f"Survey number **{det.get('survey_number')}** corresponds to parcel **{matched_ulpin}** (Owner: {det.get('owner')}, {det.get('area_acres')} acres).",
                parcel_ids=[matched_ulpin],
                action=None,
                sources=["survey_number", "parcel_details"],
                warnings=[],
            )

    if any(k in q_lower for k in ["landstack", "what can you do", "help", "hello", "hi", "who are you", "what are you"]):
        return AgentResponse(
            answer="Hello! I am the LandStack AI Agent. I help authorized officers inspect land records, audit 360° unified parcel profiles, detect area discrepancies, verify court stays and bank encumbrances, compare multiple parcels, and explain land governance concepts.",
            parcel_ids=[],
            action=None,
            sources=["agent_overview"],
            warnings=[],
        )

    return AgentResponse(
        answer="I can answer questions regarding any LandStack parcels (UL001, UL002, UL003, UL004), land records, encumbrances, court stays, taxes, or general Indian land governance concepts (such as ULPIN, 7/12 extracts, and mutations).",
        parcel_ids=[],
        action=None,
        sources=[],
        warnings=["No matching tool result was generated for this request."],
    )


def _build_graph():
    llm = get_llm()
    tools = [
        Tool.from_function(get_selected_area),
        Tool.from_function(get_parcels_in_area),
        Tool.from_function(get_parcel_details),
        Tool.from_function(get_multiple_parcels_details),
        Tool.from_function(get_owner_details),
        Tool.from_function(get_land_use),
        Tool.from_function(get_ror_status),
        Tool.from_function(get_registration_status),
        Tool.from_function(get_tax_status),
        Tool.from_function(get_encumbrance),
        Tool.from_function(get_building_permission),
        Tool.from_function(get_verification_status),
        Tool.from_function(get_risk_score),
        Tool.from_function(get_satellite_alerts),
    ]
    llm_with_tools = llm.bind_tools(tools)

    def call_model(state: AgentState):
        messages = state.get("messages", [])
        if not messages:
            messages = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=state["question"])]
        ai_message = llm_with_tools.invoke(messages)
        return {"messages": messages + [ai_message]}

    def should_continue(state: AgentState):
        last_message = state["messages"][-1]
        if isinstance(last_message, AIMessage) and getattr(last_message, "tool_calls", None):
            return "tools"
        return "finalize"

    def run_tools(state: AgentState):
        last_message = state["messages"][-1]
        tool_calls = getattr(last_message, "tool_calls", []) or []
        tool_messages: list[ToolMessage] = []
        for call in tool_calls:
            name = call.get("name")
            args = call.get("args", {}) or {}
            fn = TOOL_MAP.get(name)
            if fn is None:
                continue
            result = fn(**args) if args else fn()
            tool_messages.append(
                ToolMessage(
                    content=json.dumps(result, default=str),
                    tool_call_id=call.get("id"),
                    name=name,
                )
            )
        return {"messages": state["messages"] + tool_messages}

    def finalize(state: AgentState):
        payload = []
        for msg in state["messages"]:
            if isinstance(msg, ToolMessage):
                try:
                    payload.append(json.loads(msg.content))
                except json.JSONDecodeError:
                    payload.append(msg.content)

        summary_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"User question: {state['question']}\n\n"
            "Use only the facts returned by the tool results. "
            "If a record is unavailable, say it is unavailable; do not claim a negative finding. "
            "Return a short human-readable answer, and include relevant parcel IDs, a concise sources list, and warnings list in JSON.\n\n"
            f"Tool results:\n{json.dumps(payload, indent=2, default=str)}"
        )
        summary = llm.invoke([SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=summary_prompt)])
        response_text = str(summary.content)
        response = _build_response_from_question(state["question"], payload, response_text)
        return {"response": response}

    graph = StateGraph(AgentState)
    graph.add_node("call_model", call_model)
    graph.add_node("tools", run_tools)
    graph.add_node("finalize", finalize)
    graph.add_edge(START, "call_model")
    graph.add_conditional_edges("call_model", should_continue, {"tools": "tools", "finalize": "finalize"})
    graph.add_edge("tools", "call_model")
    graph.add_edge("finalize", END)
    return graph.compile()


def run_agent(question: str) -> AgentResponse:
    """Run the LandStack agent for a natural-language question.

    If local Ollama is available, the tool-calling LLM path is used. Otherwise, a deterministic
    fallback is used so the project still functions in a locally offline environment.
    """
    if not question or not question.strip():
        return AgentResponse(
            answer="Please provide a valid land question.",
            parcel_ids=[],
            action=None,
            sources=[],
            warnings=["Empty question received."],
        )

    if is_ollama_available():
        try:
            graph = _build_graph()
            result = graph.invoke({"question": question, "messages": []})
            response = result.get("response")
            if response:
                return response
        except Exception:
            pass

    return _heuristic_agent(question)
