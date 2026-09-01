import re

from app.ai.client import generate_json

TARGET_FIELDS = ["name", "email", "phone", "goals", "program", "tags", "notes"]

_HEURISTICS: dict[str, list[str]] = {
    "name": ["name", "full name", "client name", "client"],
    "email": ["email", "e-mail", "email address"],
    "phone": ["phone", "phone number", "mobile", "mobile number", "contact number", "cell"],
    "goals": ["goal", "goals", "objective", "why"],
    "program": ["program", "package", "plan"],
    "tags": ["tags", "tag", "category", "categories"],
    "notes": ["notes", "note", "comments", "comment", "description"],
}


def _normalize(header: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", header.lower()).strip()


def _naive_mapping(headers: list[str]) -> dict[str, str | None]:
    mapping: dict[str, str | None] = {field: None for field in TARGET_FIELDS}
    used: set[str] = set()
    for field, candidates in _HEURISTICS.items():
        for header in headers:
            if header in used:
                continue
            normalized = _normalize(header)
            if normalized in candidates:
                mapping[field] = header
                used.add(header)
                break
    return mapping


async def suggest_column_mapping(headers: list[str]) -> dict[str, str | None]:
    """Maps spreadsheet column headers to known client fields. Tries AI first for
    messy/ambiguous headers, falling back to case-insensitive heuristic matching
    when no OPENAI_API_KEY is configured or the AI call fails — import always works
    either way, matching how every other AI feature in this app degrades."""
    fallback = _naive_mapping(headers)

    system_prompt = (
        "You map spreadsheet column headers to a fixed set of client-record fields for a "
        "coaching platform. Given a list of column headers, return a JSON object whose keys "
        "are exactly: name, email, phone, goals, program, tags, notes. Each value must be either "
        "one of the given headers (verbatim) or null if no column matches that field. Only match "
        "columns you are reasonably confident about; leave uncertain fields null."
    )
    user_prompt = f"Column headers: {headers}"

    result = await generate_json(system_prompt, user_prompt, fallback)

    mapping: dict[str, str | None] = {}
    for field in TARGET_FIELDS:
        value = result.get(field) if isinstance(result, dict) else None
        mapping[field] = value if value in headers else fallback.get(field)
    return mapping
