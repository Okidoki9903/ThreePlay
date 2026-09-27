import { Atom, Boxes, Car, Crosshair, FlaskConical, Footprints, Gamepad2, Ghost, Joystick, Puzzle, Users, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  car: Car,
  crosshair: Crosshair,
  puzzle: Puzzle,
  footprints: Footprints,
  joystick: Joystick,
  atom: Atom,
  boxes: Boxes,
  ghost: Ghost,
  users: Users,
  "flask-conical": FlaskConical,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Gamepad2;
  return <Icon className={className} aria-hidden="true" />;
}
