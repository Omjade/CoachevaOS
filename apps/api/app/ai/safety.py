import re

# Deliberately keyword/pattern-based, not a second LLM call — this needs to
# be fast and dependable (never silently skipped because an API call failed
# or timed out) since it gates both client-submitted check-in text and every
# agent-drafted outbound message. Mirrors the same class of concern
# client_assistant_prompt's "escalate" flag already handles via the model
# itself; this is the deterministic backstop layer, not a replacement for it.
_ESCALATION_PATTERNS = [
    r"\bsuicid\w*",
    r"\bkill (myself|my ?self)\b",
    r"\bself[- ]?harm\w*",
    r"\bend(ing)? my life\b",
    r"\bwant to die\b",
    r"\bhurt(ing)? myself\b",
    r"\boverdos\w*",
    r"\bcan'?t go on\b",
    r"\bno reason to live\b",
    r"\bmedical emergency\b",
    r"\bchest pain\b",
    r"\bcan'?t breathe\b",
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in _ESCALATION_PATTERNS]


def check_escalation(text: str | None) -> bool:
    """True if text contains language suggesting a real safety/wellbeing
    concern (self-harm, crisis, medical emergency) rather than ordinary
    coaching conversation. Used to gate check-in free-text submission and
    every agent-drafted outbound message before it's shown to a coach as a
    normal draft or sent to a client — a hit here should always escalate to
    the coach directly, never be answered or drafted around."""
    if not text:
        return False
    return any(pattern.search(text) for pattern in _COMPILED)
