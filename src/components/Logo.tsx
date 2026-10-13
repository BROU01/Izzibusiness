/**
 * Monogramme Izzibusiness : « IZ » en encre sur fond acide, cadre 3 px.
 * Décoratif à côté du nom écrit : alt vide via aria-hidden.
 */
export default function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        fill="#ffe500"
        stroke="#14120d"
        strokeWidth="3"
      />
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fill="#14120d"
        fontSize="18"
        fontWeight="900"
        fontFamily="Fraunces, Georgia, serif"
      >
        IZ
      </text>
    </svg>
  );
}
