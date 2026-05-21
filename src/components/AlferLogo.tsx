export default function AlferLogo({ size = 40, height }: { size?: number; height?: number }) {
  const h = height || size
  return (
    <img
      src="/logo.jpg"
      alt="Alfer Equipamentos"
      style={{ height: h, width: 'auto', objectFit: 'contain', maxWidth: '200px' }}
    />
  )
}
