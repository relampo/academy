import type { CSSProperties } from "react";
import {
  Activity,
  Asterisk,
  Atom,
  AudioWaveform,
  Bolt,
  CircleDot,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSun,
  CloudSunRain,
  Droplets,
  Flame,
  Leaf,
  Magnet,
  Moon,
  Mountain,
  MountainSnow,
  Orbit,
  Radar,
  Satellite,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tornado,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AvatarPreset } from "../lib/leaderboardIdentity";

const avatarIcons: Record<string, LucideIcon> = {
  activity: Activity,
  asterisk: Asterisk,
  atom: Atom,
  audioWaveform: AudioWaveform,
  bolt: Bolt,
  circleDot: CircleDot,
  cloudFog: CloudFog,
  cloudHail: CloudHail,
  cloudLightning: CloudLightning,
  cloudRain: CloudRain,
  cloudRainWind: CloudRainWind,
  cloudSun: CloudSun,
  cloudSunRain: CloudSunRain,
  droplets: Droplets,
  flame: Flame,
  leaf: Leaf,
  magnet: Magnet,
  moon: Moon,
  mountain: Mountain,
  mountainSnow: MountainSnow,
  orbit: Orbit,
  radar: Radar,
  satellite: Satellite,
  snowflake: Snowflake,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  tornado: Tornado,
  waves: Waves,
  wind: Wind,
  zap: Zap,
};

function getAvatarIcon(preset: AvatarPreset) {
  return avatarIcons[preset.iconKey] ?? Sparkles;
}

function AvatarEmblem({
  className = "",
  preset,
  size = 18,
}: {
  className?: string;
  preset: AvatarPreset;
  size?: number;
}) {
  const Icon = getAvatarIcon(preset);

  return (
    <span
      className={`avatar-emblem ${className}`}
      style={
        {
          "--avatar-color": preset.background,
          "--avatar-radius": preset.radius,
          "--avatar-clip": preset.clipPath,
        } as CSSProperties
      }
      title={preset.label}
    >
      <Icon aria-hidden="true" size={size} strokeWidth={2.35} />
    </span>
  );
}

export { AvatarEmblem, getAvatarIcon };
