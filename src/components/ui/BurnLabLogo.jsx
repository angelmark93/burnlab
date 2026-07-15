import React from 'react';

/* "The Catalyst" monogram — premium inline SVG brand mark + editorial wordmark. */
export const BurnLabLogo = ({ className = "h-8" }) => {
  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      {/* SVG Icon Mark */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
      >
        <defs>
          {/* Volt lime gradient — Noir accent */}
          <linearGradient id="logo-orange-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C4EE3A" />
            <stop offset="100%" stopColor="#E9FBA0" />
          </linearGradient>

          {/* Subtle glow filter that activates on group hover */}
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Glow behind the orange loops (fades in on hover) */}
        <path
          d="M 45 22 L 68 22 C 78 22 84 30 79 39 C 74 47 64 47 50 47 M 45 47 L 72 47 C 82 47 88 56 83 66 C 78 74 68 74 50 74 L 45 74"
          stroke="url(#logo-orange-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-sm"
        />

        {/* The 'L' (Lab Pillar) — crisp light ink */}
        <path
          d="M 28 16 L 28 80 L 48 80"
          stroke="#F4F4F2"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-500"
        />

        {/* The 'B' (Burn Wing) — energetic gradient */}
        <path
          d="M 45 22 L 68 22 C 78 22 84 30 79 39 C 74 47 64 47 50 47 M 45 47 L 72 47 C 82 47 88 56 83 66 C 78 74 68 74 50 74 L 45 74"
          stroke="url(#logo-orange-gradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-500"
        />
      </svg>

      {/* Typographic editorial wordmark */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline tracking-tight uppercase font-extrabold text-lg leading-none">
          <span className="text-white transition-colors duration-300">BURN</span>
          <span className="text-zinc-500 group-hover:text-white transition-colors duration-300">LAB</span>
        </div>
        <span className="text-[7px] tracking-[0.25em] text-zinc-600 uppercase font-bold leading-none mt-1">
          PERFORMANCE TECH
        </span>
      </div>
    </div>
  );
};
