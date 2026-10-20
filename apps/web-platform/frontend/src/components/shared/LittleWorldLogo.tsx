'use client';

import React from 'react';

interface LittleWorldLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function LittleWorldLogo({
  className = '',
  size = 38,
  showText = true,
}: LittleWorldLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Intertwined Celestial Hearts SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="lw-space-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e112a" />
            <stop offset="50%" stopColor="#0f0917" />
            <stop offset="100%" stopColor="#1f0a1c" />
          </linearGradient>

          <linearGradient id="lw-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="40%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          <linearGradient id="lw-sunset-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>

          <linearGradient id="lw-orbit-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0" />
            <stop offset="40%" stopColor="#f43f5e" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#fb7185" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
          </linearGradient>

          <filter id="lw-heart-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Celestial Orb Background */}
        <circle cx="250" cy="210" r="160" fill="url(#lw-space-grad)" stroke="rgba(244, 63, 94, 0.3)" strokeWidth="3" />

        {/* Stars */}
        <circle cx="160" cy="140" r="3.5" fill="#fde047" opacity="0.9" />
        <circle cx="340" cy="130" r="3.5" fill="#fde047" opacity="0.9" />
        <circle cx="360" cy="240" r="2.5" fill="#fda4af" opacity="0.8" />
        <circle cx="130" cy="250" r="2.5" fill="#fda4af" opacity="0.8" />
        <circle cx="250" cy="80" r="4" fill="#ffffff" opacity="0.95" />

        {/* Orbit Ring */}
        <ellipse
          cx="250"
          cy="215"
          rx="180"
          ry="70"
          fill="none"
          stroke="url(#lw-orbit-grad)"
          strokeWidth="6"
          transform="rotate(-20 250 215)"
          strokeLinecap="round"
        />

        {/* Intertwined Couple Hearts */}
        <g filter="url(#lw-heart-glow)">
          <path
            d="M 215 140 C 175 110, 130 145, 145 195 C 160 245, 230 285, 240 295 C 230 255, 195 210, 205 175 C 210 160, 220 150, 230 145 Z"
            fill="url(#lw-pink-grad)"
            opacity="0.95"
          />
          <path
            d="M 285 140 C 325 110, 370 145, 355 195 C 340 245, 270 285, 260 295 C 270 255, 305 210, 295 175 C 290 160, 280 150, 270 145 Z"
            fill="url(#lw-sunset-grad)"
            opacity="0.9"
          />
          <path
            d="M 250 165 C 235 140, 205 155, 220 185 C 230 205, 250 230, 250 230 C 250 230, 270 205, 280 185 C 295 155, 265 140, 250 165 Z"
            fill="#f43f5e"
            opacity="0.85"
          />
        </g>
        <circle cx="250" cy="200" r="9" fill="#fde047" opacity="0.95" filter="url(#lw-heart-glow)" />
      </svg>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-white flex items-center gap-1.5">
            A LITTLE <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">WORLD</span>
          </span>
          <span className="mt-1 text-[8.5px] font-bold uppercase tracking-[0.26em] text-rose-300/80">
            With Us • Private Space
          </span>
        </div>
      )}
    </div>
  );
}

export default LittleWorldLogo;
