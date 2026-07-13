export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 180 54"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="SimLab Home Page"
      role="img"
    >
      <text x="0" y="42" fontFamily="Roboto, sans-serif" fontSize="42" fontWeight="700" fill="#e67e22">
        S
      </text>
      <text x="28" y="42" fontFamily="Roboto, sans-serif" fontSize="42" fontWeight="700" fill="#3498db">
        i
      </text>
      <text x="44" y="42" fontFamily="Roboto, sans-serif" fontSize="42" fontWeight="700" fill="#2ecc71">
        m
      </text>
      <text x="88" y="42" fontFamily="Roboto, sans-serif" fontSize="42" fontWeight="700" fill="#9b59b6">
        L
      </text>
      <text x="118" y="42" fontFamily="Roboto, sans-serif" fontSize="42" fontWeight="700" fill="#e74c3c">
        a
      </text>
      <text x="148" y="42" fontFamily="Roboto, sans-serif" fontSize="42" fontWeight="700" fill="#f1c40f">
        b
      </text>
      <text x="0" y="52" fontFamily="Roboto, sans-serif" fontSize="8" fill="#666">
        Interactive Simulations
      </text>
    </svg>
  )
}
