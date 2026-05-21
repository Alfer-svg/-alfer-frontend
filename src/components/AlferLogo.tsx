export default function AlferLogo({ height = 40 }: { height?: number }) {
  return (
    <img
      src="/logo.jpg"
      alt="Alfer Equipamentos"
      style={{ height, width: 'auto', objectFit: 'contain' }}
    />
  )
}
