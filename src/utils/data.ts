/**
 * Helpers de data TZ-safe.
 *
 * Por que existe: o backend salva datas como meia-noite UTC (`2026-06-01T00:00:00.000Z`)
 * e o frontend, rodando em BR (UTC-3), ao fazer `new Date(iso).toLocaleDateString('pt-BR')`
 * acaba convertendo a data pro dia anterior (`31/05/2026 21:00:00 BRT`).
 *
 * Solução: extrair a parte YYYY-MM-DD do começo da string ISO e formatar
 * direto, sem passar pelo Date constructor. Pra datas puras (vencimento,
 * início/fim de contrato etc.), isso é o comportamento correto.
 *
 * Pra timestamps reais (createdAt, hora de pagamento etc.), use `fmtDateTime`
 * que aí sim usa Date + toLocaleString.
 */

/** Formata data ISO ou Date como "DD/MM/AAAA". TZ-safe — extrai a parte de
 *  data direto da string ISO, sem ficar à mercê do timezone do navegador. */
export const fmtDate = (d?: string | Date | null): string => {
  if (!d) return '—'
  const s = typeof d === 'string' ? d : d.toISOString()
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  if (m) return `${m[3]}/${m[2]}/${m[1]}`
  // Fallback (improvável)
  return new Date(s).toLocaleDateString('pt-BR')
}

/** Formata data+hora ISO como "DD/MM/AAAA HH:MM". Usa Date — pra timestamps
 *  reais (createdAt, dtPagamento etc.), onde o horário importa. */
export const fmtDateTime = (d?: string | Date | null): string => {
  if (!d) return '—'
  return new Date(d).toLocaleString('pt-BR')
}

/** Retorna a parte YYYY-MM-DD de uma data (TZ-safe). Útil pra comparar
 *  datas sem se preocupar com hora/timezone. */
export const isoDate = (d?: string | Date | null): string | null => {
  if (!d) return null
  const s = typeof d === 'string' ? d : d.toISOString()
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}
