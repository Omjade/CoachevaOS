"""Starter Custom Field templates per coaching niche — so a coach's workspace
looks useful from the first click instead of an empty settings page. Keyed by
the same niche values used in the onboarding niche list
(apps/web/app/onboarding/page.tsx's NICHES). Every niche gets something
genuinely relevant; "other"/unrecognized niches fall back to a short generic set."""

from app.models.enums import CustomFieldType


def resolve_niche(client_niche: str | None, coach_niche: str | None) -> str | None:
    """The client's own niche wins when set (a coach running multiple
    practices, e.g. fitness + nutrition, tags each client correctly);
    otherwise falls back to the coach's own default niche — an existing
    client with nothing set keeps behaving exactly as before this existed.
    Takes plain strings, not the Client/CoachProfile models themselves, so
    this module doesn't need to import either (avoids any risk of a
    circular import with app.models.clients/app.models.users)."""
    return client_niche or coach_niche


class FieldTemplate:
    def __init__(
        self,
        name: str,
        field_type: CustomFieldType,
        unit: str | None = None,
        options: list[str] | None = None,
    ):
        self.name = name
        self.field_type = field_type
        self.unit = unit
        self.options = options


class GroupTemplate:
    def __init__(self, name: str, fields: list[FieldTemplate]):
        self.name = name
        self.fields = fields


NICHE_TEMPLATES: dict[str, list[GroupTemplate]] = {
    "fitness": [
        GroupTemplate(
            "Fitness Assessment",
            [
                FieldTemplate("Body weight", CustomFieldType.number, unit="kg"),
                FieldTemplate("Body fat %", CustomFieldType.percentage),
                FieldTemplate("Training experience", CustomFieldType.dropdown, options=["Beginner", "Intermediate", "Advanced"]),
                FieldTemplate("Injuries / limitations", CustomFieldType.textarea),
            ],
        ),
    ],
    "nutrition": [
        GroupTemplate(
            "Nutrition Profile",
            [
                FieldTemplate("Current weight", CustomFieldType.number, unit="kg"),
                FieldTemplate("Dietary preference", CustomFieldType.dropdown, options=["Omnivore", "Vegetarian", "Vegan", "Other"]),
                FieldTemplate("Allergies / restrictions", CustomFieldType.textarea),
                FieldTemplate("Daily calorie target", CustomFieldType.number, unit="kcal"),
            ],
        ),
    ],
    "business": [
        GroupTemplate(
            "Business Profile",
            [
                FieldTemplate("Monthly revenue", CustomFieldType.currency, unit="$"),
                FieldTemplate("Team size", CustomFieldType.number),
                FieldTemplate("Active leads", CustomFieldType.number),
                FieldTemplate("Main bottleneck", CustomFieldType.textarea),
            ],
        ),
    ],
    "career": [
        GroupTemplate(
            "Career Profile",
            [
                FieldTemplate("Current role", CustomFieldType.text),
                FieldTemplate("Target role", CustomFieldType.text),
                FieldTemplate("Target salary", CustomFieldType.currency, unit="$"),
                FieldTemplate("Applications sent", CustomFieldType.number),
            ],
        ),
    ],
    "life": [
        GroupTemplate(
            "Life Coaching Profile",
            [
                FieldTemplate("Main focus area", CustomFieldType.text),
                FieldTemplate("Confidence level", CustomFieldType.rating),
                FieldTemplate("Current challenges", CustomFieldType.textarea),
            ],
        ),
    ],
    "executive": [
        GroupTemplate(
            "Executive Profile",
            [
                FieldTemplate("Current title", CustomFieldType.text),
                FieldTemplate("Team size managed", CustomFieldType.number),
                FieldTemplate("Leadership focus area", CustomFieldType.textarea),
            ],
        ),
    ],
    "relationship": [
        GroupTemplate(
            "Relationship Profile",
            [
                FieldTemplate("Relationship status", CustomFieldType.text),
                FieldTemplate("Main focus area", CustomFieldType.textarea),
            ],
        ),
    ],
    "mindset": [
        GroupTemplate(
            "Mindset Profile",
            [
                FieldTemplate("Confidence level", CustomFieldType.rating),
                FieldTemplate("Stress level", CustomFieldType.rating),
                FieldTemplate("Current challenges", CustomFieldType.textarea),
            ],
        ),
    ],
    "academic": [
        GroupTemplate(
            "Academic Profile",
            [
                FieldTemplate("Current grade/level", CustomFieldType.text),
                FieldTemplate("Target outcome", CustomFieldType.text),
                FieldTemplate("Study hours per week", CustomFieldType.number, unit="hrs"),
            ],
        ),
    ],
    "sports": [
        GroupTemplate(
            "Sports Performance Profile",
            [
                FieldTemplate("Sport / discipline", CustomFieldType.text),
                FieldTemplate("Current performance level", CustomFieldType.text),
                FieldTemplate("Injuries / limitations", CustomFieldType.textarea),
            ],
        ),
    ],
    "parenting": [
        GroupTemplate(
            "Family Profile",
            [
                FieldTemplate("Number of children", CustomFieldType.number),
                FieldTemplate("Main focus area", CustomFieldType.textarea),
            ],
        ),
    ],
    "financial": [
        GroupTemplate(
            "Financial Profile",
            [
                FieldTemplate("Monthly income", CustomFieldType.currency, unit="$"),
                FieldTemplate("Savings goal", CustomFieldType.currency, unit="$"),
                FieldTemplate("Main financial challenge", CustomFieldType.textarea),
            ],
        ),
    ],
}

DEFAULT_TEMPLATE: list[GroupTemplate] = [
    GroupTemplate(
        "Client Profile",
        [
            FieldTemplate("Main goal focus", CustomFieldType.textarea),
            FieldTemplate("Key metric to track", CustomFieldType.text),
            FieldTemplate("Preferred check-in cadence", CustomFieldType.dropdown, options=["Weekly", "Biweekly", "Monthly"]),
            FieldTemplate("Target date", CustomFieldType.date),
            FieldTemplate("Notes", CustomFieldType.textarea),
        ],
    ),
]


def template_for_niche(niche: str | None) -> list[GroupTemplate]:
    if niche and niche in NICHE_TEMPLATES:
        return NICHE_TEMPLATES[niche]
    return DEFAULT_TEMPLATE


class MetricTemplate:
    def __init__(self, name: str, unit: str | None = None, category: str | None = None):
        self.name = name
        self.unit = unit
        self.category = category


NICHE_METRIC_TEMPLATES: dict[str, list[MetricTemplate]] = {
    "fitness": [
        MetricTemplate("Body weight", unit="kg", category="Fitness"),
        MetricTemplate("Steps", unit="steps", category="Fitness"),
        MetricTemplate("Sleep hours", unit="hrs", category="Fitness"),
    ],
    "nutrition": [
        MetricTemplate("Body weight", unit="kg", category="Nutrition"),
        MetricTemplate("Daily calories", unit="kcal", category="Nutrition"),
    ],
    "business": [
        MetricTemplate("Monthly revenue", unit="$", category="Business"),
        MetricTemplate("Active leads", category="Business"),
        MetricTemplate("Conversion rate", unit="%", category="Business"),
    ],
    "career": [
        MetricTemplate("Applications sent", category="Career"),
        MetricTemplate("Interviews", category="Career"),
    ],
    "life": [
        MetricTemplate("Confidence level", unit="/10", category="Life"),
    ],
    "executive": [
        MetricTemplate("Team engagement score", unit="/10", category="Leadership"),
    ],
    "relationship": [
        MetricTemplate("Relationship satisfaction", unit="/10", category="Relationship"),
    ],
    "mindset": [
        MetricTemplate("Stress level", unit="/10", category="Mindset"),
        MetricTemplate("Confidence level", unit="/10", category="Mindset"),
    ],
    "academic": [
        MetricTemplate("Study hours", unit="hrs", category="Academic"),
    ],
    "sports": [
        MetricTemplate("Performance score", unit="/10", category="Sports"),
    ],
    "parenting": [
        MetricTemplate("Family time", unit="hrs/week", category="Family"),
    ],
    "financial": [
        MetricTemplate("Monthly savings", unit="$", category="Financial"),
        MetricTemplate("Net worth", unit="$", category="Financial"),
    ],
}

DEFAULT_METRIC_TEMPLATE: list[MetricTemplate] = [
    MetricTemplate("Progress score", unit="/10"),
]


def metric_template_for_niche(niche: str | None) -> list[MetricTemplate]:
    if niche and niche in NICHE_METRIC_TEMPLATES:
        return NICHE_METRIC_TEMPLATES[niche]
    return DEFAULT_METRIC_TEMPLATE
