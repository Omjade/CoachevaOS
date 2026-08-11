export interface NicheConfig {
  sessionLabel: string;
  goalLabel: string;
  testimonial: { quote: string; attribution: string };
}

const NICHE_CONFIG: Record<string, NicheConfig> = {
  fitness: {
    sessionLabel: "Strength check-in",
    goalLabel: "Fitness goal",
    testimonial: {
      quote: "I finally have one place to open every morning instead of five.",
      attribution: "Independent fitness coach",
    },
  },
  nutrition: {
    sessionLabel: "Nutrition check-in",
    goalLabel: "Nutrition goal",
    testimonial: {
      quote: "My clients feel the difference — everything's in one place now.",
      attribution: "Nutrition coach",
    },
  },
  business: {
    sessionLabel: "Founder check-in",
    goalLabel: "Business goal",
    testimonial: {
      quote: "My clients feel the difference — everything's in one place now.",
      attribution: "Business coach",
    },
  },
  career: {
    sessionLabel: "Mock interview",
    goalLabel: "Career goal",
    testimonial: {
      quote: "I finally have one place to open every morning instead of five.",
      attribution: "Career coach",
    },
  },
  life: {
    sessionLabel: "Life check-in",
    goalLabel: "Life goal",
    testimonial: {
      quote: "I finally have one place to open every morning instead of five.",
      attribution: "Life coach",
    },
  },
  executive: {
    sessionLabel: "Leadership check-in",
    goalLabel: "Leadership goal",
    testimonial: {
      quote: "My clients feel the difference — everything's in one place now.",
      attribution: "Executive coach",
    },
  },
  relationship: {
    sessionLabel: "Relationship check-in",
    goalLabel: "Relationship goal",
    testimonial: {
      quote: "I finally have one place to open every morning instead of five.",
      attribution: "Relationship coach",
    },
  },
  mindset: {
    sessionLabel: "Mindset check-in",
    goalLabel: "Wellness goal",
    testimonial: {
      quote: "I finally have one place to open every morning instead of five.",
      attribution: "Mindset & wellness coach",
    },
  },
  academic: {
    sessionLabel: "Study session",
    goalLabel: "Academic goal",
    testimonial: {
      quote: "My clients feel the difference — everything's in one place now.",
      attribution: "Academic coach",
    },
  },
  sports: {
    sessionLabel: "Performance check-in",
    goalLabel: "Performance goal",
    testimonial: {
      quote: "I finally have one place to open every morning instead of five.",
      attribution: "Sports performance coach",
    },
  },
  parenting: {
    sessionLabel: "Family check-in",
    goalLabel: "Parenting goal",
    testimonial: {
      quote: "My clients feel the difference — everything's in one place now.",
      attribution: "Parenting coach",
    },
  },
  financial: {
    sessionLabel: "Money check-in",
    goalLabel: "Financial goal",
    testimonial: {
      quote: "I finally have one place to open every morning instead of five.",
      attribution: "Financial coach",
    },
  },
};

const DEFAULT_CONFIG: NicheConfig = {
  sessionLabel: "Session",
  goalLabel: "Goal",
  testimonial: {
    quote: "I finally have one place to open every morning instead of five.",
    attribution: "Independent coach",
  },
};

export function getNicheConfig(niche: string | null | undefined): NicheConfig {
  return (niche && NICHE_CONFIG[niche]) || DEFAULT_CONFIG;
}
