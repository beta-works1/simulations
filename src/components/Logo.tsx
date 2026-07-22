export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 54"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SimLab Home Page"
      role="img"
    >
      <text x="0" y="42" fontFamily="Space Grotesk, sans-serif" fontSize="42" fontWeight="700" fill="#fb923c">
        S
      </text>
      <text x="28" y="42" fontFamily="Space Grotesk, sans-serif" fontSize="42" fontWeight="700" fill="#38bdf8">
        i
      </text>
      <text x="44" y="42" fontFamily="Space Grotesk, sans-serif" fontSize="42" fontWeight="700" fill="#34d399">
        m
      </text>
      <text x="88" y="42" fontFamily="Space Grotesk, sans-serif" fontSize="42" fontWeight="700" fill="#67e8f9">
        L
      </text>
      <text x="118" y="42" fontFamily="Space Grotesk, sans-serif" fontSize="42" fontWeight="700" fill="#f87171">
        a
      </text>
      <text x="148" y="42" fontFamily="Space Grotesk, sans-serif" fontSize="42" fontWeight="700" fill="#fbbf24">
        b
      </text>
      <text x="0" y="52" fontFamily="Space Grotesk, sans-serif" fontSize="8" fill="currentColor" opacity="0.55">
        Interactive Simulations
      </text>
    </svg>
  )
}
