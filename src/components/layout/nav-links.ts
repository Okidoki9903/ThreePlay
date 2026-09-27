import { Dices, Gamepad2, Trophy, Upload } from "lucide-react";

export const NAV_LINKS = [
  { href: "/games", label: "Browse", icon: Gamepad2 },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/random", label: "Random game", icon: Dices },
  { href: "/submit", label: "Submit", icon: Upload },
] as const;
