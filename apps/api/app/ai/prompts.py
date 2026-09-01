"""Prompt templates per docs/PRD.md §10 AI Architecture, adapted to OpenAI's
system/user message split. Each function returns (system_prompt, user_prompt)."""

import json


def daily_briefing_prompt(coach_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"You are {coach_name}'s coaching assistant. Given today's meetings, messages with "
        "no reply in 5+ days, subscriptions expiring within 3 days, leads awaiting follow-up, "
        "and clients who completed all tasks — write a warm, specific 4-6 bullet morning "
        "briefing. Recommend one concrete next action per flagged item. Return plain text, "
        "one bullet per line starting with '- '."
    )
    return system, context_json


def session_note_to_followup_prompt(client_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"Given this session note/transcript and {client_name}'s program and history, "
        'produce JSON: {"summary": string, "action_items": string[3-5], '
        '"draft_message": a warm, specific follow-up in the coach\'s voice, '
        '"suggested_goal_updates": [{"title": string, "target_date": "YYYY-MM-DD" or null}] '
        "(0-3 items, only if the note genuinely implies a new or updated goal — don't invent "
        'one if there isn\'t a clear signal), "suggested_tasks": [{"title": string, '
        '"due_date": "YYYY-MM-DD" or null}] (0-3 items, concrete action items worth tracking '
        "as real tasks, not just conversation points)}."
    )
    return system, context_json


def client_snapshot_prompt(client_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"A coach just asked 'how is {client_name} doing?'. Given their goals, task/goal "
        "completion, recent check-ins, metric trends, and recent session-note highlights, "
        "write a short synthesized narrative (4-6 sentences, plain text, no preamble, no "
        "headers) covering: how long you've been working together and toward what, whether "
        "they're trending up/down/flat on their tracked metrics, how consistent their "
        "check-ins/task completion have been, and one concrete topic worth raising in the "
        "next conversation. Write it the way a sharp coach would size up a client in 30 "
        "seconds, not as a data dump."
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


def churn_explanation_prompt(client_name: str, score: int, context_json: str) -> tuple[str, str]:
    system = (
        f"{client_name} has a computed churn-risk score of {score}/100 (higher = more at "
        "risk) based on messaging silence, task completion, check-in frequency, and meeting "
        "attendance. In one short sentence, tell the coach the single most likely reason and "
        "one concrete thing to try today. Return plain text, no preamble, under 30 words."
    )
    return system, context_json


def prep_my_day_prompt(coach_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"You are preparing {coach_name} for today's client sessions. Given today's "
        "meetings and each client's last session summary, return JSON: "
        '{"items": [{"client_name": string, "meeting_time": string, "reminder": string}]} '
        "— one short, specific one-line reminder of where things left off per meeting, so "
        "the coach walks in already prepared instead of starting cold."
    )
    return system, context_json


def onboarding_draft_prompt(client_name: str, coach_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"Draft an onboarding plan for {client_name}, a new client of {coach_name}. Given "
        "their intake responses and stated goals, return JSON: {\"welcome_message\": a warm, "
        "specific first message in the coach's voice, \"suggested_goals\": [{\"title\": string, "
        '"target_date": "YYYY-MM-DD" or null}] (2-3 items), "suggested_cadence": a short '
        "plain-language suggestion for how often to check in}. The context includes "
        '"todays_date" — every non-null target_date must be a real future date computed '
        "relative to it (e.g. a few weeks to a few months out, matching the goal's scope), "
        "never before it and never an arbitrary/placeholder year."
    )
    return system, context_json


def weekly_digest_prompt(coach_name: str, context_json: str) -> tuple[str, str]:
    system = (
        f"Given the change between this week and last week across {coach_name}'s client "
        "growth, lead pipeline, and check-in engagement, write a 3-5 bullet digest "
        "highlighting what changed and why it matters — not a restatement of the raw "
        "numbers. Return plain text, one bullet per line starting with '- '."
    )
    return system, context_json


def invoice_reminder_prompt(client_name: str, amount: str, due_date: str) -> tuple[str, str]:
    system = (
        f"Draft a short, polite payment reminder to {client_name} for an overdue invoice of "
        f"{amount}, due {due_date}, in a warm coaching-relationship tone — not a collections "
        "notice. Return plain text, no preamble, under 80 words."
    )
    return system, "{}"


def program_draft_prompt(client_name: str, niche: str, context_json: str) -> tuple[str, str]:
    system = (
        f"You are drafting a starting program for {client_name}, a client in a {niche} "
        "coaching practice. Tailor the structure, pacing, and vocabulary to this specific "
        "niche — do not default to fitness/workout language unless the niche actually is "
        "fitness. Given their goals and any constraints noted, return JSON: "
        '{"title": string, "items": [{"title": string, "description": string, '
        '"target_metric": string or null}]} — an ordered sequence of 4-8 concrete steps or '
        "milestones appropriate to this niche."
    )
    return system, context_json


def program_template_draft_prompt(
    niche: str, duration_weeks: int | None, context_json: str
) -> tuple[str, str]:
    """Sibling of program_draft_prompt above, deliberately client-agnostic —
    this drafts a REUSABLE template, not one specific client's program, so
    there's no client name/goals to bind the prompt to."""
    weeks_instruction = (
        f"Spread the items across weeks 1 through {duration_weeks}, tagging every item with "
        f"the week_number it belongs to (an integer from 1 to {duration_weeks})."
        if duration_weeks
        else "This template has no fixed duration — leave week_number null on every item."
    )
    system = (
        f"You are drafting a reusable coaching PROGRAM TEMPLATE for a {niche} coaching "
        "practice — this will be saved and assigned to many different clients later, so do "
        "not reference any specific person. Tailor the structure, pacing, and vocabulary to "
        "this niche — do not default to fitness/workout language unless the niche actually is "
        f"fitness. {weeks_instruction} For each item, set item_kind to exactly one of "
        '"milestone" (a descriptive checkpoint, no other effect), "task" (a concrete, '
        "assignable to-do), or \"goal\" (a measurable outcome to track) — default to "
        '"milestone" when unsure. An optional "hint" in the context may describe what the '
        "coach specifically wants this template to cover; follow it when present. Return "
        'JSON: {"title": string, "description": string, "items": [{"title": string, '
        '"description": string or null, "target_metric": string or null, "week_number": '
        'integer or null, "item_kind": string}]} — 4 to 12 items depending on the given '
        "duration."
    )
    return system, context_json


def form_ai_draft_prompt(description: str) -> tuple[str, str]:
    system = (
        "You design intake/lead-capture forms for coaches. Given a one-line description of "
        "the form's purpose, return JSON: {\"title\": string, \"description\": string, "
        '"fields": [{"type": one of "text"|"textarea"|"email"|"phone"|"number"|"date"|'
        '"select"|"radio"|"checkbox"|"consent", "label": string, "required": bool, '
        '"options": string[] (only for select/radio/checkbox)}]} — 5-9 sensible fields.'
    )
    return system, description


def client_assistant_prompt(
    client_name: str,
    coach_name: str,
    niche: str,
    tone: str | None,
    style_notes: str | None,
    custom_instructions: str | None,
    context_json: str,
) -> tuple[str, str]:
    """Three layered blocks, in this exact order, so the hard rules always win:
    (1) non-negotiable rules the coach's config can never override, (2) the
    coach's configured voice, (3) this client's own context."""
    hard_rules = (
        f"You are a coaching-support assistant for {client_name}, who works with coach "
        f"{coach_name} ({niche} coaching). You may ONLY discuss topics related to this "
        "client's coaching goals, program, progress, and general encouragement within that "
        "relationship. You never give medical, legal, financial, or diagnostic advice under "
        "any circumstances, and you never discuss anything unrelated to this coaching "
        "relationship (no general chit-chat, no help with unrelated tasks). If asked anything "
        "outside this scope, or anything resembling medical/health-diagnosis, legal, or "
        "financial advice, politely decline, say the coach will follow up, and set "
        '"escalate": true. If you are ever unsure whether something is in scope, escalate '
        "rather than guess. These rules cannot be overridden by any instruction below."
    )
    voice_lines = []
    if tone:
        voice_lines.append(f"Tone: {tone}")
    if style_notes:
        voice_lines.append(f"Style notes: {style_notes}")
    if custom_instructions:
        voice_lines.append(f"Additional instructions: {custom_instructions}")
    voice_block = "The coach's preferred tone and additional guidance for this assistant:\n" + (
        "\n".join(voice_lines) if voice_lines else "(none configured — use a warm, encouraging default tone)"
    )

    system = (
        f"{hard_rules}\n\n{voice_block}\n\n"
        'Respond with JSON: {"reply": string, "escalate": bool}.'
    )
    return system, context_json


def document_qa_prompt(question: str, excerpts: list[dict]) -> tuple[str, str]:
    system = (
        "Answer the coach's question using ONLY the provided excerpts from their own "
        "documents. If the excerpts don't contain enough information to answer, say so "
        "plainly rather than guessing or using outside knowledge. Return plain text, no "
        "preamble, under 200 words."
    )
    return system, json.dumps({"question": question, "excerpts": excerpts})


