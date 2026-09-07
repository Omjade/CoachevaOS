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
  /** The single pain point this coach's own feedback is about — one per
      testimonial, not a generic 4-item list repeated for everyone. */
  painPoint: PainPoint;
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
    painPoint: { stat: "Nothing lost", label: "Progress photos, weigh-ins, and last session's notes, always at hand" },
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
    painPoint: { stat: "Premium feel", label: "A portal that makes your practice look like the real business it is" },
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
    painPoint: { stat: "Caught early", label: "A client gone quiet mid-search, before their momentum dies" },
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
    painPoint: { stat: "8-15 hrs saved", label: "Every week — less admin work, more focus on coaching" },
  },
];
