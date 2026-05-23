import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Modal genérico que renderiza via portal direto no document.body.
 *
 * Por que portal? Porque qualquer parent com `transform`, `filter`,
 * `perspective` ou animação em curso cria um novo "containing block"
 * pro CSS — e isso faz `position: fixed` parar de ser relativo à
 * viewport e passar a ser relativo a esse parent, quebrando overlays
 * de modal. A classe `.animate-fade-in` que está em todas as páginas
 * do app tem `transform: translateY(...)` na keyframe, então sem
 * portal o modal fica preso dentro do container animado.
 */
export function Modal({
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}) {
  // ESC fecha
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div className="min-h-screen flex items-center justify-center p-4">
        <div
          className={`bg-white rounded-2xl p-6 w-full ${maxWidth}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
