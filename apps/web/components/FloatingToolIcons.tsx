"use client";

import { motion } from "framer-motion";
import {
  TableIcon as Table,
  EnvelopeSimpleIcon as EnvelopeSimple,
  WhatsappLogoIcon as WhatsappLogo,
  CalendarBlankIcon as CalendarBlank,
  CircleWavyCheckIcon as CircleWavyCheck,
} from "@phosphor-icons/react";

export type FloatingIconKey = "sheet" | "email" | "chat" | "calendar" | "brand";

const ICONS: Record<
  FloatingIconKey,
  {
    Icon: typeof Table;
    color: string;
    top: string;
    right: string;
    rotate: number;
    duration: number;
    accent?: boolean;
  }
> = {
  sheet: { Icon: Table, color: "#1fae5c", top: "18%", right: "13%", rotate: -8, duration: 3.4 },
  email: { Icon: EnvelopeSimple, color: "#2f7fe0", top: "34%", right: "1%", rotate: 6, duration: 4.1 },
  chat: { Icon: WhatsappLogo, color: "#25d366", top: "50%", right: "9%", rotate: -4, duration: 3.7 },
  calendar: { Icon: CalendarBlank, color: "#6b4fe0", top: "8%", right: "0%", rotate: 5, duration: 3.9 },
  brand: {
    Icon: CircleWavyCheck,
    color: "#ffffff",
    top: "40%",
    right: "20%",
    rotate: 0,
    duration: 3.2,
    accent: true,
  },
};

export default function FloatingToolIcons({
  include = ["sheet", "email", "chat", "calendar", "brand"],
}: {
  include?: FloatingIconKey[];
}) {
  return (
    <>
      {include.map((key, i) => {
        const { Icon, color, top, right, rotate, duration, accent } = ICONS[key];
        return (
          <motion.div
            key={key}
            className={`absolute z-10 hidden items-center justify-center rounded-xl shadow-lg sm:flex ${
              accent ? "h-13 w-13 bg-accent-600" : "h-11 w-11 bg-white"
            }`}
            style={{ top, right }}
            initial={{ opacity: 0, scale: 0.6, rotate }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: [rotate, rotate + 3, rotate],
              y: [0, -9, 0],
            }}
            transition={{
              opacity: { duration: 0.5, delay: 0.5 + i * 0.1 },
              scale: { duration: 0.5, delay: 0.5 + i * 0.1 },
              rotate: { duration, repeat: Infinity, repeatType: "mirror", delay: 0.9 + i * 0.15 },
              y: { duration, repeat: Infinity, repeatType: "mirror", delay: 0.9 + i * 0.15 },
            }}
          >
            <Icon className={accent ? "h-6 w-6 text-white" : "h-5 w-5"} weight="fill" style={accent ? undefined : { color }} />
          </motion.div>
        );
      })}
    </>
  );
}
