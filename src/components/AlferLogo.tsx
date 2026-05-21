export default function AlferLogo({ size = 40 }: { size?: number }) {
  const s = size
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Ícone quadrado amarelo */}
      <svg width={s} height={s} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="6" fill="#FFAF06"/>
        {/* Gancho no topo */}
        <path d="M20 3 L20 7" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 7 Q20 5 24 7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
        {/* Correntes */}
        <line x1="16" y1="7" x2="13" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="24" y1="7" x2="27" y2="14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Container */}
        <rect x="10" y="14" width="20" height="18" rx="2" fill="white"/>
        {/* Letra a */}
        <text x="20" y="27" textAnchor="middle" fill="#FFAF06" fontSize="13" fontFamily="Arial" fontWeight="bold">a</text>
      </svg>
      {/* Texto */}
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: s * 0.45, fontWeight: 600, color: '#555555', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.5px' }}>alfer</div>
        <div style={{ fontSize: s * 0.22, fontWeight: 700, color: '#FFAF06', fontFamily: 'Inter, sans-serif', letterSpacing: '1px' }}>EQUIPAMENTOS</div>
      </div>
    </div>
  )
}
