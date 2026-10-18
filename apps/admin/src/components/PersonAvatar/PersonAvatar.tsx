import clsx from 'clsx';
import styles from './PersonAvatar.module.scss';

const TONES = ['green', 'gold', 'blue', 'violet', 'coral'] as const;

interface PersonAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function PersonAvatar({ name, size = 'md', ring }: PersonAvatarProps) {
  const tone = TONES[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span className={clsx(styles.avatar, styles[size], ring && styles.ring)} data-tone={tone} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
