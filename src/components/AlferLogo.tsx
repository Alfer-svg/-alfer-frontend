export default function AlferLogo({ size = 40, height }: { size?: number; height?: number }) {
  const h = height || size * 0.6
  return (
    <img
      src="/logo.jpg"
      alt="Alfer Equipamentos"
      style={{ height: h, width: 'auto', objectFit: 'contain' }}
    />
  )
}
