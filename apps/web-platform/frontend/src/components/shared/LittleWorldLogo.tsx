'use client';

import React from 'react';

interface LittleWorldLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function LittleWorldLogo({
  className = '',
  size = 40,
  showText = true,
}: LittleWorldLogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Clean Celestial Hearts Tile */}
      <img
        src="/logo.svg"
        alt="A Little World Icon"
        width={size}
        height={size}
        className="shrink-0 object-contain rounded-2xl drop-shadow-[0_0_12px_rgba(244,63,94,0.25)] transition-transform duration-200 hover:scale-105"
      />

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-[16px] font-bold tracking-tight text-white">
            A Little World
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/80">
            With Us • Private Space
          </span>
        </div>
      )}
    </div>
  );
}

export default LittleWorldLogo;
