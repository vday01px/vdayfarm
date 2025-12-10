import { motion } from "framer-motion";

interface DiceProps {
  value: number;
  isRolling?: boolean;
  size?: "sm" | "md" | "lg";
}

const dotPositions: Record<number, Array<{ top: string; left: string }>> = {
  1: [{ top: "50%", left: "50%" }],
  2: [
    { top: "25%", left: "25%" },
    { top: "75%", left: "75%" },
  ],
  3: [
    { top: "25%", left: "25%" },
    { top: "50%", left: "50%" },
    { top: "75%", left: "75%" },
  ],
  4: [
    { top: "25%", left: "25%" },
    { top: "25%", left: "75%" },
    { top: "75%", left: "25%" },
    { top: "75%", left: "75%" },
  ],
  5: [
    { top: "25%", left: "25%" },
    { top: "25%", left: "75%" },
    { top: "50%", left: "50%" },
    { top: "75%", left: "25%" },
    { top: "75%", left: "75%" },
  ],
  6: [
    { top: "25%", left: "25%" },
    { top: "25%", left: "75%" },
    { top: "50%", left: "25%" },
    { top: "50%", left: "75%" },
    { top: "75%", left: "25%" },
    { top: "75%", left: "75%" },
  ],
};

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

const dotSizes = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-3 h-3",
};

export function Dice({ value, isRolling = false, size = "md" }: DiceProps) {
  const clampedValue = Math.max(1, Math.min(6, value));
  const dots = dotPositions[clampedValue] || dotPositions[1];

  return (
    <motion.div
      className={`${sizeClasses[size]} relative rounded-md bg-gradient-to-br from-white to-gray-100 shadow-lg border border-gray-200`}
      animate={
        isRolling
          ? {
              rotateX: [0, 360, 720, 1080],
              rotateY: [0, 360, 720, 1080],
              scale: [1, 1.1, 1, 1.1, 1],
            }
          : { rotateX: 0, rotateY: 0, scale: 1 }
      }
      transition={
        isRolling
          ? { duration: 1.5, ease: "easeInOut" }
          : { duration: 0.3 }
      }
      style={{ transformStyle: "preserve-3d" }}
      data-testid={`dice-${value}`}
    >
      {dots.map((pos, index) => (
        <div
          key={index}
          className={`${dotSizes[size]} absolute bg-casino-red rounded-full transform -translate-x-1/2 -translate-y-1/2`}
          style={{ top: pos.top, left: pos.left }}
        />
      ))}
    </motion.div>
  );
}

interface DiceGroupProps {
  dice: [number, number, number];
  isRolling?: boolean;
  size?: "sm" | "md" | "lg";
}

export function DiceGroup({ dice, isRolling = false, size = "md" }: DiceGroupProps) {
  return (
    <div className="flex items-center justify-center gap-2" data-testid="dice-group">
      {dice.map((value, index) => (
        <Dice
          key={index}
          value={value}
          isRolling={isRolling}
          size={size}
        />
      ))}
    </div>
  );
}
