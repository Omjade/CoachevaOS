export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  location: string;
  /** 0-100 percent position over /Black WOrld.png, used by CoachMapCarousel's pin. */
  mapX: number;
  mapY: number;
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
  },
  {
    id: "daniel",
    quote: "My clients feel the difference — everything's in one place now.",
    name: "Daniel Osei",
    role: "Business coach",
    location: "Toronto, ON",
    mapX: 27,
    mapY: 34,
  },
  {
    id: "priya",
    quote: "The AI briefing tells me exactly who needs me today, before I even open my inbox.",
    name: "Priya Nair",
    role: "Career coach",
    location: "London, UK",
    mapX: 48,
    mapY: 30,
  },
  {
    id: "leo",
    quote: "The work gets lighter when your coaching context stays connected.",
    name: "Leo Whitfield",
    role: "Executive coach",
    location: "Sydney, AU",
    mapX: 87,
    mapY: 78,
  },
];
