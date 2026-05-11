import os
from typing import Iterable, List, Optional

import requests


MODERATION_URL = "https://api.openai.com/v1/moderations"
MODERATION_MODEL = os.environ.get("OPENAI_MODERATION_MODEL", "omni-moderation-latest")
MODERATION_REQUIRED = os.environ.get("CONTENT_MODERATION_REQUIRED", "true").lower() != "false"


class ContentPolicyError(ValueError):
    def __init__(self, message: str, categories: Optional[List[str]] = None):
        super().__init__(message)
        self.categories = categories or []


def _clean_text_items(items: Optional[Iterable[object]]) -> List[str]:
    cleaned = []
    for item in items or []:
        if item is None:
            continue
        value = str(item).strip()
        if value:
            cleaned.append(value[:8000])
    return cleaned


def _flatten_text_payload(payload: object) -> List[str]:
    if isinstance(payload, dict):
        values = []
        for value in payload.values():
            values.extend(_flatten_text_payload(value))
        return values
    if isinstance(payload, list):
        values = []
        for value in payload:
            values.extend(_flatten_text_payload(value))
        return values
    return _clean_text_items([payload])


def assert_content_allowed(text_items=None, image_data_urls=None):
    texts = _clean_text_items(text_items)
    images = _clean_text_items(image_data_urls)
    if not texts and not images:
        return

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        if MODERATION_REQUIRED:
            raise ContentPolicyError("Content moderation is unavailable. Please try again later.")
        return

    moderation_input = []
    for text in texts:
        moderation_input.append({"type": "text", "text": text})
    for image_url in images:
        moderation_input.append({"type": "image_url", "image_url": {"url": image_url}})

    try:
        response = requests.post(
            MODERATION_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={"model": MODERATION_MODEL, "input": moderation_input},
            timeout=15,
        )
        response.raise_for_status()
        result = (response.json().get("results") or [{}])[0]
    except requests.RequestException as exc:
        print(f"Moderation request failed: {exc}")
        raise ContentPolicyError("Content moderation is unavailable. Please try again later.")

    if result.get("flagged"):
        categories = [
            category
            for category, flagged in (result.get("categories") or {}).items()
            if flagged
        ]
        raise ContentPolicyError(
            "This content cannot be uploaded because it may violate marketplace safety rules.",
            categories,
        )


def assert_payload_text_allowed(payload: object):
    assert_content_allowed(text_items=_flatten_text_payload(payload))
