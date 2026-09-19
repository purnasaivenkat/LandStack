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
    if "verification" in text or "mismatch" in text:
        return "verification"
    if "encumbrance" in text:
        return "encumbrance"
    if "agricultural" in text or "land use" in text:
        return "land_use"
    if "area" in text or "selected area" in text:
        return "area"
    if "legal" in text:
        return "legal"
    if "details" in text or "show" in text:
        return "details"
    return "general"
