import { Flame, Diamond, Trophy, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type VibeLabel = 'must-see' | 'geheimtipp' | 'trending' | 'neu';

interface VibeBadgeProps {
  label: VibeLabel;
  level?: 1 | 2 | 3;
  size?: 'sm' | 'md';
  className?: string;
}

const vibeConfig: Record<VibeLabel, { 
  text: string; 
  icon: typeof Flame; 
  bgClass: string;
  textClass: string;
}> = {
  'must-see': {
    text: 'Must-See',
    icon: Trophy,
    bgClass: 'bg-amber-100 border-amber-300',
    textClass: 'text-amber-800',
  },
  'geheimtipp': {
    text: 'Geheimtipp',
    icon: Diamond,
    bgClass: 'bg-purple-100 border-purple-300',
    textClass: 'text-purple-800',
  },
  'trending': {
    text: 'Trending',
    icon: Flame,
    bgClass: 'bg-red-100 border-red-300',
    textClass: 'text-red-800',
  },
  'neu': {
    text: 'Neu',
    icon: Sparkles,
    bgClass: 'bg-emerald-100 border-emerald-300',
    textClass: 'text-emerald-800',
  },
};

export const VibeBadge = ({ label, level = 2, size = 'sm', className }: VibeBadgeProps) => {
  const config = vibeConfig[label];
  if (!config) return null;

  const Icon = config.icon;
  const iconSize = size === 'sm' ? 12 : 14;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider",
        config.bgClass,
        config.textClass,
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        className
      )}
    >
      <Icon size={iconSize} className="flex-shrink-0" />
      <span>{config.text}</span>
    </div>
  );
};

interface VibeFlamesProps {
  level: 1 | 2 | 3;
  size?: 'sm' | 'md';
  className?: string;
}

export const VibeFlames = ({ level, size = 'sm', className }: VibeFlamesProps) => {
  const iconSize = size === 'sm' ? 14 : 18;

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3].map((i) => (
        <Zap
          key={i}
          size={iconSize}
          className={cn(
            "transition-colors",
            i <= level 
              ? "text-amber-500 fill-amber-400" 
              : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
};

// Helper to compute auto vibe based on event data
export const computeAutoVibe = (event: {
  created_at?: string;
  favorites_count?: number;
  click_count?: number;
  category_sub_id?: string;
}): { label: VibeLabel; level: 1 | 2 | 3 } | null => {
  const now = new Date();
  const createdAt = event.created_at ? new Date(event.created_at) : null;
  const daysSinceCreation = createdAt 
    ? Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // "Neu" - less than 7 days old
  if (daysSinceCreation !== null && daysSinceCreation < 7) {
    return { label: 'neu', level: 2 };
  }

  // "Trending" - high click count (simulated threshold)
  if (event.click_count && event.click_count > 50) {
    const level = event.click_count > 200 ? 3 : event.click_count > 100 ? 2 : 1;
    return { label: 'trending', level: level as 1 | 2 | 3 };
  }

  // "Must-See" - many favorites
  if (event.favorites_count && event.favorites_count > 20) {
    const level = event.favorites_count > 100 ? 3 : event.favorites_count > 50 ? 2 : 1;
    return { label: 'must-see', level: level as 1 | 2 | 3 };
  }

  // "Geheimtipp" - smaller venues/museums with few clicks but good ratings
  if (event.category_sub_id === 'museum-kunst' && (!event.click_count || event.click_count < 20)) {
    return { label: 'geheimtipp', level: 2 };
  }

  return null;
};

export default VibeBadge;
