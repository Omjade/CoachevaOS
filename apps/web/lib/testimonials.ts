export interface PainPoint {
  stat: string;
  label: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  location: string;
  /** 0-100 percent position over /Black WOrld.png, used by CoachMapCarousel's pin. */
  mapX: number;
  mapY: number;
  /** Path under /public. Optional — falls back to an initials circle when unset. */
  photoUrl?: string;
  /** 4 niche-relevant pain points CoachevaOS solves, shown below the quote —
      switches with the active testimonial so the space stays relevant to
      whichever coaching niche is currently on screen. */
  painPoints: PainPoint[];
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "maya",
    quote: "I finally have one place to open every morning instead of five.",
    name: "Maya Torres",
    role: "Fitness coach",
    location: "Austin, TX",
    mapX: 24,
    mapY: 46,
    photoUrl: "/Professional Fitness Portrait Card.png",
    painPoints: [
      { stat: "8-15 hrs saved", label: "Every week — less admin work, more focus on coaching" },
      { stat: "Premium feel", label: "A branded portal that makes clients feel like your VIPs" },
      { stat: "Nothing lost", label: "Progress photos, weigh-ins, and last session's notes, always at hand" },
      { stat: "Caught early", label: "A client going quiet, before they quietly disappear" },
    ],
  },
  {
    id: "daniel",
    quote: "My clients feel the difference, everything's in one place now.",
    name: "Daniel Osei",
    role: "Business coach",
    location: "Toronto, ON",
    mapX: 27,
    mapY: 34,
    photoUrl: "/daniel-osei-business-coach.png",
    painPoints: [
      { stat: "8-15 hrs saved", label: "Every week — less admin work, more focus on coaching" },
      { stat: "Premium feel", label: "A portal that makes your practice look like the real business it is" },
      { stat: "Nothing lost", label: "A lead's context, a client's history, a follow-up you meant to send" },
      { stat: "Caught early", label: "A cold lead or a slipping client, before it costs you the deal" },
    ],
  },
  {
    id: "priya",
    quote: "The AI briefing tells me exactly who needs me today, before I even open my inbox.",
    name: "Priya Nair",
    role: "Career coach",
    location: "London, UK",
    mapX: 48,
    mapY: 30,
    photoUrl: "/career-coach-priya-nair.png",
    painPoints: [
      { stat: "8-15 hrs saved", label: "Every week — less admin work, more focus on coaching" },
      { stat: "Premium feel", label: "A portal that makes clients feel genuinely supported, not just scheduled" },
      { stat: "Nothing lost", label: "What a client told you last session, or where their search stands" },
      { stat: "Caught early", label: "A client gone quiet mid-search, before their momentum dies" },
    ],
  },
  {
    id: "leo",
    quote: "The work gets lighter when your coaching context stays connected.",
    name: "Leo Whitfield",
    role: "Executive coach",
    location: "Sydney, AU",
    mapX: 87,
    mapY: 78,
    photoUrl: "/leo-whitfield-executive-coach.png",
    painPoints: [
      { stat: "8-15 hrs saved", label: "Every week — less admin work, more focus on coaching" },
      { stat: "Premium feel", label: "A private, polished portal that matches your clients' expectations" },
      { stat: "Nothing lost", label: "A leadership note, a team update, context between sessions" },
      { stat: "Caught early", label: "A senior client quietly drifting, before the relationship cools" },
    ],
  },
];
