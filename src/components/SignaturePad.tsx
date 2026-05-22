import { useEffect, useRef, useState } from 'react'
import { Eraser, Check } from 'lucide-react'

type Props = {
  value?: string | null
  onChange: (dataUrl: string | null) => void
  label?: string
  nome?: string
  onNomeChange?: (nome: string) => void
  nomeLabel?: string
  height?: number
}

/**
 * Pad de assinatura — funciona com mouse e toque (tablet).
 * value/onChange é o dataURL PNG do canvas (ou null se vazio).
 */
export default function SignaturePad({
  value,
  onChange,
  label = 'Assinatura',
  nome,
  onNomeChange,
  nomeLabel = 'Nome',
  height = 180,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const [hasContent, setHasContent] = useState(!!value)

  // Inicializa canvas (resize-aware, retina-aware) e carrega valor existente
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      // Recarrega assinatura existente se houver
      if (value) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0, w, h)
        img.src = value
      }
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  const getPos = (e: any) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const ev = e.touches?.[0] || e
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top }
  }

  const start = (e: any) => {
    e.preventDefault()
    drawingRef.current = true
    lastPosRef.current = getPos(e)
  }
  const move = (e: any) => {
    if (!drawingRef.current) return
    e.preventDefault()
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    const last = lastPosRef.current!
    ctx.beginPath()
    ctx.moveTo(last.x, last.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPosRef.current = pos
    setHasContent(true)
  }
  const end = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPosRef.current = null
    const canvas = canvasRef.current!
    onChange(canvas.toDataURL('image/png'))
  }

  const limpar = () => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          {hasContent && (
            <span className="flex items-center gap-1 text-xs text-green-700">
              <Check className="w-3 h-3" /> Capturada
            </span>
          )}
          <button
            type="button"
            onClick={limpar}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
          >
            <Eraser className="w-3 h-3" /> Limpar
          </button>
        </div>
      </div>
      <div
        className="w-full rounded-lg overflow-hidden"
        style={{ border: '2px dashed #C7C2BB', background: '#fff' }}
      >
        <canvas
          ref={canvasRef}
          className="w-full block touch-none cursor-crosshair"
          style={{ height }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
      {onNomeChange && (
        <input
          type="text"
          value={nome || ''}
          onChange={(e) => onNomeChange(e.target.value)}
          placeholder={nomeLabel}
          className="w-full px-3 py-2 bg-white rounded-lg text-sm outline-none"
          style={{ border: '1px solid #E0DDD8' }}
        />
      )}
    </div>
  )
}
