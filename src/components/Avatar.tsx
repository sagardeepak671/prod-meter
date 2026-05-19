'use client';

import { useState } from 'react';

const CUTE_ANIMALS = ['🐱', '🐶', '🦊', '🐼', '🐨', '🐰', '🦁', '🐸', '🐧', '🦄', '🐯', '🐻', '🦉', '🐺', '🐹', '🐮'];

const GRADIENT_PAIRS = [
  ['#7c3aed', '#a78bfa'],
  ['#2563eb', '#60a5fa'],
  ['#059669', '#34d399'],
  ['#d97706', '#fbbf24'],
  ['#dc2626', '#f87171'],
  ['#7c3aed', '#ec4899'],
  ['#0891b2', '#22d3ee'],
  ['#4f46e5', '#818cf8'],
];

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface AvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  uid?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ photoURL, displayName, uid = 'default', size = 'sm' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  };

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName || 'User avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover`}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    );
  }

  const hash = hashStr(uid);
  const animal = CUTE_ANIMALS[hash % CUTE_ANIMALS.length];
  const [from, to] = GRADIENT_PAIRS[hash % GRADIENT_PAIRS.length];

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center shrink-0`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
      title={displayName || 'User'}
    >
      <span className="leading-none">{animal}</span>
    </div>
  );
}
