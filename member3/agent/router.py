from __future__ import annotations


def route_question(question: str) -> str:
    """Simple router used to distinguish common request patterns.

    The primary tool-calling decision is still made by the LLM. This helper is a lightweight
    deterministic classifier for local fallback behavior and future extension.
    """
    text = (question or "").strip().lower()

    if not text:
        return "empty"
    if "highlight" in text or "map" in text:
        return "highlight"
    if "owner" in text or "who owns" in text:
        return "owner"
    if "verification" in text or "mismatch" in text or "verify" in text or "verified" in text:
        return "verification"
    if "encumbrance" in text or "mortgage" in text or "lien" in text:
        return "encumbrance"
    if "tax" in text:
        return "tax"
    if "building" in text or "permit" in text:
        return "building_permission"
    if "risk" in text:
        return "risk"
    if "satellite" in text or "alert" in text:
        return "satellite"
    if "agricultural" in text or "land use" in text or "land-use" in text or "zoning" in text:
        return "land_use"
    if "selected area" in text or "in the area" in text or "in this area" in text:
        return "area"
    if "legal" in text:
        return "legal"
    if any(k in text for k in ["details", "show", "status", "tell me", "inspect", "check", "info", "overview"]):
        return "details"
    return "general"
