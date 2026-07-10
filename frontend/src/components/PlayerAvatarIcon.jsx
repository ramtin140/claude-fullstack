import { Gamepad2, Swords, Flame, Zap, Star, Crown } from 'lucide-react';
import { cn } from '../lib/utils.js';

const variants = [
  { Icon: Gamepad2, className: 'bg-gradient-to-br from-gold-light to-gold text-[#241102]' },
  { Icon: Swords, className: 'bg-gradient-to-br from-magenta-light to-magenta text-white' },
  { Icon: Flame, className: 'bg-gradient-to-br from-gold to-magenta text-white' },
  { Icon: Zap, className: 'bg-gradient-to-br from-magenta-light to-brand-700 text-white' },
  { Icon: Star, className: 'bg-gradient-to-br from-brand-700 to-magenta text-white' },
  { Icon: Crown, className: 'bg-gradient-to-br from-gold-light to-brand-700 text-white' },
];

function hashSeed(seed) {
  const str = String(seed ?? '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function PlayerAvatarIcon({ seed, size = 18, className }) {
  const variant = variants[hashSeed(seed) % variants.length];
  const Icon = variant.Icon;
  return (
    <span className={cn('flex h-full w-full items-center justify-center rounded-full', variant.className, className)}>
      <Icon size={size} />
    </span>
  );
}
