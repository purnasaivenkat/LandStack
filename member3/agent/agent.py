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
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
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

    ulpin_match = re.search(r"UL\d+", text, flags=re.IGNORECASE)
    ulpin = ulpin_match.group(0).upper() if ulpin_match else None

    if ulpin:
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

        if route == "details":
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

    return AgentResponse(
        answer="I can answer based on the synthetic LandStack records only. No unsupported record was invented.",
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
