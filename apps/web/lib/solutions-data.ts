import type { FAQItem } from "@/components/FAQAccordion";

export interface NicheSolution {
  value: string;
  /** e.g. "life coaching software", the primary keyword this page targets. */
  keyword: string;
  directAnswer: string;
  pain: string;
  outcome: string;
  tracks: string[];
  faq: FAQItem[];
  /** Section headers folding in low-volume persona/sub-niche search terms, only fitness uses this today. */
  personaTerms?: string[];
  /** Slug of a deep-dive blog post covering this niche's persona terms in full, for bidirectional linking. */
  relatedBlogSlug?: string;
}

// Grounded in the real per-niche custom-field/metric templates
// (apps/api/app/custom_field_templates.py) rather than generic filler, each
// "tracks" list is what that niche's coach actually gets pre-loaded on day
// one, not invented marketing copy.
export const SOLUTIONS: NicheSolution[] = [
  {
    value: "fitness",
    keyword: "online fitness coaching software",
    directAnswer:
      "CoachevaOS is client management software for fitness and personal training coaches: a branded client portal, session scheduling, payment tracking, and an AI daily briefing that flags who's gone quiet, built alongside your existing workout-programming tool, not as a replacement for one.",
    pain:
      "Between check-ins, scheduling, payment reminders, and actually coaching, admin eats the hours you'd rather spend programming or in session.",
    outcome:
      "Every client's check-ins, progress, and payment status live in one dashboard, and the AI daily briefing tells you who's fallen quiet before they quietly churn.",
    tracks: ["Body weight", "Body fat %", "Training experience", "Injuries / limitations", "Steps", "Sleep hours"],
    personaTerms: [
      "Online fitness coaches & online personal trainers",
      "Fitness trainers running their own coaching business",
      "Weight-loss & fat-loss coaches",
      "Body transformation coaches",
      "Women's fitness & glute-program coaches",
      "Men's fitness coaches",
      "Functional fitness & mobility coaches",
      "Running, marathon & triathlon coaches",
      "Health and fitness coaches",
    ],
    relatedBlogSlug: "software-for-online-fitness-coaches-and-personal-trainers",
    faq: [
      {
        q: "Does CoachevaOS include a workout builder or exercise library?",
        a: "No, CoachevaOS is client and practice management: portal, scheduling, payments, check-ins, and AI risk alerts. It's built to run alongside your existing workout-programming tool, not replace it.",
      },
      {
        q: "Can I track client body weight, body fat %, and injuries?",
        a: "Yes, a fitness coach's workspace comes pre-loaded with body weight, body fat %, training experience, and injury/limitation fields on day one, fully editable.",
      },
    ],
  },
  {
    value: "nutrition",
    keyword: "health coaching software",
    directAnswer:
      "CoachevaOS is health and nutrition coaching software: a branded client portal, check-in tracking for weight and daily calories, and an AI daily briefing that surfaces which clients need a nudge, all in one dashboard instead of a spreadsheet and a messaging app.",
    pain:
      "Tracking dietary preferences, allergies, and daily check-ins across a spreadsheet and a chat app means details fall through the cracks.",
    outcome:
      "Every client's dietary profile, weight trend, and calorie target live in one place, with an AI briefing flagging who's due for a check-in.",
    tracks: ["Current weight", "Dietary preference", "Allergies / restrictions", "Daily calorie target"],
    personaTerms: [
      "Health coaches & wellness coaches",
      "Holistic health coaches",
      "Wellness practitioners",
      "Lifestyle coaches",
      "Nutrition and wellness coaches",
      "Health and wellness coaches",
    ],
    relatedBlogSlug: "software-for-health-wellness-and-nutrition-coaches",
    faq: [
      {
        q: "Can clients log allergies and dietary restrictions?",
        a: "Yes, a nutrition coach's workspace comes pre-loaded with dietary preference and allergy/restriction fields, plus weight and daily calorie targets.",
      },
    ],
  },
  {
    value: "business",
    keyword: "business coaching software",
    directAnswer:
      "CoachevaOS is business coaching software for tracking client revenue, active leads, and conversion rate in one dashboard, with an AI daily briefing that flags which clients need attention and a lead pipeline for growing your own coaching practice at the same time.",
    pain:
      "Between your own leads and every client's revenue/team metrics, running a business-coaching practice on a spreadsheet means you're the one falling behind on follow-up.",
    outcome:
      "Client revenue, team size, and active leads are tracked per client, while your own lead pipeline and AI daily briefing keep your own practice's growth on track too.",
    tracks: ["Monthly revenue", "Team size", "Active leads", "Conversion rate", "Main bottleneck"],
    personaTerms: [
      "Entrepreneur & startup coaches",
      "Small business coaches",
      "Business growth & business strategy coaches",
      "Sales coaches",
      "Marketing coaches",
      "CEO coaches",
      "Wellness entrepreneur coaches",
    ],
    relatedBlogSlug: "software-for-business-coaches-entrepreneur-and-sales-coaches",
    faq: [
      {
        q: "Can I track a client's revenue and lead metrics?",
        a: "Yes, a business coach's workspace comes pre-loaded with monthly revenue, team size, active leads, and conversion rate fields per client.",
      },
      {
        q: "Does CoachevaOS help me grow my own coaching business too?",
        a: "Yes, the same lead pipeline and AI daily briefing that track your clients' businesses also run your own: a Kanban lead board, CSV import, and a morning briefing on who needs your attention.",
      },
    ],
  },
  {
    value: "career",
    keyword: "career coaching platform",
    directAnswer:
      "CoachevaOS is a career coaching platform for tracking applications sent, interviews, and target-role progress per client, with a branded portal for check-ins and an AI daily briefing that flags who's stalled in their job search.",
    pain:
      "Job searches move in bursts. A client who was active last week can go quiet for a month, and it's easy to miss until they've lost momentum.",
    outcome:
      "Applications, interviews, and target-role/salary progress are tracked per client, with an AI briefing flagging who's gone quiet before they lose momentum.",
    tracks: ["Current role", "Target role", "Target salary", "Applications sent"],
    personaTerms: [
      "Professional development coaches",
      "Workplace coaches",
      "Interview coaches",
      "Job search coaches",
      "Corporate coaches",
    ],
    relatedBlogSlug: "software-for-career-and-professional-development-coaches",
    faq: [
      {
        q: "Can I track how many applications and interviews a client has had?",
        a: "Yes, a career coach's workspace comes pre-loaded with applications-sent and interview-count metrics alongside current/target role and target salary fields.",
      },
    ],
  },
  {
    value: "life",
    keyword: "life coaching software",
    directAnswer:
      "CoachevaOS is life coaching software for tracking a client's main focus area, confidence level, and current challenges in one branded portal, with an AI daily briefing that flags who needs a check-in before a session slips.",
    pain:
      "Life coaching is personal and often non-linear. Tracking a client's evolving focus areas and challenges in scattered notes makes it hard to see real progress.",
    outcome:
      "A client's focus area, confidence rating, and challenges are logged in one place, with progress visible over time instead of buried in old notes.",
    tracks: ["Main focus area", "Confidence level", "Current challenges"],
    personaTerms: [
      "Productivity coaches",
      "Confidence coaches",
      "Personal development coaches",
      "Accountability coaches",
      "Public speaking coaches",
      "Success coaches",
      "Men's coaches & women's coaches",
    ],
    relatedBlogSlug: "software-for-life-and-personal-development-coaches",
    faq: [
      {
        q: "How does CoachevaOS track a life-coaching client's progress?",
        a: "Through a structured goal list, a confidence-level metric you can log over time, and free-text focus-area/challenge fields, visible as a real timeline, not scattered notes.",
      },
    ],
  },
  {
    value: "executive",
    keyword: "executive coaching software",
    directAnswer:
      "CoachevaOS is executive coaching software for tracking a client's leadership focus area, team size managed, and team engagement score, with confidentiality-appropriate client portals and an AI daily briefing across your executive roster.",
    pain:
      "Executive clients expect discretion and structure. An ad hoc mix of email and a shared doc doesn't read as a serious operating system for the relationship.",
    outcome:
      "Each executive client's leadership focus, team size, and engagement score are tracked in a branded, private portal, with an AI briefing keeping your whole roster visible.",
    tracks: ["Current title", "Team size managed", "Leadership focus area", "Team engagement score"],
    personaTerms: ["Leadership coaches"],
    relatedBlogSlug: "software-for-executive-and-leadership-coaches",
    faq: [
      {
        q: "Is client data kept private and separate per executive client?",
        a: "Yes, every client's portal, notes, and data are scoped entirely to that client and your own account; nothing is shared across clients or visible to anyone else.",
      },
    ],
  },
  {
    value: "relationship",
    keyword: "relationship coaching software",
    directAnswer:
      "CoachevaOS is relationship coaching software for tracking a client's relationship status, satisfaction score, and main focus area in a private branded portal, with an AI daily briefing across your client base.",
    pain:
      "Relationship coaching conversations are sensitive and easy to lose track of across scattered messages and notes.",
    outcome:
      "Relationship status, satisfaction score, and focus areas are tracked per client in one private, branded portal, with session notes turning into structured follow-ups.",
    tracks: ["Relationship status", "Relationship satisfaction", "Main focus area"],
    personaTerms: ["Dating coaches", "Communication coaches"],
    faq: [
      {
        q: "Can I log a relationship-satisfaction score over time?",
        a: "Yes, relationship coaching clients get a satisfaction metric you can log at each check-in, visible as a trend rather than a one-time snapshot.",
      },
    ],
  },
  {
    value: "mindset",
    keyword: "wellness coaching app",
    directAnswer:
      "CoachevaOS is a wellness and mindset coaching app for tracking a client's confidence and stress levels alongside current challenges, with a branded client portal and an AI daily briefing across your roster.",
    pain:
      "Mindset and wellness progress is genuinely hard to quantify, which makes it easy for a coach's own tracking to fall back on memory alone.",
    outcome:
      "Confidence and stress-level ratings are logged per check-in, turning subjective progress into a real, visible trend over time.",
    tracks: ["Confidence level", "Stress level", "Current challenges"],
    personaTerms: ["ADHD coaches", "Wellness & mindset coaches"],
    faq: [
      {
        q: "How do you track subjective progress like confidence or stress?",
        a: "As simple rated check-ins (e.g. a 1-10 scale) logged over time, so trend direction is visible even when progress is inherently subjective.",
      },
    ],
  },
  {
    value: "academic",
    keyword: "academic coaching software",
    directAnswer:
      "CoachevaOS is academic coaching software for tracking a student's current grade/level, target outcome, and weekly study hours, with a branded portal and an AI daily briefing flagging who's fallen behind.",
    pain:
      "Study coaching often runs alongside a school calendar of deadlines that don't wait for a missed check-in to be noticed.",
    outcome:
      "Current level, target outcome, and study hours are tracked per student, with an AI briefing flagging anyone who's gone quiet before a deadline.",
    tracks: ["Current grade/level", "Target outcome", "Study hours per week"],
    faq: [
      {
        q: "Can I track a student's weekly study hours?",
        a: "Yes, academic coaching clients get a study-hours-per-week metric alongside current level and target-outcome fields, pre-loaded from day one.",
      },
    ],
  },
  {
    value: "sports",
    keyword: "sports performance coaching software",
    directAnswer:
      "CoachevaOS is sports performance coaching software for tracking an athlete's discipline, current performance level, and injuries/limitations in one client portal, with an AI daily briefing across your roster.",
    pain:
      "Performance coaching spans training blocks, injuries, and competition schedules that are easy to lose track of across separate tools.",
    outcome:
      "Discipline, performance level, and injury history are tracked per athlete, with a performance-score metric visible as a real trend.",
    tracks: ["Sport / discipline", "Current performance level", "Injuries / limitations", "Performance score"],
    personaTerms: [
      "Strength coaches & strength and conditioning coaches",
      "Performance coaches",
      "Sports performance coaches",
      "Athletic performance coaches",
    ],
    faq: [
      {
        q: "Can I track an athlete's injury history alongside their performance?",
        a: "Yes, sports-performance clients get injury/limitation fields alongside a performance-score metric you can log over a training cycle.",
      },
    ],
  },
  {
    value: "parenting",
    keyword: "parenting coaching software",
    directAnswer:
      "CoachevaOS is parenting and family coaching software for tracking family size, weekly family time, and a family's main focus area in a private branded portal, with an AI daily briefing across your client families.",
    pain:
      "Family coaching context is personal and easy to lose across scattered notes between sessions spread weeks apart.",
    outcome:
      "Family size, weekly family time, and focus areas are tracked per family, so context carries forward between sessions instead of resetting each time.",
    tracks: ["Number of children", "Main focus area", "Family time (hrs/week)"],
    faq: [
      {
        q: "Is family coaching data kept private?",
        a: "Yes, each family's portal and notes are scoped entirely to your account and that client; nothing is shared across families.",
      },
    ],
  },
  {
    value: "financial",
    keyword: "financial coaching software",
    directAnswer:
      "CoachevaOS is financial coaching software for tracking a client's monthly income, savings goal, and net worth in one branded portal, with an AI daily briefing flagging who needs a check-in on their financial plan.",
    pain:
      "Financial coaching progress is numeric and time-sensitive. A spreadsheet per client makes it hard to see your whole roster's status at a glance.",
    outcome:
      "Monthly income, savings goal, and net worth are tracked per client, with monthly-savings and net-worth metrics visible as a real trend.",
    tracks: ["Monthly income", "Savings goal", "Main financial challenge", "Net worth"],
    faq: [
      {
        q: "Can I track a client's net worth and savings goal over time?",
        a: "Yes, financial coaching clients get monthly-savings and net-worth metrics you can log at each check-in, alongside income and savings-goal fields.",
      },
    ],
  },
];

export function getSolution(value: string): NicheSolution | undefined {
  return SOLUTIONS.find((s) => s.value === value);
}
