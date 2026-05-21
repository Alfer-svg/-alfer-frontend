export default function AlferLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size * 2.4} height={size} viewBox="0 0 96 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Quadrado amarelo */}
      <rect width="40" height="40" rx="6" fill="#FFAF06"/>
      {/* Gancho */}
      <path d="M20 4 L20 8 M17 8 Q20 6 23 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      {/* Correntes */}
      <line x1="15" y1="8" x2="13" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="25" y1="8" x2="27" y2="16" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Container */}
      <rect x="11" y="16" width="18" height="16" rx="2" fill="white" opacity="0.9"/>
      {/* Letra a */}
      <text x="20" y="28" textAnchor="middle" fill="#FFAF06" fontSize="12" fontFamily="Arial" fontWeight="bold">a</text>
      {/* Texto alfer */}
      <text x="48" y="22" fill="#555555" fontSize="16" fontFamily="Arial" fontWeight="600">alfer</text>
      {/* Texto EQUIPAMENTOS */}
      <text x="48" y="34" fill="#FFAF06" fontSize="8" fontFamily="Arial" fontWeight="700" letterSpacing="0.5">EQUIPAMENTOS</text>
    </svg>
  )
}
