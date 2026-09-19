from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class AgentResponse(BaseModel):
    """Structured output returned by the LandStack AI Agent."""

    model_config = ConfigDict(extra="forbid")

    answer: str
    parcel_ids: list[str] = Field(default_factory=list)
    action: str | None = None
    sources: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
