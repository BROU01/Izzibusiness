export default function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle background */}
      <circle cx="60" cy="60" r="58" stroke="#1c1917" strokeWidth="3" fill="none" />

      {/* I */}
      <rect x="28" y="30" width="8" height="42" rx="2" fill="#1c1917" />
      <rect x="28" y="24" width="8" height="6" rx="2" fill="#1c1917" />
      <rect x="28" y="72" width="8" height="6" rx="2" fill="#1c1917" />

      {/* Z with network nodes */}
      <path
        d="M44 30 L68 30 L44 72 L68 72"
        stroke="#1c1917"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Network nodes on the Z */}
      <circle cx="44" cy="30" r="4" fill="#1c1917" />
      <circle cx="68" cy="30" r="4" fill="#1c1917" />
      <circle cx="44" cy="72" r="4" fill="#1c1917" />
      <circle cx="68" cy="72" r="4" fill="#1c1917" />
      <circle cx="56" cy="51" r="3.5" fill="#1c1917" />

      {/* Network lines */}
      <line x1="44" y1="30" x2="56" y2="51" stroke="#1c1917" strokeWidth="1.5" />
      <line x1="68" y1="30" x2="56" y2="51" stroke="#1c1917" strokeWidth="1.5" />
      <line x1="44" y1="72" x2="56" y2="51" stroke="#1c1917" strokeWidth="1.5" />
      <line x1="68" y1="72" x2="56" y2="51" stroke="#1c1917" strokeWidth="1.5" />

      {/* Sparkle on top right */}
      <path d="M74 24 L76 18 L78 24 L84 26 L78 28 L76 34 L74 28 L68 26 Z" fill="#b45309" />

      {/* Arrow underneath */}
      <path
        d="M50 82 Q56 88 62 82"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M59 79 L62 82 L59 85"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Text */}
      <text
        x="60"
        y="102"
        textAnchor="middle"
        fill="#1c1917"
        fontSize="13"
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        Izzibusiness
      </text>
    </svg>
  );
}
