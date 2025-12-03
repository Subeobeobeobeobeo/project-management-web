import React from 'react';

/**
 * Stylized 3D-inspired mascot for Loan Nguyen.
 * Pure SVG so we can keep shipping inside the bundle without external assets.
 */
export default function LoanMascot({ size = 220 }) {
  const skinLight = '#f5c6b5';
  const skinShadow = '#e4a894';
  const hairDark = '#111827';
  const hairHighlight = '#374151';
  const suitPrimary = '#f97316';
  const suitSecondary = '#0f172a';

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 220 220"
      role="img"
      aria-label="3D inspired illustration of Loan Nguyen"
      className="loan-mascot"
    >
      <defs>
        <linearGradient id="mascot-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
        <radialGradient id="skin" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="100%" stopColor={skinShadow} />
        </radialGradient>
        <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hairHighlight} />
          <stop offset="100%" stopColor={hairDark} />
        </linearGradient>
        <linearGradient id="suit" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={suitPrimary} />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="pants" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#172554" />
          <stop offset="100%" stopColor={suitSecondary} />
        </linearGradient>
        <filter id="innerShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.25" />
        </filter>
      </defs>

      <rect width="220" height="220" rx="32" fill="url(#mascot-bg)" />

      {/* body */}
      <g filter="url(#innerShadow)">
        <path
          d="M70 210 C68 180 72 150 94 140 L126 140 C148 150 152 180 150 210 Z"
          fill="url(#pants)"
        />
        <path
          d="M80 150 C80 130 88 112 110 112 C132 112 140 130 140 150 L140 162 C136 170 126 178 110 178 C94 178 84 170 80 162 Z"
          fill="url(#suit)"
        />
        <path
          d="M65 160 C68 150 80 140 86 140 L92 150 C90 162 82 172 70 176 Z"
          fill="#fbbf24"
        />
        <path
          d="M155 176 C144 172 136 162 134 150 L140 140 C148 140 160 150 163 160 Z"
          fill="#fbbf24"
        />
      </g>

      {/* neck */}
      <ellipse cx="110" cy="126" rx="24" ry="16" fill={skinShadow} />

      {/* face */}
      <circle cx="110" cy="100" r="58" fill="url(#skin)" />

      {/* hair base */}
      <path
        d="M46 112 C46 60 92 32 110 32 C128 32 174 60 174 112 C160 86 146 78 110 78 C74 78 60 86 46 112 Z"
        fill="url(#hair)"
      />
      {/* textured bangs */}
      <path
        d="M60 78 C72 54 98 46 110 46 C122 46 148 54 160 78 C136 70 126 70 110 70 C94 70 84 70 60 78 Z"
        fill={hairDark}
      />

      {/* eyes */}
      <ellipse cx="88" cy="100" rx="14" ry="16" fill="#fff" />
      <ellipse cx="134" cy="100" rx="14" ry="16" fill="#fff" />
      <circle cx="88" cy="102" r="6" fill="#1f2937" />
      <circle cx="134" cy="102" r="6" fill="#1f2937" />
      <circle cx="86" cy="100" r="2" fill="#fff" />
      <circle cx="132" cy="100" r="2" fill="#fff" />

      {/* eyelashes */}
      <path d="M70 92 Q88 80 106 92" stroke={hairDark} strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M114 92 Q132 80 150 92" stroke={hairDark} strokeWidth="5" strokeLinecap="round" fill="none" />

      {/* cheeks */}
      <ellipse cx="78" cy="118" rx="14" ry="10" fill="#f8a3b3" opacity="0.7" />
      <ellipse cx="142" cy="118" rx="14" ry="10" fill="#f8a3b3" opacity="0.7" />

      {/* nose + smile */}
      <path d="M110 116 q-4 12 0 14" stroke="#d57d68" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M86 134 Q110 150 134 134" stroke="#b45309" strokeWidth="6" strokeLinecap="round" fill="none" />

      {/* head shadow */}
      <ellipse cx="110" cy="168" rx="40" ry="12" fill="rgba(15,23,42,0.15)" />
    </svg>
  );
}
