from agent.agent import run_agent
from tools.land_tools import get_encumbrance


def test_unsupported_legal_conclusion_is_guarded():
    response = run_agent("What is the legal status of UL001?")
    assert "legal" in response.answer.lower() or "authorized" in response.answer.lower()
    assert response.warnings


def test_read_only_guardrail_is_enforced():
    response = run_agent("Update the ownership of UL001 to new owner.")
    assert "read-only" in response.answer.lower() or "not supported" in response.answer.lower()


def test_missing_record_is_not_treated_as_negative():
    result = get_encumbrance("UL999")
    assert result["status"] == "unavailable"
    assert "unavailable" in result["message"].lower()
