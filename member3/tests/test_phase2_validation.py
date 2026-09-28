from __future__ import annotations

import pytest

from agent import agent as agent_module
from agent.agent import run_agent


QUESTION_CASES = [
    (
        "Show me the details of UL001.",
        {"get_parcel_details"},
        {"UL001"},
        None,
        "details",
    ),
    (
        "Which parcels in the selected area have active encumbrances?",
        {"get_selected_area", "get_parcels_in_area", "get_encumbrance"},
        {"UL002", "UL004"},
        "highlight" if False else None,
        "encumbrance",
    ),
    (
        "Show me agricultural parcels in the selected area.",
        {"get_selected_area", "get_parcels_in_area", "get_parcel_details"},
        {"UL001", "UL002", "UL004"},
        None,
        "land_use",
    ),
    (
        "Which parcels have verification mismatches?",
        {"get_selected_area", "get_parcels_in_area", "get_verification_status"},
        {"UL002", "UL004"},
        None,
        "verification",
    ),
    (
        "Highlight agricultural parcels with active encumbrances.",
        {"get_selected_area", "get_parcels_in_area", "get_parcel_details", "get_encumbrance"},
        {"UL002", "UL004"},
        "highlight",
        "highlight",
    ),
    (
        "Give me details of UL999.",
        {"get_parcel_details"},
        {"UL999"},
        None,
        "unknown",
    ),
    (
        "What is the legal status of UL001?",
        {"get_parcel_details"},
        {"UL001"},
        None,
        "legal",
    ),
]


@pytest.mark.parametrize(
    "question,required_tools,expected_ids,expected_action,scenario",
    QUESTION_CASES,
)
def test_phase2_runtime_validation(monkeypatch, question, required_tools, expected_ids, expected_action, scenario):
    calls = []

    def make_wrapper(fn, label):
        def wrapped(*args, **kwargs):
            calls.append(label)
            return fn(*args, **kwargs)

        return wrapped

    for name in [
        "get_selected_area",
        "get_parcels_in_area",
        "get_parcel_details",
        "get_encumbrance",
        "get_verification_status",
    ]:
        original = getattr(agent_module, name)
        monkeypatch.setattr(agent_module, name, make_wrapper(original, name))

    response = run_agent(question)

    # sanity: the LLM agent produced a structured response
    assert response.answer
    assert response.parcel_ids is not None

    # tool selection checks
    if scenario != "legal":
        assert required_tools.issubset(set(calls)), (question, calls)

    # Avoid unnecessary tools in the same question
    if scenario == "details":
        assert "get_selected_area" not in calls
    if scenario == "encumbrance":
        assert "get_verification_status" not in calls
    if scenario == "land_use":
        assert "get_encumbrance" not in calls
    if scenario == "verification":
        assert "get_encumbrance" not in calls
    if scenario == "highlight":
        assert response.action == "highlight"
        assert set(response.parcel_ids).issubset(expected_ids)
    if scenario == "unknown":
        assert "UL999" in response.answer or "UL999" in str(response.parcel_ids)
        assert response.warnings
    if scenario == "legal":
        assert "legal" in response.answer.lower() or "authorized" in response.answer.lower()
        assert response.warnings
        assert not calls, (question, calls)

    if scenario in {"details", "encumbrance", "land_use", "verification", "unknown"}:
        for ulpin in expected_ids:
            assert ulpin in response.answer or ulpin in response.parcel_ids

    if expected_action is not None:
        assert response.action == expected_action


@pytest.mark.parametrize(
    "question, expected_text",
    [
        ("Who owns UL002?", "Anita Sharma"),
        ("What is the land use of UL004?", "Agriculture"),
        ("What is the tax status of UL003?", "Pending"),
        ("What is the building permission status for UL002?", "Pending"),
        ("What is the risk score for UL004?", "82"),
        ("Does UL002 have any satellite alerts?", "Vegetation change detected"),
    ],
)
def test_phase3_extensive_tool_layer(question, expected_text):
    response = run_agent(question)
    assert response.answer
    assert expected_text.lower() in response.answer.lower()
