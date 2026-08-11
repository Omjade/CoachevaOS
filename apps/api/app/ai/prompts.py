"""Prompt templates per docs/PRD.md §10 AI Architecture, adapted to OpenAI's
system/user message split. Each function returns (system_prompt, user_prompt)."""


def daily_briefing_prompt(coach_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"You are {coach_name}'s coaching assistant. Given today's meetings, messages with "
        "no reply in 5+ days, subscriptions expiring within 3 days, leads awaiting follow-up, "
        "and clients who completed all tasks — write a warm, specific 4-6 bullet morning "
        "briefing. Recommend one concrete next action per flagged item. Return plain text, "
        "one bullet per line starting with '- '."
    )
    return system, context_json


def client_risk_prompt(client_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"Given {client_name}'s last-reply date, attendance trend and latest check-in "
        "mood/progress, flag risk level (low/medium/high) and a one-line reason a coach "
        "could act on today. Return JSON: {\"level\": \"low\"|\"medium\"|\"high\", \"reason\": string}."
    )
    return system, context_json


def session_note_to_followup_prompt(client_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"Given this session note/transcript and {client_name}'s program and history, "
        "produce JSON: {\"summary\": string, \"action_items\": string[3-5], "
        "\"draft_message\": a warm, specific follow-up in the coach's voice}."
    )
    return system, context_json


def smart_reply_prompt(client_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"Given the last messages in this thread and {client_name}'s current progress/program, "
        "draft one reply the coach could send as-is or edit. Return JSON: {\"draft\": string}."
    )
    return system, context_json


def progress_insight_prompt(client_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"Given {client_name}'s task completion rate, recent check-ins, and attendance, "
        "write one plain-language paragraph: are they ahead, on, or behind pace, and why — "
        "for the client to read directly. Return plain text, no preamble."
    )
    return system, context_json
