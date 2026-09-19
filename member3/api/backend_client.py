"""Backend client abstraction for future Member 2 integration.

This module intentionally does not contain real URLs or production endpoints.
It only defines the expected integration points that will be implemented later.
"""

from __future__ import annotations


def get_parcel_details_from_api(*, ulpin: str) -> dict:
    """TODO: replace with Member 2 FastAPI backend call later."""
    raise NotImplementedError("Future Member 2 API integration is not implemented yet.")


def get_parcels_in_area_from_api(*, area_id: str) -> list[str]:
    """TODO: replace with GIS/backend area query later."""
    raise NotImplementedError("Future Member 1/2 GIS or backend integration is not implemented yet.")


def get_encumbrance_from_api(*, ulpin: str) -> dict:
    """TODO: replace with real encumbrance API call later."""
    raise NotImplementedError("Future Member 2 API integration is not implemented yet.")


def get_verification_status_from_api(*, ulpin: str) -> dict:
    """TODO: replace with real verification API call later."""
    raise NotImplementedError("Future Member 2 API integration is not implemented yet.")
